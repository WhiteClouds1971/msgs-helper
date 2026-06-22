<script setup>
import { reactive, computed } from 'vue'
import { usePageReady } from '@/composables/usePageReady'
import { weightedPick } from '@/utils/random'

usePageReady()

const data = reactive({
  qty: 0,
})

const cardPools = [
  { divisor: 3, pool: [{ des: '【杀】' }, { des: '【闪】' }] },
  { divisor: 5, pool: [{ des: '【桃】' }, { des: '【酒】' }] },
  { divisor: 8, pool: [{ des: '【无中生有】' }, { des: '【决斗】' }] },
]

const card = computed(() => {
  if (data.qty === 0) return ''
  return cardPools
    .filter(({ divisor }) => data.qty % divisor === 0)
    .map(({ pool }) => weightedPick(pool, { count: 1 })[0]?.des ?? '')
    .filter(Boolean)
    .join('、')
})
</script>

<template>
  <div class="page">
    <div class="stepper">
      <span class="stepper__label">出牌数</span>
      <div class="stepper__controls">
        <button
          class="stepper__btn"
          :disabled="data.qty <= 0"
          @click="data.qty--"
        >
          −
        </button>
        <input
          class="stepper__input"
          type="number"
          v-model.number="data.qty"
          min="0"
        />
        <button class="stepper__btn" @click="data.qty++">+</button>
      </div>
    </div>

    <div class="card">
      <span>获得牌：{{ card || '无' }}</span>
    </div>
  </div>
</template>

<style lang="less" scoped>
.page {
  padding: 16px;
  min-height: 100vh;
}

.stepper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);

  &__label {
    font-size: 16px;
    font-weight: 500;
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__btn {
    width: 40px;
    height: 40px;
    border: 1px solid #e5e5e5;
    border-radius: 50%;
    background: #f5f5f5;
    font-size: 20px;
    line-height: 1;
    color: #333;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s;

    &:active {
      background: #e0e0e0;
    }

    &:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }
  }

  &__input {
    width: 56px;
    height: 36px;
    text-align: center;
    font-size: 18px;
    font-weight: 600;
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    background: #fafafa;

    // 隐藏原生 spinner
    &::-webkit-inner-spin-button,
    &::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    -moz-appearance: textfield;
  }
}

.card {
  margin-top: 20px;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  text-align: center;
  font-size: 17px;
  color: #333;
}
</style>
