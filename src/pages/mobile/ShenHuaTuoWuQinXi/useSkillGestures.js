import { nextTick, onBeforeUnmount, onMounted } from 'vue'
import { measureGap, resolveInsertIndex, shiftFor } from './sortable.js'

/**
 * useSkillGestures — 技能牌手势（神华佗页面专用，不通用）
 *
 * 技能内容由 @/ui/SkillCard 展示、列表结构由本页 Index.vue 组织，交互规则留在这里：
 *   · 长按 pressDelay 不放 → 该项浮起，纵向拖动排序 → onMove(from, to)
 *   · 横向左滑超过 removeThreshold（或距离过半且划得快）→ 该项移出 → onRemove(index)
 *   · 长按未满就纵向滑动 → 放行给页面滚动（touch-action: pan-y + 拖拽后压住 touchmove）
 *
 * 位移一律内联写在元素上（跟手期间不加过渡）：拖动只动被拖项的 transform +
 * 其余项的让位量，让位量与提交后的真实布局一致，故数据一变不跳版；
 * 移除则先让卡片滑走、高度收敛，再回调 onRemove 摘数据 —— 摘的时候布局已经收好。
 *
 * DOM 契约（与 Index.vue 的模板一致，改类名要两边同步）：
 *   ul.skill-board                        列表根
 *   li.skill-board__item[data-skill-key]  单项：被搬动 / 被移除的就是它
 *   .skill-board__card                    卡片本体：位移施加在它身上
 *   状态类挂回 li：is-pressed / is-dragging / is-swiping（样式在 Index.vue 里）
 *
 * @param {() => HTMLElement|null} getList 取列表根元素（本页技能列表的 ul）
 * @param {{ pressDelay?: number, removeThreshold?: number, onMove?: (from:number,to:number)=>void, onRemove?: (index:number)=>void }} options
 */
const TOLERANCE = 8
/** 横向意图判定：|dx| 大于 |dy| 就算左滑（触屏上略斜的划动很常见，不宜要求太偏） */
const SWIPE_BIAS = 1
/** 快速轻划：距离过半 + 速度达标也照删（短促左滑不该被判成「没滑够」） */
const FLICK_RATIO = 0.55
const FLICK_SPEED = 0.5
const SETTLE_MS = 260
const COLLAPSE_MS = 360

const LIFT_TRANSITION =
  'transform var(--duration-normal) var(--ease-enter), box-shadow var(--duration-normal) var(--ease-enter)'
const MOVE_TRANSITION =
  'transform 0ms, box-shadow var(--duration-normal) var(--ease-enter)'
const SETTLE_TRANSITION = 'transform var(--duration-normal) var(--ease-enter)'
const SHIFT_TRANSITION = 'transform var(--duration-normal) var(--ease-enter)'
const COLLAPSE_TRANSITION =
  'height var(--duration-slow) var(--ease-enter), margin-bottom var(--duration-slow) var(--ease-enter)'
const OUT_TRANSITION =
  'transform var(--duration-slow) var(--ease-enter), opacity var(--duration-normal) var(--ease-out)'

export function useSkillGestures(getList, options = {}) {
  const pressDelay = options.pressDelay ?? 360
  const removeThreshold = options.removeThreshold ?? 72
  const onMove = options.onMove
  const onRemove = options.onRemove

  let pointerId = null
  /** idle | press | swipe | drag */
  let intent = 'idle'
  let startX = 0
  let startY = 0
  let pressTimer = 0
  let settleTimer = 0
  let collapseTimer = 0
  let rects = []
  let step = 0
  let fromIndex = -1
  let dropIndex = -1
  let swipeDx = 0
  let swipeAt = 0
  let pressEl = null
  let dragEl = null
  let swipeEl = null
  let removing = false

  const items = () => [...(getList()?.querySelectorAll('.skill-board__item') ?? [])]
  const cardOf = el => el?.querySelector('.skill-board__card') ?? null

  function buzz(ms) {
    try {
      navigator.vibrate?.(ms)
    } catch {
      /* 不支持震动 API：忽略，不打断手势 */
    }
  }

  function clearPress() {
    window.clearTimeout(pressTimer)
    pressTimer = 0
    pressEl?.classList.remove('is-pressed')
    pressEl = null
  }

  /** 长按成立：浮起并量一次各项几何，此后整个手势都用这份快照 */
  function lift() {
    pressTimer = 0
    if (intent !== 'press' || !pressEl) return

    const els = items()
    const index = els.indexOf(pressEl)
    if (index < 0) return

    rects = els.map(el => {
      const rect = el.getBoundingClientRect()
      return { top: rect.top, height: rect.height }
    })
    if (!rects[index]) return

    step = rects[index].height + measureGap(rects)
    fromIndex = index
    dropIndex = index
    intent = 'drag'
    dragEl = pressEl
    dragEl.classList.remove('is-pressed')
    dragEl.classList.add('is-dragging')
    dragEl.style.zIndex = '3'
    dragEl.style.transition = LIFT_TRANSITION
    dragEl.style.transform = 'translate3d(0, 0, 0) scale(1.02)'
    pressEl = null
    buzz(8)
  }

  /** 跟手拖动：被拖项跟着指针，其余项按落位让出空间 */
  function moveDrag(dy) {
    if (!dragEl) return
    dragEl.style.transition = MOVE_TRANSITION
    dragEl.style.transform = `translate3d(0, ${dy}px, 0) scale(1.02)`

    const rect = rects[fromIndex]
    if (!rect) return
    const to = resolveInsertIndex(rects, fromIndex, rect.top + dy + rect.height / 2)
    if (to === dropIndex) return

    dropIndex = to
    items().forEach((el, index) => {
      if (el === dragEl) return
      const shift = shiftFor(index, fromIndex, to, step)
      el.style.transition = SHIFT_TRANSITION
      el.style.transform = shift ? `translate3d(0, ${shift}px, 0)` : ''
    })
  }

  /** 松手落位：提交新顺序，再把被拖项从「手指处」补间回「新槽位」 */
  async function settleDrag() {
    const el = dragEl
    const from = fromIndex
    const to = dropIndex
    dragEl = null
    if (!el) return

    const visualTop = el.getBoundingClientRect().top
    el.classList.remove('is-dragging')

    // 摘位移必须先关过渡再清：带着过渡去清，测量会取到补间中的中间值，
    // 落位就会先跳一下再补间回来。兄弟项的让位量同理 —— 它们新的原生位置
    // 恰好就是让位后的视觉位置，无过渡地清掉即原地不动。
    const others = items().filter(other => other !== el)
    el.style.transition = 'none'
    el.style.transform = ''
    el.style.zIndex = ''
    others.forEach(other => {
      other.style.transition = 'none'
      other.style.transform = ''
    })

    if (to !== from) onMove?.(from, to)

    await nextTick()
    const delta = visualTop - el.getBoundingClientRect().top
    if (Math.abs(delta) >= 1) {
      // FLIP：先摆回松手时的位置，再补间到新槽位
      el.style.transform = `translate3d(0, ${delta}px, 0) scale(1.02)`
      void el.offsetHeight
    }
    el.style.transition = SETTLE_TRANSITION
    el.style.transform = ''

    window.clearTimeout(settleTimer)
    settleTimer = window.setTimeout(() => {
      el.style.transition = ''
      others.forEach(other => {
        other.style.transition = ''
      })
    }, SETTLE_MS)
  }

  /** 左滑是否算「要删」：滑得够远，或者距离过半但划得够快（触屏上的短促轻划） */
  function crossedRemoveLine() {
    if (swipeDx <= -removeThreshold) return true
    const duration = Math.max(1, Date.now() - swipeAt)
    const speed = Math.abs(swipeDx) / duration
    return swipeDx <= -removeThreshold * FLICK_RATIO && speed >= FLICK_SPEED
  }

  /** 未过阈值：卡片滑回原位 */
  function settleSwipe() {
    const el = swipeEl
    const card = cardOf(el)
    swipeEl = null
    swipeDx = 0
    if (!card) return

    card.style.transition = SETTLE_TRANSITION
    card.style.transform = ''
    window.clearTimeout(settleTimer)
    settleTimer = window.setTimeout(() => {
      card.style.transition = ''
      el.classList.remove('is-swiping')
    }, SETTLE_MS)
  }

  /** 过阈值：卡片滑走 + 高度收敛，收好了再回调摘数据 */
  function collapse() {
    const el = swipeEl
    const card = cardOf(el)
    swipeEl = null
    swipeDx = 0
    if (!el) return

    removing = true
    el.style.height = `${Math.round(el.getBoundingClientRect().height)}px`
    el.style.overflow = 'hidden'
    if (card) {
      card.style.transition = OUT_TRANSITION
      card.style.transform = 'translate3d(-110%, 0, 0)'
      card.style.opacity = '0'
    }
    // 先结算一次样式，让起始高度成为过渡起点（同一帧内连改两次不会产生过渡）
    void el.offsetHeight
    el.style.transition = COLLAPSE_TRANSITION
    el.style.height = '0px'
    el.style.marginBottom = '0px'

    window.clearTimeout(collapseTimer)
    collapseTimer = window.setTimeout(() => {
      removing = false
      el.classList.remove('is-swiping')
      const index = items().indexOf(el)
      if (index >= 0) onRemove?.(index)
    }, COLLAPSE_MS)
  }

  function onPointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    if (intent !== 'idle' || removing) return

    const list = getList()
    const li = event.target?.closest?.('.skill-board__item')
    if (!list || !li || !list.contains(li)) return

    const index = items().indexOf(li)
    if (index < 0) return

    intent = 'press'
    pointerId = event.pointerId
    startX = event.clientX
    startY = event.clientY
    fromIndex = index
    dropIndex = index
    pressEl = li
    li.classList.add('is-pressed')

    // 指针捕获：手滑出列表也继续收事件
    try {
      list.setPointerCapture(event.pointerId)
    } catch {
      /* 合成事件 / 个别浏览器不支持捕获：退化为普通事件流 */
    }

    window.clearTimeout(pressTimer)
    pressTimer = window.setTimeout(lift, pressDelay)
  }

  function onPointerMove(event) {
    if (event.pointerId !== pointerId || intent === 'idle') return

    const dx = event.clientX - startX
    const dy = event.clientY - startY

    if (intent === 'press') {
      if (Math.abs(dx) < TOLERANCE && Math.abs(dy) < TOLERANCE) return
      window.clearTimeout(pressTimer)
      pressTimer = 0

      if (Math.abs(dx) > Math.abs(dy) * SWIPE_BIAS) {
        // 横向：左滑移除
        const card = cardOf(pressEl)
        pressEl?.classList.remove('is-pressed')
        swipeEl = pressEl
        pressEl = null
        intent = 'swipe'
        // 滑出层只在左滑期间显形（平时藏着，免得卡片浮起缩放时漏出红底）
        swipeEl.classList.add('is-swiping')
        swipeDx = Math.min(0, dx)
        swipeAt = Date.now()
        if (card) {
          card.style.transition = 'none'
          card.style.transform = `translate3d(${swipeDx}px, 0, 0)`
        }
      } else {
        // 纵向：用户想滚页面，本次手势到此为止
        clearPress()
        intent = 'idle'
      }
      return
    }

    if (intent === 'drag') {
      moveDrag(dy)
      return
    }

    if (intent === 'swipe') {
      const card = cardOf(swipeEl)
      swipeDx = Math.min(0, dx)
      if (card) card.style.transform = `translate3d(${swipeDx}px, 0, 0)`
    }
  }

  function onPointerUp(event) {
    if (event.pointerId !== pointerId) return
    window.clearTimeout(pressTimer)
    pressTimer = 0

    if (intent === 'drag') settleDrag()
    else if (intent === 'swipe') {
      if (crossedRemoveLine()) collapse()
      else settleSwipe()
    } else clearPress()

    intent = 'idle'
    pointerId = null
  }

  function onPointerCancel(event) {
    if (event.pointerId !== pointerId) return
    window.clearTimeout(pressTimer)
    pressTimer = 0

    if (intent === 'drag') {
      dropIndex = fromIndex
      settleDrag()
    } else if (intent === 'swipe') settleSwipe()
    else clearPress()

    intent = 'idle'
    pointerId = null
  }

  /**
   * 拖拽期间禁掉页面滚动：长按成立时手指尚未移动，浏览器还没接管滚动，
   * 此时起 preventDefault 就能一路压住（touch-action 在手势中途改不了，只能这样）。
   */
  function onTouchMove(event) {
    if (intent === 'drag') event.preventDefault()
  }

  let listEl = null

  onMounted(() => {
    listEl = getList()
    if (!listEl) return
    listEl.addEventListener('pointerdown', onPointerDown)
    listEl.addEventListener('pointermove', onPointerMove)
    listEl.addEventListener('pointerup', onPointerUp)
    listEl.addEventListener('pointercancel', onPointerCancel)
    listEl.addEventListener('touchmove', onTouchMove, { passive: false })
  })

  onBeforeUnmount(() => {
    listEl?.removeEventListener('pointerdown', onPointerDown)
    listEl?.removeEventListener('pointermove', onPointerMove)
    listEl?.removeEventListener('pointerup', onPointerUp)
    listEl?.removeEventListener('pointercancel', onPointerCancel)
    listEl?.removeEventListener('touchmove', onTouchMove)
    window.clearTimeout(pressTimer)
    window.clearTimeout(settleTimer)
    window.clearTimeout(collapseTimer)
  })
}
