<script setup>
import { ref, computed } from 'vue'
import taiYang from '@/assets/icons/tai_yang.svg?raw'
import yueLiang from '@/assets/icons/yue_liang.svg?raw'

const isDark = ref(document.documentElement.dataset.theme === 'dark')

const label = computed(() => (isDark.value ? '深色模式' : '浅色模式'))

function toggle() {
  isDark.value = !isDark.value
  const theme = isDark.value ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('theme-preference', theme)
}
</script>

<template>
  <button
    class="console-theme-toggle"
    :class="{ 'console-theme-toggle--dark': isDark }"
    role="switch"
    :aria-checked="isDark"
    :aria-label="`主题切换，当前${label}`"
    @click="toggle"
  >
    <span class="console-theme-toggle__label">{{ label }}</span>

    <span class="console-theme-toggle__track">
      <span class="console-theme-toggle__icon" v-html="taiYang" />
      <span class="console-theme-toggle__thumb" />
      <span class="console-theme-toggle__icon" v-html="yueLiang" />
    </span>
  </button>
</template>

<style scoped lang="less">
/* ================================================================
   Console ThemeToggle — 滑动开关
   漆器面板内的主题切换控件
   ================================================================ */

.console-theme-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 44px;
  padding: var(--space-2) 0;
  border: none;
  background: transparent;
  cursor: pointer;
  user-select: none;
}

/* --- Label ------------------------------------------------------ */
.console-theme-toggle__label {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--text-primary);
  line-height: var(--leading-normal);
}

/* --- Track（滑动轨道）------------------------------------------- */
.console-theme-toggle__track {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 56px;
  height: 30px;
  padding: 0 5px;
  border-radius: var(--radius-full);
  background: var(--bg-surface-hover);
  border: var(--border-thin) solid var(--border);
  flex-shrink: 0;
  transition: background-color var(--duration-fast) var(--ease-out);
}

/* --- Icons（两端图标）------------------------------------------- */
.console-theme-toggle__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: var(--text-tertiary);
  z-index: 0;

  svg {
    width: 100%;
    height: 100%;
  }
}

/* --- Thumb（滑动圆块）------------------------------------------- */
.console-theme-toggle__thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--bg-surface);
  box-shadow: var(--shadow-sm);
  transition: transform var(--duration-fast) var(--ease-out);
  z-index: 1;
}

/* Dark 态：thumb 滑到右侧 */
.console-theme-toggle--dark .console-theme-toggle__thumb {
  transform: translateX(26px);
}

/* Dark 态：track 泛出金色 */
.console-theme-toggle--dark .console-theme-toggle__track {
  background: var(--accent-gold-bg);
  border-color: var(--accent-gold);
}

/* --- Reduced Motion --------------------------------------------- */
@media (prefers-reduced-motion: reduce) {
  .console-theme-toggle__thumb,
  .console-theme-toggle__track {
    transition: none;
  }
}
</style>
