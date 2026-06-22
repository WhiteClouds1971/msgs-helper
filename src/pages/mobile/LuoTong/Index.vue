<script setup>
import { reactive, computed } from 'vue'
import { usePageReady } from '@/composables/usePageReady'
import { weightedPick } from '@/utils/random'

usePageReady()

const data = reactive({
  qty: 0,
})

const cardPools = [
  { divisor: 3, pool: [{ des: '杀' }, { des: '闪' }] },
  { divisor: 5, pool: [{ des: '桃' }, { des: '酒' }] },
  { divisor: 8, pool: [{ des: '无中生有' }, { des: '决斗' }] },
]

const cards = computed(() => {
  if (data.qty === 0) return []
  return cardPools
    .filter(({ divisor }) => data.qty % divisor === 0)
    .map(({ pool }) => weightedPick(pool, { count: 1 })[0]?.des ?? '')
    .filter(Boolean)
})
</script>

<template>
  <div class="panel">
    <!-- 步进器区块 -->
    <section class="panel__section">
      <h2 class="panel__title">出牌数</h2>
      <div class="stepper">
        <button
          class="stepper__btn"
          :disabled="data.qty <= 0"
          @click="data.qty--"
          aria-label="减少出牌数"
        >
          −
        </button>
        <output class="stepper__value">{{ data.qty }}</output>
        <button
          class="stepper__btn"
          @click="data.qty++"
          aria-label="增加出牌数"
        >
          +
        </button>
      </div>
    </section>

    <!-- 装饰分隔线 -->
    <hr class="decorative-line decorative-line--knotted panel__divider" />

    <!-- 结果区块 -->
    <section class="panel__section panel__section--result">
      <h2 class="panel__title">获得牌</h2>
      <div
        v-if="cards.length"
        class="result-seals"
      >
        <span
          v-for="(name, i) in cards"
          :key="i"
          class="seal-stamp result-seal"
        >{{ name }}</span>
      </div>
      <p v-else class="result-empty">无</p>
    </section>
  </div>
</template>

<style lang="less" scoped>
/* ================================================================
   LuoTong — 落筒抽签工具
   视觉隐喻：竹简签筒 — 单一面板，编绳分隔上下区块，
   朱砂印章展示结果
   ================================================================ */

/* ── 面板：整块漆器面板，充满视口 ── */
.panel {
  max-width: var(--max-width);
  margin: 0 auto;
  min-height: 100dvh;
  padding:
    calc(var(--safe-area-top) + var(--space-6))
    var(--content-padding)
    calc(var(--safe-area-bottom) + var(--space-8));
  display: flex;
  flex-direction: column;
  background: var(--bg);
  opacity: 0.8;
}

.panel__section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-6) 0;

  &--result {
    flex: 1;
    justify-content: center;
    padding-bottom: var(--space-8);
  }
}

.panel__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  color: var(--accent-gold);
  letter-spacing: 0.15em;
}

.panel__divider {
  margin: 0;
  flex-shrink: 0;
}

/* ── 步进器 ── */
.stepper {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.stepper__btn {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: var(--border-medium) solid var(--accent-gold);
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--accent-gold);
  font-size: 24px;
  font-weight: var(--font-light);
  line-height: 1;
  cursor: pointer;
  touch-action: manipulation;
  transition:
    transform var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out);

  &:active:not(:disabled) {
    transform: scale(0.92);
    background: var(--accent-gold-bg);
    box-shadow: var(--shadow-glow-gold);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
}

.stepper__value {
  min-width: 3ch;
  text-align: center;
  font-family: var(--font-display);
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

/* ── 结果区 ── */
.result-seals {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-3);
}

.result-seal {
  font-size: var(--text-base);
  padding: var(--space-2) var(--space-3);
}

.result-empty {
  margin: 0;
  font-family: var(--font-body);
  font-size: var(--text-lg);
  color: var(--text-tertiary);
}

/* ── 无障碍 ── */
@media (prefers-reduced-motion: reduce) {
  .stepper__btn {
    transition: none;
  }
}
</style>
