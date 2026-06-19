<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQingGangJianStore } from '@/stores/qingGangJian'
import FanMenu from './FanMenu.vue'
import menus from '@/menus'

const route = useRoute()
const router = useRouter()
const store = useQingGangJianStore()

// ── Visibility: hidden on home page ──
const isVisible = computed(() => route.path !== '/')

// ── Current menu name: lookup from menus by route path ──
const currentMenuName = computed(() => {
  const menu = menus.find(m => m.route === route.path)
  return menu?.name || route.params?.name || ''
})

// ── Display text: store text → menu name → route meta → fallback ──
const displayText = computed(() => {
  if (store.currentText) return store.currentText
  if (currentMenuName.value) return currentMenuName.value
  if (route.meta?.title) return route.meta.title
  return '面杀辅助'
})

// ── Gesture state machine ──
const GS = { IDLE: 'idle', PENDING: 'pending', DRAGGING: 'dragging', LONG_PRESS: 'long_press' }
const gesture = ref(GS.IDLE)
const isDragging = computed(() => gesture.value === GS.DRAGGING)

// ── Element refs ──
const pommelRef = ref(null)
const swordRef = ref(null)

// ── Drag tracking ──
const dragStart = ref({ x: 0, y: 0, time: 0 })
const dragOffset = ref({ x: 0, y: 0 })
const swordLeft = ref(0)
const swordBottom = ref(120)
const swordWidth = ref(270) // fallback, measured on mount

let longPressTimer = null

// ── Default position computed from side and viewport ──
function computeDefaultLeft() {
  const w = swordWidth.value
  return store.side === 'left' ? 16 : window.innerWidth - w - 16
}

function snapToDefault() {
  swordLeft.value = computeDefaultLeft()
  swordBottom.value = 120
}

// ── FanMenu state ──
const showFanMenu = ref(false)
const fanMenuAnchorX = ref(0)
const fanMenuAnchorY = ref(0)

// ── Pointer handlers ──
function onPointerDown(e) {
  if (gesture.value !== GS.IDLE) return
  e.target.setPointerCapture(e.pointerId)

  gesture.value = GS.PENDING
  dragStart.value = { x: e.clientX, y: e.clientY, time: Date.now() }

  const rect = swordRef.value.getBoundingClientRect()
  dragOffset.value = {
    x: e.clientX - rect.left,
    y: e.clientY - (window.innerHeight - rect.bottom),
  }

  longPressTimer = setTimeout(() => {
    if (gesture.value === GS.PENDING) {
      gesture.value = GS.LONG_PRESS
      router.push('/')
    }
  }, 500)
}

function onPointerMove(e) {
  if (gesture.value !== GS.PENDING && gesture.value !== GS.DRAGGING) return

  const dx = e.clientX - dragStart.value.x
  const dy = e.clientY - dragStart.value.y
  const dist = Math.sqrt(dx * dx + dy * dy)

  if (gesture.value === GS.PENDING && dist > 10) {
    clearTimeout(longPressTimer)
    gesture.value = GS.DRAGGING
  }

  if (gesture.value === GS.DRAGGING) {
    swordLeft.value = e.clientX - dragOffset.value.x
    swordBottom.value = window.innerHeight - e.clientY + dragOffset.value.y
  }
}

function onPointerUp(e) {
  clearTimeout(longPressTimer)

  if (gesture.value === GS.PENDING) {
    const elapsed = Date.now() - dragStart.value.time
    if (elapsed < 300) handleShortPress()
  } else if (gesture.value === GS.DRAGGING) {
    handleDragEnd()
  }

  gesture.value = GS.IDLE
  e.target.releasePointerCapture(e.pointerId)
}

function onPointerCancel() {
  clearTimeout(longPressTimer)
  gesture.value = GS.IDLE
}

// ── Gesture actions ──
function handleShortPress() {
  if (!pommelRef.value) return
  const rect = pommelRef.value.getBoundingClientRect()
  fanMenuAnchorX.value = rect.left + rect.width / 2
  fanMenuAnchorY.value = rect.top + rect.height / 2
  showFanMenu.value = true
}

function handleDragEnd() {
  if (!pommelRef.value) return
  const rect = pommelRef.value.getBoundingClientRect()
  const pommelCenterX = rect.left + rect.width / 2

  store.setSide(pommelCenterX < window.innerWidth / 2 ? 'left' : 'right')
  snapToDefault()
}

function onFanMenuSelect(action) {
  showFanMenu.value = false
  if (action === 'voice') store.toggleExpand()
}

// ── React to side changes (when not dragging) ──
watch(() => store.side, () => {
  if (!isDragging.value) snapToDefault()
})

// ── Resize / mount: measure & position ──
function refreshLayout() {
  swordWidth.value = swordRef.value?.getBoundingClientRect().width || 270
  if (!isDragging.value) snapToDefault()
}

onMounted(() => {
  refreshLayout()
  window.addEventListener('resize', refreshLayout)
})

onUnmounted(() => {
  window.removeEventListener('resize', refreshLayout)
  clearTimeout(longPressTimer)
})

// ── Inline style: left/bottom always in px; transition disabled while dragging ──
const swordStyle = computed(() => ({
  left: swordLeft.value + 'px',
  bottom: swordBottom.value + 'px',
  transition: isDragging.value ? 'none' : undefined,
  willChange: isDragging.value ? 'left, bottom' : undefined,
}))
</script>

<template>
  <div
    v-if="isVisible"
    ref="swordRef"
    class="sword"
    :class="{
      'sword--left': store.side === 'left',
      'sword--right': store.side === 'right',
      'is-expanded': store.isExpanded,
      'is-dragging': isDragging,
    }"
    :style="swordStyle"
  >
    <!-- DOM order: pommel → guard → blade-section                     -->
    <!-- Right side (row-reverse):  blade-section | guard | pommel      -->
    <!-- Left side  (row):          pommel | guard | blade-section      -->

    <div
      ref="pommelRef"
      class="sword__pommel"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerCancel"
    >
      <span class="sword__pommel-icon">⚔</span>
    </div>

    <div class="sword__guard">
      <span class="sword__guard-line" />
      <span class="sword__guard-line" />
    </div>

    <div class="sword__blade-section">
      <div class="sword__tip" />
      <div class="sword__blade">
        <span
          v-if="displayText"
          class="sword__text"
        >{{ displayText }}</span>
      </div>
    </div>
  </div>

  <FanMenu
    v-model="showFanMenu"
    :anchor-x="fanMenuAnchorX"
    :anchor-y="fanMenuAnchorY"
    @select="onFanMenuSelect"
  />
</template>

<style scoped lang="less">
/* ── Local tokens ── */
.sword {
  --_blade-length: 200px;
  --_blade-height: 28px;
  --_tip-size: 10px;
  --_pommel-size: 56px;
  --_guard-gap: 4px;
  --_guard-width: 4px;
  --_guard-height: 16px;
}

/* ═══════════════════════════════════════════════════════════
   Container
   ═══════════════════════════════════════════════════════════ */
.sword {
  position: fixed;
  z-index: var(--z-sticky);
  display: flex;
  align-items: center;
  will-change: left, bottom;
  transition:
    left var(--duration-normal) var(--ease-enter),
    bottom var(--duration-normal) var(--ease-enter);
}

/* Flex direction flips per side so pommel stays on the correct edge */
.sword--right {
  flex-direction: row-reverse;
}

.sword--left {
  flex-direction: row;
}

/* ═══════════════════════════════════════════════════════════
   Pommel (剑首) — 56 px circle
   ═══════════════════════════════════════════════════════════ */
.sword__pommel {
  width: var(--_pommel-size);
  height: var(--_pommel-size);
  border-radius: 50%;
  background: var(--bg-surface);
  border: var(--border-medium) solid var(--accent-gold);
  box-shadow: var(--shadow-glow-gold);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
  user-select: none;
  touch-action: none;
  -webkit-tap-highlight-color: var(--tap-highlight);
}

.sword__pommel-icon {
  font-size: 24px;
  line-height: 1;
  color: var(--accent-gold);
  pointer-events: none;
}

/* ═══════════════════════════════════════════════════════════
   Guard (剑格) — two thin gold lines
   ═══════════════════════════════════════════════════════════ */
.sword__guard {
  display: flex;
  gap: 2px;
  margin: 0 var(--_guard-gap);
  flex-shrink: 0;
}

.sword__guard-line {
  display: block;
  width: 2px;
  height: var(--_guard-height);
  background: var(--accent-gold-light);
  border-radius: 1px;
}

/* ═══════════════════════════════════════════════════════════
   Blade section — contains tip + blade; scales on expand/collapse
   ═══════════════════════════════════════════════════════════ */
.sword__blade-section {
  display: flex;
  align-items: center;
  transition: transform 300ms var(--ease-ink);
}

.sword--right .sword__blade-section {
  flex-direction: row;
  transform-origin: right center;
}

.sword--left .sword__blade-section {
  flex-direction: row-reverse;
  transform-origin: left center;
}

/* Collapsed state */
.sword__blade-section {
  transform: scaleX(0);
}

.sword.is-expanded .sword__blade-section {
  transform: scaleX(1);
}

/* ═══════════════════════════════════════════════════════════
   Tip (剑尖) — CSS triangle
   ═══════════════════════════════════════════════════════════ */
.sword__tip {
  width: 0;
  height: 0;
  flex-shrink: 0;
}

/* Right side: tip points left ← */
.sword--right .sword__tip {
  border-top: calc(var(--_blade-height) / 2) solid transparent;
  border-bottom: calc(var(--_blade-height) / 2) solid transparent;
  border-right: var(--_tip-size) solid var(--accent-gold-light);
}

/* Left side: tip points right → */
.sword--left .sword__tip {
  border-top: calc(var(--_blade-height) / 2) solid transparent;
  border-bottom: calc(var(--_blade-height) / 2) solid transparent;
  border-left: var(--_tip-size) solid var(--accent-gold-light);
}

/* ═══════════════════════════════════════════════════════════
   Blade (剑身) — text marquee
   ═══════════════════════════════════════════════════════════ */
.sword__blade {
  position: relative;
  width: var(--_blade-length);
  height: var(--_blade-height);
  overflow: hidden;
  white-space: nowrap;
  display: flex;
  align-items: center;
  border-radius: 2px;
  flex-shrink: 0;
  /* 性能提示：剑身尺寸固定，完全隔离以跳过子树重排重绘 */
  contain: strict;
}

/* Semi-transparent surface (pseudo-element leaves text opaque) */
.sword__blade::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--bg-surface);
  opacity: 0.88;
  border-radius: inherit;
  z-index: 0;
}

.sword__text {
  position: relative;
  z-index: 1;
  display: inline-block;
  white-space: nowrap;
  font-size: var(--text-sm);
  color: var(--text-primary);
  animation: qgj-scroll-text 8s linear infinite;
  padding: 0 var(--space-4);
  /* 性能提示：提示浏览器文字滚动动画即将发生 */
  will-change: transform;
}

/* Pause when collapsed */
.sword:not(.is-expanded) .sword__text {
  animation-play-state: paused;
}

@keyframes qgj-scroll-text {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(-100%);
  }
}

/* ═══════════════════════════════════════════════════════════
   Reduced motion
   ═══════════════════════════════════════════════════════════ */
@media (prefers-reduced-motion: reduce) {
  .sword {
    transition: none;
  }

  .sword__blade-section {
    transition: none;
  }

  .sword__text {
    animation: none;
  }
}
</style>
