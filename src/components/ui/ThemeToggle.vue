<script setup>
import { ref } from 'vue'

const isDark = ref(document.documentElement.dataset.theme === 'dark')

function toggle() {
  isDark.value = !isDark.value
  const theme = isDark.value ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('theme-preference', theme)
}
</script>

<template>
  <button
    class="theme-toggle"
    :aria-label="isDark ? '切换到浅色模式' : '切换到深色模式'"
    @click="toggle"
  >
    <span class="theme-toggle__icon">{{ isDark ? '🌙' : '🌞' }}</span>
  </button>
</template>

<style scoped lang="less">
.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  padding: 0;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  cursor: pointer;
  transition: transform var(--duration-fast) var(--ease-out);

  &:active {
    transform: scale(0.9);
  }
}

.theme-toggle__icon {
  font-size: var(--text-xl);
  line-height: 1;
  user-select: none;
}
</style>
