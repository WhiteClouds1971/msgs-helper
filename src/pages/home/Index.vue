<script setup>
  import { ref, computed, watch, nextTick, reactive } from 'vue';
  import { useRouter } from 'vue-router';
  import { useMenuOrderStore } from '@/stores/menuOrder';
  import { usePageReady } from '@/composables/usePageReady';
  import HomePageCard from '@/pages/home/components/HomePageCard.vue';
  import InkWashBackground from '@/components/InkWashBackground/Index.vue';

  const router = useRouter();
  const menuStore = useMenuOrderStore();
  const { markReady } = usePageReady({ auto: false });

  /* ---- 触摸坐标（透传给动态背景） ---- */
  const touchPos = reactive({ x: 0, y: 0, active: false });

  /* ================================================================
   卡片扇形展开参数
   ================================================================ */
  const OFFSET_BY_DIST = [0, 8.75, 12.5];

  function relOffsetPct(relPos) {
    const sign = relPos < 0 ? -1 : 1;
    const abs = Math.abs(relPos);
    if (abs >= OFFSET_BY_DIST.length)
      return sign * OFFSET_BY_DIST[OFFSET_BY_DIST.length - 1];
    const lo = Math.floor(abs);
    const hi = Math.min(lo + 1, OFFSET_BY_DIST.length - 1);
    return (
      sign *
      (OFFSET_BY_DIST[lo] +
        (abs - lo) * (OFFSET_BY_DIST[hi] - OFFSET_BY_DIST[lo]))
    );
  }

  function relZIndex(relPos) {
    return Math.round(5 - Math.abs(relPos));
  }

  /* ================================================================
   状态
   ================================================================ */
  const currentIndex = ref(0);
  const totalCards = computed(() => menuStore.orderedMenus.length);

  // 切换时：先全部弱化 → 再淡入新前置卡片
  const isResetting = ref(false);

  watch(currentIndex, () => {
    isResetting.value = true;
    // 双 RAF：确保浏览器先绘制重置帧（全部弱化），再触发淡入
    nextTick(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          isResetting.value = false;
        });
      });
    });
  });

  // 菜单数量变化时，防止 currentIndex 越界
  watch(totalCards, n => {
    if (n > 0 && currentIndex.value >= n) currentIndex.value = n - 1;
  });

  const MAX_LEFT = 5;
  const MAX_RIGHT = 5;

  const visibleCards = computed(() => {
    const total = totalCards.value;
    if (total === 0) return [];
    const ci = currentIndex.value;
    const cards = [];

    for (let d = Math.min(MAX_LEFT, ci); d > 0; d--) {
      cards.push({
        menu: menuStore.orderedMenus[ci - d],
        relPos: -d,
        isFront: false,
      });
    }
    cards.push({
      menu: menuStore.orderedMenus[ci],
      relPos: 0,
      isFront: !isResetting.value,
    });
    for (let d = 1; d <= MAX_RIGHT && ci + d < total; d++) {
      cards.push({
        menu: menuStore.orderedMenus[ci + d],
        relPos: d,
        isFront: false,
      });
    }

    return cards;
  });

  function getCardStyle(relPos, isFront) {
    // 切换瞬间：全部弱化为背景态
    if (isResetting.value) {
      return {
        transform: `translateX(${relOffsetPct(relPos)}%)`,
        zIndex: relZIndex(relPos),
        opacity: 0.55,
        filter: 'blur(1.5px) brightness(0.85)',
      };
    }
    // 正常态：前置凸显，背景弱化；显式值确保过渡可插值
    return {
      transform: `translateX(${relOffsetPct(relPos)}%)`,
      zIndex: relZIndex(relPos),
      opacity: isFront ? 1 : 0.55,
      filter: isFront
        ? 'blur(0px) brightness(1)'
        : 'blur(1.5px) brightness(0.85)',
    };
  }

  /* ================================================================
   手势：gate 累积模式，每满 step px 切一张
   step 动态缩小：手速越快 → step 越小 → 同样距离切更多卡片
   碰壁时 gate 不推进，反向立刻响应
   ================================================================ */
  const BASE_STEP = 40; // 慢速时的基准步长（px）
  const MIN_STEP = 18; // 最快时的步长下限

  let gateX = 0;
  let touchStartX = 0;
  let touchStartY = 0;
  let lastX = 0;
  let lastT = 0;
  let velocity = 0; // 平滑速度（px/ms）
  let hasSwitched = false;
  let touchStartTime = 0; // touchstart 时间戳

  const FLICK_MS = 180; // 短于此时间的手势只切一张

  function clampIdx(v) {
    return Math.max(0, Math.min(totalCards.value - 1, v));
  }

  function onTouchStart(e) {
    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;
    gateX = x;
    touchStartX = x;
    touchStartY = y;
    lastX = x;
    lastT = performance.now();
    touchStartTime = lastT;
    velocity = 0;
    hasSwitched = false;

    touchPos.x = x;
    touchPos.y = y;
    touchPos.active = true;
  }

  function onTouchMove(e) {
    const now = performance.now();
    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;
    const dt = now - lastT;

    if (dt > 0) {
      const iv = Math.abs(x - lastX) / dt;
      velocity = velocity * 0.7 + iv * 0.3;
    }
    lastX = x;
    lastT = now;

    touchPos.x = x;
    touchPos.y = y;

    const isFlick = now - touchStartTime < FLICK_MS;
    const step = Math.max(MIN_STEP, BASE_STEP - velocity * 35);
    const absDx = Math.abs(x - gateX);

    // ── 首切：10px 即触发 ──
    if (!hasSwitched) {
      if (absDx < 10) return;
      hasSwitched = true;
      const dir = x - gateX > 0 ? 1 : -1;
      const newIdx = clampIdx(currentIndex.value - dir);
      if (newIdx !== currentIndex.value) {
        currentIndex.value = newIdx;
      }
      gateX = x;
      return;
    }

    // ── 快速轻划（< 180ms）：最多一张，跳过后续累积 ──
    if (isFlick) return;

    // ── 持续拖拽（≥ 180ms）：标准 gate 多张切换 ──
    if (absDx < 5) return;

    const dir = x - gateX > 0 ? 1 : -1;
    const rawSteps = Math.floor(absDx / step);
    if (rawSteps === 0) return;

    const newIdx = clampIdx(currentIndex.value - dir * rawSteps);
    const actual = Math.abs(newIdx - currentIndex.value);
    gateX += dir * actual * step;
    currentIndex.value = newIdx;
  }

  const cardStackRef = ref(null);

  function onTouchEnd(e) {
    touchPos.active = false;

    // 只在卡片堆叠区域内响应 tap
    const stack = cardStackRef.value;
    if (!stack) return;
    const rect = stack.getBoundingClientRect();
    const x = e.changedTouches[0].clientX;
    const y = e.changedTouches[0].clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom)
      return;

    const dx = Math.abs(x - touchStartX);
    const dy = Math.abs(y - touchStartY);
    if (dx < 10 && dy < 10) {
      const front = visibleCards.value.find(c => c.relPos === 0);
      if (front) onCardClick(front.menu);
    }
  }

  /* ---- 卡片点击 → 导航 ---- */
  function onCardClick(menu) {
    menuStore.recordAccess(menu.name);
    router.push(menu.route);
  }

  /* ---- 首屏过渡：检测可见卡片全部就绪 → markReady ---- */
  const splashResolved = ref(new Set());
  let splashDone = false;

  function onCardImageResolved(menuName) {
    if (splashDone) return;
    splashResolved.value.add(menuName);

    // 用 nextTick 等当前帧可见卡片列表稳定
    nextTick(() => {
      if (splashDone) return;
      const visibleNames = visibleCards.value.map(c => c.menu.name);
      if (visibleNames.length === 0) return;

      const allResolved = visibleNames.every(n => splashResolved.value.has(n));
      if (allResolved) {
        splashDone = true;
        markReady();
      }
    });
  }
</script>

<template>
  <div class="home-page texture-rice-paper">
    <InkWashBackground :touch-pos="touchPos" />

    <div
      ref="cardStackRef"
      class="card-stack"
      :class="{ 'card-stack--resetting': isResetting }"
    >
      <HomePageCard
        v-for="card in visibleCards"
        :key="card.menu.name"
        :menu="card.menu"
        :is-front="card.isFront"
        :offset="card.relPos"
        :style="getCardStyle(card.relPos, card.isFront)"
        @click="onCardClick(card.menu)"
        @image-resolved="onCardImageResolved(card.menu.name)"
      />
    </div>

    <!-- 触摸蒙层：覆盖卡片区域，永存 DOM，touch 序列不断 -->
    <div
      class="touch-mask"
      @touchstart.passive="onTouchStart"
      @touchmove.passive="onTouchMove"
      @touchend="onTouchEnd"
    />

    <div v-if="currentIndex === 0" class="swipe-hint">左右拖动快速切换菜单</div>
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
    z-index: 2; /* 高于动态背景 canvas (z-index: 1) */
    border-radius: var(--radius-lg);
    touch-action: pan-y;
  }

  /* 切换瞬间：关闭所有过渡，卡片立刻统一弱化 */
  .card-stack--resetting :deep(.home-card) {
    transition-duration: 0ms !important;
  }

  /* ================================================================
   滑动提示 — 卡片下方留白居中
   ================================================================ */
  .swipe-hint {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: calc(100dvh / 10);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--text-sm);
    color: var(--text-primary);
    z-index: 10;
    pointer-events: none;
    user-select: none;
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
