<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import sealSvg from '@/assets/icons/yin_zhang.svg?raw';
import { useConsole } from '@/composables/useConsole';

const router = useRouter();
const route = useRoute();
const console = useConsole();

const BUTTON_SIZE = 56;
const EDGE_MARGIN = 10;
const DIM_DELAY = 5000;
const LONG_PRESS_DURATION = 600;
const DOUBLE_CLICK_WINDOW = 250;
const DRAG_THRESHOLD = 5;

const isHome = computed(() => route.name === 'Home');

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

// 手势识别
let hasMoved = false;
let longPressFired = false;
let wasDimmed = false;
let pressTimer = null;
let clickTimer = null;
let clickCount = 0;

function activate() {
  isDimmed.value = false;
  clearTimeout(dimTimer);
  dimTimer = setTimeout(() => {
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

function clampPos() {
  posX.value = Math.max(0, Math.min(window.innerWidth - BUTTON_SIZE, posX.value));
  posY.value = Math.max(0, Math.min(window.innerHeight - BUTTON_SIZE, posY.value));
}

// ── 触觉反馈（视觉震动兜底，兼容 Safari/微信等不支持 Vibration API 的环境）──
const hapticClass = ref('');

function vibrate(pattern, visualClass) {
  navigator.vibrate?.(pattern);
  if (visualClass) {
    hapticClass.value = visualClass;
    setTimeout(() => { hapticClass.value = ''; }, 400);
  }
}

// ── 手势回调（预留） ──

/** 单击：打开控制台菜单 */
function onSingleClickAction() {
  console.open()
}

/** 双击：打开搜索 */
function onDoubleClickAction() {
  // TODO: 实现搜索
}

/** 长按：返回主页 */
function onLongPress() {
  longPressFired = true;
  vibrate(40, 'haptic-long');
  router.push('/');
}

// ── 手势识别逻辑 ──

function onPointerDown(e) {
  wasDimmed = isDimmed.value;
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

  // 主页隐藏状态 → 仅展开，不触发 click
  if (isHome.value && wasDimmed) return;

  // 未移动 → 判定为点击
  if (!hasMoved) {
    clickCount++;
    if (clickCount === 1) {
      // 震动立刻触发，只有逻辑回调等待双击窗口
      vibrate(10, 'haptic-click');
      clickTimer = setTimeout(() => {
        onSingleClickAction();
        clickCount = 0;
      }, DOUBLE_CLICK_WINDOW);
    } else {
      clearTimeout(clickTimer);
      // 覆盖为双击震动
      vibrate([10, 40, 10], 'haptic-double');
      onDoubleClickAction();
      clickCount = 0;
    }
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
});

onUnmounted(() => {
  clearTimeout(dimTimer);
  clearTimeout(pressTimer);
  clearTimeout(clickTimer);
  document.removeEventListener('pointermove', onPointerMove);
  document.removeEventListener('pointerup', onPointerUp);
  window.removeEventListener('resize', onResize);
});
</script>

<template>
  <button
    class="jade-seal"
    :class="{
      'is-dragging': isDragging,
      'is-dimmed': isDimmed,
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
