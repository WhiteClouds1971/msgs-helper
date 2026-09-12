<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import sealSvg from '@/assets/icons/yin_zhang.svg?raw';
import { useConsole } from '@/composables/useConsole';
import { useGlobalSearch } from '@/composables/useGlobalSearch';
import { useTour } from '@/composables/useTour';
import { TourKeys } from '@/constants/tourKeys';

const route = useRoute();
const console = useConsole();
const search = useGlobalSearch();
const { start: startTour, stop: stopTour, isActive: isTourActive } = useTour();

const BUTTON_SIZE = 56;
const EDGE_MARGIN = 10;
const DIM_DELAY = 5000;
const LONG_PRESS_DURATION = 600;
const DRAG_THRESHOLD = 5;
const TOUR_DELAY = 600; // 等 Splash 淡出（--duration-slow）后再教学

// 404 页面不显示
const isVisible = computed(() => route.name !== 'NotFound');
const isHome = computed(() => route.name === 'Home');
// 菜单页（路由注册表里带 meta.code 的项）— 玉玺教学只在这里触发
const isMenuPage = computed(() => Boolean(route.meta?.code));

// 主页隐藏位置：仅左下 1/4 露出右上角
function homeHiddenPos() {
  return {
    x: window.innerWidth - BUTTON_SIZE / 2,
    y: -BUTTON_SIZE / 2,
  };
}

// 主页展开位置：完整显示
function homeRevealedPos() {
  return {
    x: window.innerWidth - BUTTON_SIZE - EDGE_MARGIN,
    y: EDGE_MARGIN,
  };
}

// 其他页面默认位置（横屏往下挪一些）
function otherPagePos() {
  const isLandscape = window.innerWidth > window.innerHeight;
  return {
    x: window.innerWidth - BUTTON_SIZE - 16,
    y: window.innerHeight - BUTTON_SIZE - (isLandscape ? 60 : 120),
  };
}

function getDefaultPos() {
  if (isHome.value) return homeHiddenPos();
  return otherPagePos();
}

const defaultPos = getDefaultPos();
const posX = ref(defaultPos.x);
const posY = ref(defaultPos.y);

const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const posStart = ref({ x: 0, y: 0 });

const isDimmed = ref(true);
let dimTimer = null;

// 玉玺教学进行中 — 一方面保持清晰不被弱化，一方面在 tour-theme.css 里放行指针事件，
// 让用户当场就能试「单击 / 长按」（driver 挂的 .driver-active-element 会被 Vue 的
// class 补丁抹掉，故改用模板绑定的这个类）
const isTouring = ref(false);

// 手势识别
let hasMoved = false;
let longPressFired = false;
let pressTimer = null;
let tourTimer = null;

function activate() {
  isDimmed.value = false;
  clearTimeout(dimTimer);
  dimTimer = setTimeout(() => {
    // 教学期间保持玉玺清晰：教学结束后再恢复自动弱化
    if (isTouring.value) {
      activate();
      return;
    }
    isDimmed.value = true;
  }, DIM_DELAY);
}

// 主页弱化/激活时切换隐藏与展开位置（覆盖拖拽位置）
watch(isDimmed, (dimmed) => {
  if (!isHome.value) return;
  const target = dimmed ? homeHiddenPos() : homeRevealedPos();
  posX.value = target.x;
  posY.value = target.y;
});

// 教学收场（✕ 关闭 / 上手操作 / 离开本页）→ 收回指针事件放行
watch(isTourActive, (active) => {
  if (!active) isTouring.value = false;
});

function clampPos() {
  posX.value = Math.max(0, Math.min(window.innerWidth - BUTTON_SIZE, posX.value));
  posY.value = Math.max(0, Math.min(window.innerHeight - BUTTON_SIZE, posY.value));
}

// ── 「这一下是不是点在玉玺上」──
// 搜索蒙层打开时，点在玉玺上不算外部点击（否则「再点一下玉玺」会把刚开的蒙层关掉，
// 看着就是搜索闪了一下）。主页的玉玺会在隐藏态 / 展开态之间挪位，用户那一下往往落在
// 它刚才的位置上，所以「当前位置」和「蒙层打开那一刻的位置」都算数，方块外扩 PAD 吸收
// 动画途中的偏差。
const SEAL_HIT_PAD = 16;
let hitRectWhenOpened = null;

function hitRect() {
  return {
    left: posX.value - SEAL_HIT_PAD,
    right: posX.value + BUTTON_SIZE + SEAL_HIT_PAD,
    top: posY.value - SEAL_HIT_PAD,
    bottom: posY.value + BUTTON_SIZE + SEAL_HIT_PAD,
  };
}

function withinRect(rect, x, y) {
  return Boolean(rect) && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

watch(search.isOpen, (open) => {
  hitRectWhenOpened = open ? hitRect() : null;
});

search.sealHitTest.value = (x, y) => withinRect(hitRect(), x, y) || withinRect(hitRectWhenOpened, x, y);

// ── 触觉反馈（视觉震动兜底，兼容 Safari/微信等不支持 Vibration API 的环境）──
const hapticClass = ref('');

function vibrate(pattern, visualClass) {
  navigator.vibrate?.(pattern);
  if (visualClass) {
    hapticClass.value = visualClass;
    setTimeout(() => { hapticClass.value = ''; }, 400);
  }
}

// ── 手势回调 ──
// 单击 = 搜索，长按 = 控制台。两个动作都不需要「等一等再决定」，
// 因此单击可以当场响应 —— 移动端软键盘只认手势内的 focus()。
//
// 主页的隐藏态也走同一条路（单击直接唤起搜索），不设「先点醒、再点一次」的两步：
// 玉玺静置 5 秒就缩回角落，用户几乎每次都点在隐藏态上；而展开动画会把按钮从指针
// 底下挪走 —— 第二次点击必然落空，看起来就是「点了没反应/闪一下」。

/** 用户照着教学上手了 → 教学使命达成，立即收场（免得遮罩盖住刚打开的蒙层） */
function endTourOnGesture() {
  if (isTourActive.value) stopTour();
}

/** 单击：打开全局搜索 */
function onSingleClickAction() {
  endTourOnGesture();
  search.open();
}

/** 长按：打开控制台菜单（返回主页改由控制台的「返回主页」控件承担） */
function onLongPress() {
  longPressFired = true;
  vibrate(40, 'haptic-long');
  endTourOnGesture();
  console.open();
}

// ── 手势识别逻辑 ──

function onPointerDown(e) {
  activate();
  hasMoved = false;
  longPressFired = false;
  isDragging.value = true;
  dragStart.value = { x: e.clientX, y: e.clientY };
  posStart.value = { x: posX.value, y: posY.value };

  // 长按检测
  clearTimeout(pressTimer);
  pressTimer = setTimeout(() => {
    if (!hasMoved) onLongPress();
  }, LONG_PRESS_DURATION);

  e.preventDefault();
}

function onPointerMove(e) {
  if (!isDragging.value) return;
  const dx = e.clientX - dragStart.value.x;
  const dy = e.clientY - dragStart.value.y;
  if (!hasMoved && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
    hasMoved = true;
    clearTimeout(pressTimer);
  }
  posX.value = posStart.value.x + dx;
  posY.value = posStart.value.y + dy;
  clampPos();
}

function onPointerUp() {
  if (!isDragging.value) return;
  isDragging.value = false;
  clearTimeout(pressTimer);
  clampPos();

  // 长按已触发 → 忽略后续 click
  if (longPressFired) return;

  // 未移动 → 判定为单击，立即响应
  if (!hasMoved) {
    vibrate(10, 'haptic-click');
    onSingleClickAction();
  }
}

// 视口变化时重新计算默认位置（非拖拽中）
function onResize() {
  if (isDragging.value) return;
  if (isHome.value) {
    const target = isDimmed.value ? homeHiddenPos() : homeRevealedPos();
    posX.value = target.x;
    posY.value = target.y;
  } else {
    const target = otherPagePos();
    posX.value = target.x;
    posY.value = target.y;
  }
}

onMounted(() => {
  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', onPointerUp);
  window.addEventListener('resize', onResize);

  // 首次进入非主页菜单 → 自动教学玉玺手势（auto 模式：教学过就不再打扰）
  if (!isMenuPage.value) return;
  tourTimer = setTimeout(() => {
    startTour(TourKeys.MENU_SEAL, { mode: 'auto' });
    // startTour 同步置位 isActive：没置位说明 auto 模式判定已教学过，本场没开
    if (!isTourActive.value) return;
    isTouring.value = true;
    activate();
  }, TOUR_DELAY);
});

onUnmounted(() => {
  search.sealHitTest.value = null;
  clearTimeout(dimTimer);
  clearTimeout(pressTimer);
  clearTimeout(tourTimer);
  document.removeEventListener('pointermove', onPointerMove);
  document.removeEventListener('pointerup', onPointerUp);
  window.removeEventListener('resize', onResize);
});
</script>

<template>
  <button
    v-if="isVisible"
    id="jade-seal"
    class="jade-seal"
    :class="{
      'is-dragging': isDragging,
      'is-dimmed': isDimmed,
      'is-touring': isTouring,
      [hapticClass]: hapticClass,
    }"
    :style="{ left: posX + 'px', top: posY + 'px' }"
    @pointerdown="onPointerDown"
    aria-label="玉玺"
  >
    <span class="jade-seal__icon" v-html="sealSvg"></span>
  </button>
</template>

<style scoped>
.jade-seal {
  /* 56px 圆形悬浮按钮 */
  position: fixed;
  z-index: var(--z-sticky, 200);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background: var(--bg-surface);
  backdrop-filter: blur(6px);
  box-shadow:
    var(--shadow-glow-red),
    var(--shadow-md);
  color: var(--accent-red);
  cursor: grab;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: none;
  transition:
    left var(--duration-slow) var(--ease-enter),
    top var(--duration-slow) var(--ease-enter),
    box-shadow var(--duration-fast) var(--ease-out);
}

.jade-seal.is-dragging {
  cursor: grabbing;
  box-shadow: var(--shadow-lg);
  transition: none;
}

.jade-seal:active {
  transform: scale(0.94);
  box-shadow: var(--shadow-sm);
}

.jade-seal.is-dragging:active {
  transform: none;
}

.jade-seal.is-dimmed {
  opacity: 0.4;
}

/* ── 视觉震动（兜底 Safari / 微信等不支持 Vibration API 的环境）── */

.jade-seal.haptic-click {
  animation: haptic-shake 120ms var(--ease-out);
}

.jade-seal.haptic-double {
  animation: haptic-double-shake 200ms var(--ease-out);
}

.jade-seal.haptic-long {
  animation: haptic-pulse 250ms var(--ease-out);
}

@keyframes haptic-shake {
  0%, 100% { transform: translateX(0); }
  25%  { transform: translateX(1.5px); }
  75%  { transform: translateX(-1.5px); }
}

@keyframes haptic-double-shake {
  0%, 100% { transform: translateX(0); }
  15%  { transform: translateX(1.5px); }
  35%  { transform: translateX(-1.5px); }
  50%  { transform: translateX(0); }
  65%  { transform: translateX(1.5px); }
  85%  { transform: translateX(-1.5px); }
}

@keyframes haptic-pulse {
  0%, 100% { transform: scale(1); }
  50%  { transform: scale(0.92); }
}

.jade-seal__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  transform: scale(1.3);
  pointer-events: none;
}

.jade-seal__icon :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
