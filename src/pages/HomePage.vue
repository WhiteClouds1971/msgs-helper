<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMenuOrderStore } from '@/stores/menuOrder'
import HomePageCard from '@/pages/HomePageCard.vue'

const router = useRouter()
const menuStore = useMenuOrderStore()

const currentIndex = ref(0)
const cardStackRef = ref(null)
const rotatingCardName = ref(null)

let startX = 0
let deltaX = 0
let cardWidth = 0

onMounted(() => {
  if (cardStackRef.value) {
    const firstCard = cardStackRef.value.querySelector('.home-card')
    if (firstCard) {
      cardWidth = firstCard.offsetWidth
    }
  }
})

const visibleCards = computed(() => {
  const total = menuStore.orderedMenus.length
  const cards = []
  for (let i = 0; i < Math.min(6, total); i++) {
    const idx = (currentIndex.value + i) % total
    cards.push({
      menu: menuStore.orderedMenus[idx],
      offset: i,
      isFront: i === 0,
    })
  }
  return cards
})

/** 可根据当前索引判断左右边界 */
const canSwipeLeft = computed(() => {
  return currentIndex.value < menuStore.orderedMenus.length - 1
})

const canSwipeRight = computed(() => {
  return currentIndex.value > 0
})

function getCardStyle(offset) {
  return {
    transform: `translateX(calc(var(--card-offset-x) * ${offset}))`,
    zIndex: 6 - offset,
  }
}

/* ---- 滑动手势 ---- */
function onTouchStart(e) {
  startX = e.touches[0].clientX
  deltaX = 0
}

function onTouchMove(e) {
  deltaX = e.touches[0].clientX - startX
}

function onTouchEnd() {
  const threshold = Math.max(cardWidth * 0.25, 80)
  if (Math.abs(deltaX) > threshold) {
    if (deltaX < 0 && canSwipeLeft.value) {
      currentIndex.value++
    } else if (deltaX > 0 && canSwipeRight.value) {
      currentIndex.value--
    }
  }
  deltaX = 0
}

/* ---- 卡片点击 → 导航 ---- */
function onCardClick(menu) {
  const isPortrait = window.innerHeight > window.innerWidth
  const menuIsVertical = menu.orientation === 'vertical'

  menuStore.recordAccess(menu.name)

  if (isPortrait === menuIsVertical) {
    // 方向一致 → 直接导航
    router.push(menu.route)
  } else {
    // 方向不一致 → 旋转动画后再导航
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
    <div
      ref="cardStackRef"
      class="card-stack"
      @touchstart.passive="onTouchStart"
      @touchmove.passive="onTouchMove"
      @touchend="onTouchEnd"
    >
      <HomePageCard
        v-for="card in visibleCards"
        :key="card.menu.name"
        :menu="card.menu"
        :is-front="card.isFront"
        :offset="card.offset"
        :is-rotating="card.menu.name === rotatingCardName"
        :style="getCardStyle(card.offset)"
        @click="onCardClick(card.menu)"
      />

      <!-- 边界提示 -->
      <div v-if="!canSwipeLeft && visibleCards.length > 0" class="stack-hint stack-hint--right">
        已是最后一页
      </div>
      <div v-if="!canSwipeRight && currentIndex > 0" class="stack-hint stack-hint--left">
        已是第一页
      </div>
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
   卡片堆叠区
   ================================================================ */
.card-stack {
  position: absolute;
  inset: var(--space-8);
  z-index: 1;
  overflow: hidden;
  /* 保留纵向触摸滚动，横向手势由 JS 接管 */
  touch-action: pan-y;
}

/* ================================================================
   边界提示
   ================================================================ */
.stack-hint {
  position: absolute;
  bottom: var(--space-2);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  z-index: 10;

  &--left {
    left: var(--space-4);
  }

  &--right {
    right: var(--space-4);
  }
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
