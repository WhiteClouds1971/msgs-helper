<script setup>
import { ref } from 'vue'
import SplashScreen from '@/components/ui/SplashScreen/Index.vue'

const size = ref(80)
const showLine = ref(true)
const subtitle = ref('墨韵金章')
</script>

<template>
  <div class="demo-page">
    <div class="demo-controls">
      <label>
        Size:
        <input v-model.number="size" type="range" min="40" max="200" step="10" />
        {{ size }}px
      </label>
      <label>
        <input v-model="showLine" type="checkbox" />
        Show Line
      </label>
      <label>
        Subtitle:
        <input v-model="subtitle" type="text" />
      </label>
    </div>

    <SplashScreen
      :size="size"
      :show-line="showLine"
      :subtitle="subtitle"
    />
  </div>
</template>

<style scoped lang="less">
.demo-page {
  width: 100vw;
  min-height: 100dvh;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-8);
  padding: var(--space-4);
}

.demo-controls {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--text-secondary);

  label {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  input[type="range"] {
    width: 120px;
  }

  input[type="text"] {
    background: var(--bg-surface);
    border: var(--border-thin) solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    padding: 2px 8px;
  }
}
</style>
