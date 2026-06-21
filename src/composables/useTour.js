/**
 * useTour — Driver.js 教学导览封装
 *
 * 交互：
 *   - ◀ 箭头 → 上一步（首步禁用）
 *   - ▶ 箭头 → 下一步（末步为 ✓ 关闭）
 *   - 点 ✕ → 关闭
 *
 * 用法：
 *   const { start, stop, isActive } = useTour()
 *   start(TourKeys.DEMO)
 */
import { ref, onUnmounted } from 'vue'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { tourSteps } from '@/constants/tourSteps'
import { useLocalStorage } from '@/stores/localStorage'
import { StorageKeys } from '@/constants/storageKeys'

const isActive = ref(false)
let driverInstance = null
let currentHooks = null
let prevStepIndex = -1

// ── footer 导航：◀ 箭头 + 进度点 + ▶ 箭头 ──

const SVG_LEFT =
  '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M735.208665 65.582671l-446.41733 446.417329 446.41733 446.417329z" fill="currentColor"/></svg>'

const SVG_RIGHT =
  '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M288.791335 65.582671l446.41733 446.417329-446.41733 446.417329z" fill="currentColor"/></svg>'

function makeArrow(direction) {
  const btn = document.createElement('button')
  btn.className = `tour-arrow tour-arrow--${direction}`
  btn.innerHTML = direction === 'left' ? SVG_LEFT : SVG_RIGHT

  btn.addEventListener('click', (e) => {
    e.stopPropagation()
    // 边界箭头点击 → 触发钩子而非移动
    if (btn.classList.contains('is-disabled')) {
      currentHooks?.onBoundaryArrow?.(direction)
      return
    }
    if (direction === 'left') {
      driverInstance?.movePrevious()
    } else {
      driverInstance?.moveNext()
    }
  })

  return btn
}

function renderNav(popover, activeIndex, totalSteps) {
  if (totalSteps <= 1) {
    popover.footer.innerHTML = ''
    return
  }

  // 首步提示
  let hint = popover.footer.querySelector('.tour-hint')
  if (activeIndex === 0 && !hint) {
    hint = document.createElement('div')
    hint.className = 'tour-hint'
    hint.textContent = '◀  ▶ 箭头切换步骤 · ✕ 退出教学'
    popover.footer.before(hint)
  } else if (activeIndex !== 0 && hint) {
    hint.remove()
  }

  let nav = popover.footer.querySelector('.tour-nav')

  if (!nav) {
    // 首次渲染：创建完整导航栏
    popover.footer.innerHTML = ''
    nav = document.createElement('div')
    nav.className = 'tour-nav'

    nav.appendChild(makeArrow('left'))
    nav.appendChild(makeArrow('right'))

    const dots = document.createElement('div')
    dots.className = 'tour-dots'
    for (let i = 0; i < totalSteps; i++) {
      const dot = document.createElement('span')
      dot.className = 'tour-dot'
      dots.appendChild(dot)
    }
    nav.insertBefore(dots, nav.querySelector('.tour-arrow--right'))
    popover.footer.appendChild(nav)
  }

  // 更新激活点
  const dots = nav.querySelectorAll('.tour-dot')
  dots.forEach((dot, i) => {
    dot.classList.toggle('is-active', i === activeIndex)
  })

  // 更新箭头状态
  const left = nav.querySelector('.tour-arrow--left')
  const right = nav.querySelector('.tour-arrow--right')
  left.classList.toggle('is-disabled', activeIndex <= 0)
  right.classList.toggle('is-disabled', activeIndex >= totalSteps - 1)

  // 滚动激活点到中间
  const activeDot = dots[activeIndex]
  if (activeDot) {
    activeDot.scrollIntoView({ inline: 'center', behavior: 'instant' })
  }
}

// ── Driver 实例 ──

function createDriver(options = {}, steps = []) {
  const userOnPopoverRender = options.onPopoverRender
  const { onPopoverRender: _, ...restOptions } = options

  const d = driver({
    ...restOptions,
    steps,
    overlayColor: 'var(--tour-overlay)',
    overlayClickBehavior: () => {},
    popoverClass: 'tour-popover',
    showProgress: false,
    onPopoverRender: (popover, opts) => {
      const activeIndex = opts.state.activeIndex ?? 0
      const totalSteps = opts.config.steps?.length ?? 0

      // 离开步骤钩子（跳过首次渲染）
      if (prevStepIndex >= 0 && activeIndex !== prevStepIndex) {
        opts.config.steps?.[prevStepIndex]?.onLeave?.()
      }
      prevStepIndex = activeIndex

      renderNav(popover, activeIndex, totalSteps)

      // 执行步骤脚本
      const step = opts.config.steps?.[activeIndex]
      step?.onEnter?.()

      userOnPopoverRender?.(popover, opts)
    },
  })

  const origDestroy = d.destroy.bind(d)
  d.destroy = () => {
    origDestroy()
    isActive.value = false
  }

  return d
}

function destroyDriver() {
  if (driverInstance) {
    driverInstance.destroy()
    driverInstance = null
  }
  currentHooks = null
  prevStepIndex = -1
}

// ── 模块级：Tour 启动逻辑，无生命周期绑定，供控制台控件等子组件直接调用 ──

const ls = useLocalStorage()
ls.load(StorageKeys.TOUR, {})

/**
 * 启动教学导览（模块级，不注册 onUnmounted）
 * @param {string|array} tourNameOrSteps — TourKeys 常量或步骤数组
 * @param {number|object} stepIndexOrOpts  — 起始步骤索引，或 { stepIndex, mode } 选项
 *   mode: 'auto'  — 自动触发，从未教学才执行，执行后次数 +1
 *         'manual' — 手动触发，直接执行（默认）
 */
export function startTour(tourNameOrSteps, stepIndexOrOpts = 0) {
  const stepIndex = typeof stepIndexOrOpts === 'number' ? stepIndexOrOpts : (stepIndexOrOpts.stepIndex ?? 0)
  const mode = typeof stepIndexOrOpts === 'object' ? (stepIndexOrOpts.mode ?? 'manual') : 'manual'

  const raw =
    typeof tourNameOrSteps === 'string'
      ? tourSteps[tourNameOrSteps]
      : tourNameOrSteps

  // 向下兼容数组格式：{ steps, ...hooks } 或纯 steps[]
  const config = Array.isArray(raw) ? { steps: raw } : (raw ?? {})
  const { steps, ...hooks } = config

  if (!steps?.length) {
    console.warn(`[useTour] 未找到步骤: ${tourNameOrSteps}`)
    return
  }

  const key = typeof tourNameOrSteps === 'string' ? tourNameOrSteps : null

  // 自动模式：已教学过则跳过
  if (mode === 'auto' && key) {
    const counts = ls.cache[StorageKeys.TOUR] ?? {}
    if ((counts[key] ?? 0) > 0) return
  }

  destroyDriver()
  currentHooks = hooks
  prevStepIndex = -1

  // 开始前钩子
  hooks.onBeforeStart?.()

  driverInstance = createDriver({}, steps)
  driverInstance.drive(stepIndex)
  isActive.value = true

  // 自动模式：记录教学次数
  if (mode === 'auto' && key) {
    const counts = ls.cache[StorageKeys.TOUR] ?? {}
    counts[key] = (counts[key] ?? 0) + 1
  }
}

export function stopTour() {
  destroyDriver()
}

// ── Composable：给页面组件用，带 onUnmounted 自动清理 ──

export function useTour() {
  function start(tourNameOrSteps, stepIndexOrOpts = 0) {
    startTour(tourNameOrSteps, stepIndexOrOpts)
  }

  function stop() {
    stopTour()
  }

  function highlight(config) {
    destroyDriver()
    driverInstance = createDriver({ showProgress: false })
    driverInstance.highlight(config)
    isActive.value = true
  }

  onUnmounted(() => {
    destroyDriver()
  })

  return { isActive, start, stop, highlight }
}
