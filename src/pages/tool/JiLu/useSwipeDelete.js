import { nextTick, onBeforeUnmount, onMounted } from 'vue';

/**
 * useSwipeDelete —— 牌面左滑删除手势（记录页专用，不通用）
 *
 * 只管一件事：一张牌面向左滑过阈值就把它交给调用方删掉。列表结构与样式都留在
 * Index.vue 里，这里只按下面这套 DOM 契约找元素、算几何、写位移：
 *
 *   li.jlp-card        单项：overflow: hidden 裁住滑走的牌面，底下是朱砂滑出层
 *   .jlp-card__card    牌面本体：位移施加在它身上
 *   状态类：is-swiping 挂在 li 上（样式在 Index.vue，滑出层据此显形）
 *
 * 阈值跟着牌面宽度走（limit = 牌面宽的一半，封顶 removeThreshold，保底 40px）：
 * 牌面是一枚小牌签，一个比它自己还宽的固定阈值，手指得划过头才认账。
 * 没滑够的还有一条路 —— 距离过半且划得快（短促轻划）也算数。
 *
 * 删除分两拍：先让牌面滑走淡出，再摘数据，最后给还在场的同伴补一次 FLIP。
 * 牌签是接着排的（flex-wrap），摘掉一张，后面的会整体往前挪；不补这一下，
 * 它们会「啪」地跳过去。
 *
 * 与「点一下盖住牌面」的配合：左滑过的那一下会紧接着触发一次 click，
 * 那不是点按 —— 调用方在 click 里先问 shouldIgnoreClick()，为真就跳过。
 * 每次 pointerdown 起手都会把它复位，所以下一轮点按照常生效。
 *
 * @param {() => HTMLElement|null} getList 取列表根元素（本页那个 ul）
 * @param {{ removeThreshold?: number, onRemove?: (index:number)=>void }} options
 */

/** 横向意图判定：略斜的划动很常见，不宜要求太偏 */
const SWIPE_BIAS = 1;
/** 起手到判定的容差：这么点位移内还算「点按」 */
const TOLERANCE = 8;
/** 快速轻划：距离过半 + 速度达标也照删 */
const FLICK_RATIO = 0.55;
const FLICK_SPEED = 0.5;
/** 阈值下限：再小的牌签也得划出这么远才算数 */
const MIN_LIMIT = 40;
/** 牌面滑走淡出的时长，与样式里的时长对齐 */
const OUT_MS = 240;
/** 弹回 / 同伴补位的时长（同上，用来决定何时清内联样式） */
const SETTLE_MS = 260;

const OUT_TRANSITION =
  'transform var(--duration-normal) var(--ease-enter), opacity var(--duration-fast) var(--ease-out)';
const SETTLE_TRANSITION = 'transform var(--duration-normal) var(--ease-enter)';

const wait = ms => new Promise(resolve => window.setTimeout(resolve, ms));

export function useSwipeDelete(getList, options = {}) {
  const removeThreshold = options.removeThreshold ?? 72;
  const onRemove = options.onRemove;

  let listEl = null;
  let pointerId = null;
  /** idle | press | swipe */
  let intent = 'idle';
  let startX = 0;
  let startY = 0;
  let itemEl = null;
  let cardEl = null;
  let dx = 0;
  let limit = removeThreshold;
  let swipeAt = 0;
  let blocked = false;
  /** 收尾动画中：不再接新手势，免得同一张被滑两次 */
  let busy = false;
  let disposed = false;
  let settleTimer = 0;

  const items = () => [...(listEl?.querySelectorAll('.jlp-card') ?? [])];

  /** 左滑是否算「要删」：滑得够远，或者距离过半但划得够快 */
  function crossedRemoveLine() {
    if (dx <= -limit) return true;
    const speed = Math.abs(dx) / Math.max(1, Date.now() - swipeAt);
    return dx <= -limit * FLICK_RATIO && speed >= FLICK_SPEED;
  }

  /** 没滑够：牌面滑回原位 */
  function settle() {
    const el = itemEl;
    const card = cardEl;
    dx = 0;
    if (!card) {
      el?.classList.remove('is-swiping');
      return;
    }
    card.style.transition = SETTLE_TRANSITION;
    card.style.transform = '';
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => {
      card.style.transition = '';
      el?.classList.remove('is-swiping');
    }, SETTLE_MS);
  }

  /** 滑够了：牌面滑走 → 摘数据 → 同伴补位 */
  async function remove() {
    const el = itemEl;
    const card = cardEl;
    if (!el || !card) return;

    busy = true;

    // 同伴的出发位置（滑走的那张不算），用于事后 FLIP
    const mates = items().filter(item => item !== el);
    const from = mates.map(item => item.getBoundingClientRect());

    card.style.transition = OUT_TRANSITION;
    card.style.transform = 'translate3d(-110%, 0, 0)';
    card.style.opacity = '0';

    await wait(OUT_MS);
    if (disposed) return;

    const index = items().indexOf(el);
    if (index >= 0) onRemove?.(index);
    await nextTick();
    if (disposed) return;

    // FLIP：先按原处摆好，再补间回各自的新位置
    mates.forEach((item, i) => {
      const rect = from[i];
      if (!rect || !item.isConnected) return;
      const now = item.getBoundingClientRect();
      const shiftX = rect.left - now.left;
      const shiftY = rect.top - now.top;
      if (Math.abs(shiftX) < 1 && Math.abs(shiftY) < 1) return;
      item.style.transition = 'none';
      item.style.transform = `translate3d(${shiftX}px, ${shiftY}px, 0)`;
      void item.offsetHeight;
      item.style.transition = SETTLE_TRANSITION;
      item.style.transform = '';
    });

    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => {
      mates.forEach(item => {
        item.style.transition = '';
        item.style.transform = '';
      });
    }, SETTLE_MS);

    busy = false;
  }

  function onPointerDown(event) {
    if (busy || intent !== 'idle') return;
    // 鼠标只认左键（右键是菜单，别把它当手势）
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    const target = event.target?.closest?.('.jlp-card');
    if (!listEl || !target || !listEl.contains(target)) return;

    intent = 'press';
    blocked = false;
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    itemEl = target;
    cardEl = target.querySelector('.jlp-card__card');
    // 阈值随这张牌面的宽度走
    limit = Math.min(removeThreshold, Math.max(MIN_LIMIT, target.offsetWidth / 2));

    // 指针捕获：手滑出列表也继续收事件
    try {
      listEl.setPointerCapture(event.pointerId);
    } catch {
      /* 合成事件 / 个别浏览器不支持捕获：退化为普通事件流 */
    }
  }

  function onPointerMove(event) {
    if (event.pointerId !== pointerId || intent === 'idle') return;

    const moveX = event.clientX - startX;
    const moveY = event.clientY - startY;

    if (intent === 'press') {
      if (Math.abs(moveX) < TOLERANCE && Math.abs(moveY) < TOLERANCE) return;

      if (Math.abs(moveX) > Math.abs(moveY) * SWIPE_BIAS) {
        // 横向：进左滑（往右滑不做事，但也不算点按）
        intent = 'swipe';
        dx = Math.min(0, moveX);
        swipeAt = Date.now();
        // 滑出层只在左滑期间显形（平时藏着，免得牌面浮起时漏出红底）
        itemEl.classList.add('is-swiping');
        if (cardEl) {
          cardEl.style.transition = 'none';
          cardEl.style.transform = `translate3d(${dx}px, 0, 0)`;
        }
      } else {
        // 纵向：用户想滚页面，本次手势到此为止（touch-action: pan-y 已经把滚动放行）
        intent = 'idle';
        pointerId = null;
        itemEl = null;
        cardEl = null;
      }
      return;
    }

    // 左滑中：跟手位移，且只往左
    dx = Math.min(0, moveX);
    if (cardEl) cardEl.style.transform = `translate3d(${dx}px, 0, 0)`;
  }

  function onPointerUp(event) {
    if (event.pointerId !== pointerId) return;

    const wasSwipe = intent === 'swipe';
    intent = 'idle';
    pointerId = null;

    if (!wasSwipe) {
      // 点按：什么都没动，交给随后的 click（盖住 / 揭开这张牌面）
      itemEl = null;
      cardEl = null;
      return;
    }

    // 左滑过：压掉紧随其后的 click，它不算点按
    blocked = true;
    if (crossedRemoveLine()) remove();
    else settle();

    itemEl = null;
    cardEl = null;
  }

  function onPointerCancel(event) {
    if (event.pointerId !== pointerId) return;
    if (intent === 'swipe') settle();
    intent = 'idle';
    pointerId = null;
    itemEl = null;
    cardEl = null;
  }

  onMounted(() => {
    listEl = getList();
    if (!listEl) return;
    listEl.addEventListener('pointerdown', onPointerDown);
    listEl.addEventListener('pointermove', onPointerMove);
    listEl.addEventListener('pointerup', onPointerUp);
    listEl.addEventListener('pointercancel', onPointerCancel);
  });

  onBeforeUnmount(() => {
    disposed = true;
    listEl?.removeEventListener('pointerdown', onPointerDown);
    listEl?.removeEventListener('pointermove', onPointerMove);
    listEl?.removeEventListener('pointerup', onPointerUp);
    listEl?.removeEventListener('pointercancel', onPointerCancel);
    window.clearTimeout(settleTimer);
  });

  /** 上一次手势是左滑吗 —— click 里先问它，为真就当成「不是点按」 */
  return { shouldIgnoreClick: () => blocked };
}
