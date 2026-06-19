<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useMenuOrderStore } from '@/stores/menuOrder'
import HomePageCard from '@/pages/home/components/HomePageCard.vue'

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

/** 卡片偏移比例（占自身宽度的百分比）
 *  card-stack 左右 inset = 1/10 vw → 卡片宽 80vw，右侧 margin 10vw
 *  偏移 12.5% 正好填满右侧 margin，不留多余空白
 *  第1张 0%     — 完整展示
 *  第2张 8.75%  — 右侧留白区内占 7/10
 *  第3张 12.5%  — 占满剩余 3/10，右边缘对齐视口 */
const CARD_OFFSET_PCT = [0, 8.75, 12.5]

/* ---- 滑动动画状态 ---- */
const isAnimating = ref(false)
const swipeAnim = ref(null)   // { menuName, dir: -1|1, prevNames: Set }
const enteringCards = ref(new Set()) // 正在入场的卡片名

const visibleCards = computed(() => {
  const total = menuStore.orderedMenus.length
  const cards = []
  for (let i = 0; i < Math.min(3, total); i++) {
    const idx = (currentIndex.value + i) % total
    const menu = menuStore.orderedMenus[idx]
    cards.push({
      menu,
      offset: i,
      isFront: i === 0,
      isEntering: enteringCards.value.has(menu.name),
    })
  }

  // 动画期间保留退出卡片在列表中
  if (swipeAnim.value) {
    const exiting = menuStore.orderedMenus.find(m => m.name === swipeAnim.value.menuName)
    if (exiting && !cards.find(c => c.menu.name === exiting.name)) {
      cards.push({
        menu: exiting,
        offset: -1,
        isFront: false,
        isExiting: true,
        isEntering: false,
      })
    }
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

/** 每层卡片独立的动画样式 */
function getCardStyle(offset, isExiting, isEntering) {
  // 退出层：滑出 + 淡出
  if (isExiting && swipeAnim.value) {
    const exitX = swipeAnim.value.dir === -1 ? '-30%' : '30%'
    return { transform: `translateX(${exitX})`, opacity: 0, zIndex: 10 }
  }

  // 入场层：从一侧滑入 + 淡入（首帧设置起点，下一帧清除 enteringCards 触发过渡）
  if (isEntering && swipeAnim.value) {
    const basePct = offset < CARD_OFFSET_PCT.length ? CARD_OFFSET_PCT[offset] : 0
    const enterFrom = swipeAnim.value.dir === -1
      ? basePct + 12   // 左滑 → 新卡从右侧入场
      : basePct - 12   // 右滑 → 新卡从左侧入场
    return { transform: `translateX(${enterFrom}%)`, opacity: 0, zIndex: 3 - offset }
  }

  // 正常层
  return {
    transform: offset < CARD_OFFSET_PCT.length
      ? `translateX(${CARD_OFFSET_PCT[offset]}%)`
      : 'translateX(0)',
    zIndex: 3 - offset,
  }
}

/* ---- 滑动手势 ---- */
function onTouchStart(e) {
  if (isAnimating.value) return
  startX = e.touches[0].clientX
  deltaX = 0
}

function onTouchMove(e) {
  if (isAnimating.value) return
  deltaX = e.touches[0].clientX - startX
}

function onTouchEnd() {
  if (isAnimating.value) return
  const threshold = Math.max(cardWidth * 0.25, 80)
  if (Math.abs(deltaX) > threshold) {
    if (deltaX < 0 && canSwipeLeft.value) {
      triggerSwipe(-1)
    } else if (deltaX > 0 && canSwipeRight.value) {
      triggerSwipe(1)
    }
  }
  deltaX = 0
}

/** 触发卡片切换动画 — 每层独立动画：
 *  退出层：滑出 + 淡出（200ms）
 *  移位层：CSS transition 平滑过渡到新偏移
 *  入场层：从对侧滑入 + 淡入（200ms）
 *  三组动画同步开始、同步结束 */
function triggerSwipe(dir) {
  const frontCard = visibleCards.value[0]
  if (!frontCard) return

  isAnimating.value = true

  // 记住切换前的卡片集合
  const prevNames = new Set(visibleCards.value.map(c => c.menu.name))
  swipeAnim.value = { menuName: frontCard.menu.name, dir, prevNames }

  // 更新索引
  if (dir === -1) currentIndex.value++
  else currentIndex.value--

  // 标记新入场的卡片（在 prevNames 中不存在的）
  const currentNames = new Set(visibleCards.value.map(c => c.menu.name))
  enteringCards.value = new Set([...currentNames].filter(n => !prevNames.has(n)))

  // 等 Vue 渲染完入场起点 → 强制 reflow 锁定 from 状态 → 清除入场标记触发过渡
  nextTick(() => {
    void cardStackRef.value?.offsetHeight
    enteringCards.value = new Set()
  })

  // 200ms 后清理退出卡片
  setTimeout(() => {
    swipeAnim.value = null
    isAnimating.value = false
  }, 200)
}

/* ---- 卡片点击 → 导航 ---- */
function onCardClick(menu) {
  if (isAnimating.value) return
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
      :class="{ 'card-stack--animating': isAnimating }"
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
        :style="getCardStyle(card.offset, card.isExiting, card.isEntering)"
        @click="onCardClick(card.menu)"
      />

      <!-- 边界提示 -->
      <div
        v-if="!canSwipeLeft && visibleCards.length > 0"
        class="stack-hint stack-hint--right"
      >
        已是最后一页
      </div>
      <div
        v-if="!canSwipeRight && currentIndex > 0"
        class="stack-hint stack-hint--left"
      >
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
  inset: calc(100dvh / 10) calc(100vw / 10);
  z-index: 1;
  border-radius: var(--radius-lg);
  /* 保留纵向触摸滚动，横向手势由 JS 接管 */
  touch-action: pan-y;
}

/* 动画期间：卡片过渡加速，匹配滑动节奏（reduced-motion 自动退化至 0ms） */
.card-stack--animating :deep(.home-card) {
  transition:
    transform var(--duration-normal) var(--ease-enter),
    opacity var(--duration-normal) var(--ease-enter),
    box-shadow var(--duration-normal) var(--ease-enter);
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
