<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMenuOrderStore } from '@/stores/menuOrder'
import HomePageCard from '@/pages/home/components/HomePageCard.vue'

const router = useRouter()
const menuStore = useMenuOrderStore()

const rotatingCardName = ref(null)

/* ================================================================
   卡片扇形展开参数
   ================================================================ */
const MAX_LEFT = 2
const MAX_RIGHT = 2
const OFFSET_BY_DIST = [0, 8.75, 12.5]

function relOffsetPct(relPos) {
  const sign = relPos < 0 ? -1 : 1
  const abs = Math.abs(relPos)
  if (abs >= OFFSET_BY_DIST.length) return sign * OFFSET_BY_DIST[OFFSET_BY_DIST.length - 1]
  const lo = Math.floor(abs)
  const hi = Math.min(lo + 1, OFFSET_BY_DIST.length - 1)
  return sign * (OFFSET_BY_DIST[lo] + (abs - lo) * (OFFSET_BY_DIST[hi] - OFFSET_BY_DIST[lo]))
}

function relZIndex(relPos) {
  return Math.round(5 - Math.abs(relPos))
}

/* ================================================================
   状态
   ================================================================ */
const currentIndex = ref(0)
const totalCards = computed(() => menuStore.orderedMenus.length)

const canSwipeLeft = computed(() => currentIndex.value < totalCards.value - 1)

// 仅渲染可见范围卡片，高效按需创建/销毁，不浪费 DOM 资源
const visibleCards = computed(() => {
  const total = totalCards.value
  const ci = currentIndex.value
  const cards = []

  for (let d = Math.min(MAX_LEFT, ci); d > 0; d--) {
    cards.push({ menu: menuStore.orderedMenus[ci - d], relPos: -d, isFront: false })
  }
  cards.push({ menu: menuStore.orderedMenus[ci], relPos: 0, isFront: true })
  for (let d = 1; d <= MAX_RIGHT && ci + d < total; d++) {
    cards.push({ menu: menuStore.orderedMenus[ci + d], relPos: d, isFront: false })
  }

  return cards
})

function getCardStyle(relPos, isFront) {
  return {
    transform: `translateX(${relOffsetPct(relPos)}%)`,
    zIndex: relZIndex(relPos),
    opacity: isFront ? undefined : 0.55,
    filter: isFront ? undefined : 'blur(1.5px) brightness(0.85)',
  }
}

/* ================================================================
   手势：gate 累积模式，每满 step px 切一张
   step 动态缩小：手速越快 → step 越小 → 同样距离切更多卡片
   碰壁时 gate 不推进，反向立刻响应
   ================================================================ */
const BASE_STEP = 55      // 慢速时的基准步长（px）
const MIN_STEP = 25       // 最快时的步长下限

let gateX = 0
let touchStartX = 0
let touchStartY = 0
let lastX = 0
let lastT = 0
let velocity = 0          // 平滑速度（px/ms）
let hasSwitched = false   // 本次手势是否已触发过首次切换

function clampIdx(v) { return Math.max(0, Math.min(totalCards.value - 1, v)) }

function onTouchStart(e) {
  const x = e.touches[0].clientX
  gateX = x
  touchStartX = x
  touchStartY = e.touches[0].clientY
  lastX = x
  lastT = performance.now()
  velocity = 0
  hasSwitched = false
}

function onTouchMove(e) {
  const now = performance.now()
  const x = e.touches[0].clientX
  const dt = now - lastT

  if (dt > 0) {
    const iv = Math.abs(x - lastX) / dt
    velocity = velocity * 0.7 + iv * 0.3
  }
  lastX = x
  lastT = now

  const step = Math.max(MIN_STEP, BASE_STEP - velocity * 30)
  const absDx = Math.abs(x - gateX)

  // ── 首切：10px 即触发，gate 复位到当前位置 ──
  if (!hasSwitched) {
    if (absDx < 10) return
    hasSwitched = true
    const dir = x - gateX > 0 ? 1 : -1
    const newIdx = clampIdx(currentIndex.value - dir)
    if (newIdx !== currentIndex.value) {
      currentIndex.value = newIdx
    }
    gateX = x
    return
  }

  // ── 后续：标准 floor gate 累积 ──
  if (absDx < 5) return

  const dir = x - gateX > 0 ? 1 : -1
  const rawSteps = Math.floor(absDx / step)
  if (rawSteps === 0) return

  const newIdx = clampIdx(currentIndex.value - dir * rawSteps)
  const actual = Math.abs(newIdx - currentIndex.value)
  gateX += dir * actual * step
  currentIndex.value = newIdx
}

function onTouchEnd(e) {
  const dx = Math.abs(e.changedTouches[0].clientX - touchStartX)
  const dy = Math.abs(e.changedTouches[0].clientY - touchStartY)
  if (dx < 10 && dy < 10) {
    const front = visibleCards.value.find(c => c.relPos === 0)
    if (front) onCardClick(front.menu)
  }
}

/* ---- 卡片点击 → 导航 ---- */
function onCardClick(menu) {
  const isPortrait = window.innerHeight > window.innerWidth
  const menuIsVertical = menu.orientation === 'vertical'

  menuStore.recordAccess(menu.name)

  if (isPortrait === menuIsVertical) {
    router.push(menu.route)
  } else {
    rotatingCardName.value = menu.name
    setTimeout(() => {
      router.push(menu.route)
      rotatingCardName.value = null
    }, 250)
  }
}
</script>

<template>
  <div class="home-page texture-rice-paper">
    <div class="card-stack">
      <HomePageCard
        v-for="card in visibleCards"
        :key="card.menu.name"
        :menu="card.menu"
        :is-front="card.isFront"
        :offset="card.relPos"
        :is-rotating="card.menu.name === rotatingCardName"
        :style="getCardStyle(card.relPos, card.isFront)"
        @click="onCardClick(card.menu)"
      />

    </div>

    <!-- 触摸蒙层：覆盖卡片区域，永存 DOM，touch 序列不断 -->
    <div
      class="touch-mask"
      @touchstart.passive="onTouchStart"
      @touchmove.passive="onTouchMove"
      @touchend="onTouchEnd"
    />

    <div
      v-if="!canSwipeLeft && visibleCards.length > 0"
      class="boundary-hint"
    >
      已是最后一页
    </div>
    <div
      v-if="currentIndex === 0 && totalCards > 1"
      class="boundary-hint"
    >
      已是第一页
    </div>
  </div>
</template>

<style scoped lang="less">
/* ================================================================
   HomePage — 墨洇背景 + 卡片堆叠
   ================================================================ */

.home-page {
  position: relative;
  height: 100dvh;
  background: var(--bg);
  overflow: hidden;

  /* 墨洇效果：径向渐变 + 模糊 + 暖黑遮罩 */
  &::before {
    content: '';
    position: fixed;
    inset: 0;
    background: radial-gradient(
      ellipse at center,
      transparent 40%,
      var(--ink-wash-overlay) 100%
    );
    backdrop-filter: blur(12px) brightness(0.6);
    z-index: 0;
    pointer-events: none;
  }
}

/* ================================================================
   触摸蒙层 — 盖在卡片上方，永存 DOM，touch 序列永不断
   ================================================================ */
.touch-mask {
  position: absolute;
  inset: 0;
  z-index: 10; /* 高于卡片（最大5），低于边界提示（10） */
  touch-action: pan-y; /* 竖直滚动放行，水平给 JS */
}

/* ================================================================
   卡片堆叠区
   ================================================================ */
.card-stack {
  position: absolute;
  inset: calc(100dvh / 10) calc(100vw / 10);
  z-index: 1;
  border-radius: var(--radius-lg);
  /* 保留纵向触摸滚动，横向手势由 JS 接管 */
  touch-action: pan-y;
}

/* ================================================================
   边界提示 — 位于卡片下方留白居中
   ================================================================ */
.boundary-hint {
  position: absolute;
  bottom: calc(100dvh / 20);
  left: 50%;
  transform: translateX(-50%);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  z-index: 10;
  pointer-events: none;
  white-space: nowrap;
}

/* ================================================================
   无障碍
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .home-page::before {
    backdrop-filter: none;
  }
}
</style>
