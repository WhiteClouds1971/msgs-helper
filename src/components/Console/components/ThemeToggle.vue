<script setup>
import { useTheme } from '@/composables/useTheme'
import taiYang from '@/assets/icons/tai_yang.svg?raw'
import yueLiang from '@/assets/icons/yue_liang.svg?raw'

const { isDark, toggle } = useTheme()
</script>

<template>
  <button
    class="console-theme-toggle"
    :class="{ 'console-theme-toggle--dark': isDark }"
    role="switch"
    :aria-checked="isDark"
    aria-label="主题切换"
    @click="toggle"
  >
    <span class="console-theme-toggle__track">
      <span class="console-theme-toggle__day">
        <span class="console-theme-toggle__day-glow" />
        <span class="console-theme-toggle__track-icon" v-html="taiYang" />
      </span>

      <span class="console-theme-toggle__night">
        <span class="console-theme-toggle__star" v-for="i in 4" :key="i" />
        <span class="console-theme-toggle__track-icon" v-html="yueLiang" />
      </span>

      <span class="console-theme-toggle__thumb">
        <span
          class="console-theme-toggle__thumb-inner"
          :class="{ 'is-dark': isDark }"
        />
      </span>
    </span>
  </button>
</template>

<style scoped lang="less">
/* ================================================================
   Console ThemeToggle — 昼夜滑动开关
   全 em 单位，随容器 font-size 自适应缩放
   ================================================================ */

.console-theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
  user-select: none;
}

/* ================================================================
   Track
   ================================================================ */
.console-theme-toggle__track {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 2.2em;
  border-radius: var(--radius-full);
  background: linear-gradient(
    to right,
    #fef7e0 0%,
    #f4e4c8 22%,
    #e0ceaa 42%,
    #b0a090 58%,
    #6b6068 72%,
    #35303e 86%,
    #16162a 100%
  );
  box-shadow:
    inset 0 1px 2px rgba(0, 0, 0, 0.06),
    0 1px 2px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  transition: box-shadow var(--duration-slow) var(--ease-out);
}

.console-theme-toggle--dark .console-theme-toggle__track {
  box-shadow:
    inset 0 1px 2px rgba(0, 0, 0, 0.12),
    0 0 8px rgba(212, 168, 67, 0.15);
}

/* ================================================================
   Day / Night halves
   ================================================================ */
.console-theme-toggle__day,
.console-theme-toggle__night {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50%;
  height: 100%;
  z-index: 0;
}

/* 暖光晕 */
.console-theme-toggle__day-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 2.4em;
  height: 2.4em;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 200, 80, 0.25) 0%,
    transparent 70%
  );
  transform: translate(-50%, -50%);
  transition: opacity var(--duration-slow) var(--ease-out);
  pointer-events: none;
}

.console-theme-toggle--dark .console-theme-toggle__day-glow {
  opacity: 0.3;
}

/* ================================================================
   Stars — 百分比定位，自适应 track 宽度
   ================================================================ */
.console-theme-toggle__star {
  position: absolute;
  width: 0.12em;
  height: 0.12em;
  border-radius: 50%;
  background: #fff;
  opacity: 0;
  transition: opacity var(--duration-slow) var(--ease-ink);
  pointer-events: none;
}

.console-theme-toggle__star:nth-child(1) { top: 22%; left: 28%; }
.console-theme-toggle__star:nth-child(2) { top: 40%; left: 65%; width: 0.09em; height: 0.09em; }
.console-theme-toggle__star:nth-child(3) { top: 22%; left: 44%; width: 0.09em; height: 0.09em; }
.console-theme-toggle__star:nth-child(4) { top: 56%; left: 20%; }

.console-theme-toggle--dark .console-theme-toggle__star {
  opacity: 0.7;
  animation: star-twinkle 2s var(--ease-in-out) infinite;
}

.console-theme-toggle__star:nth-child(2) { animation-delay: 0.6s; }
.console-theme-toggle__star:nth-child(3) { animation-delay: 1.3s; }
.console-theme-toggle__star:nth-child(4) { animation-delay: 0.2s; }

@keyframes star-twinkle {
  0%, 100% { opacity: 0.4; }
  50%      { opacity: 0.85; }
}

/* ================================================================
   Track Icons
   ================================================================ */
.console-theme-toggle__track-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1em;
  height: 1em;
  z-index: 1;
  transition: color var(--duration-slow) var(--ease-out);

  :deep(svg) {
    width: 100%;
    height: 100%;
  }
}

.console-theme-toggle__day .console-theme-toggle__track-icon {
  color: #d4a843;
}

.console-theme-toggle--dark .console-theme-toggle__day .console-theme-toggle__track-icon {
  color: #8b7332;
}

.console-theme-toggle__night .console-theme-toggle__track-icon {
  color: #8899aa;
}

.console-theme-toggle--dark .console-theme-toggle__night .console-theme-toggle__track-icon {
  color: #c8d6e5;
}

/* ================================================================
   Thumb — left calc 定位，两端均可过渡
   ================================================================ */
.console-theme-toggle__thumb {
  position: absolute;
  top: 0.2em;
  left: 0.2em;
  width: 1.8em;
  height: 1.8em;
  border-radius: 50%;
  background: var(--bg-surface);
  box-shadow:
    0 2px 6px rgba(0, 0, 0, 0.12),
    0 0 0 1px rgba(0, 0, 0, 0.04);
  z-index: 2;
  transition:
    left 400ms cubic-bezier(0.25, 0.1, 0.1, 1),
    box-shadow var(--duration-slow) var(--ease-out);
}

.console-theme-toggle--dark .console-theme-toggle__thumb {
  left: calc(100% - 1.8em - 0.2em);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(0, 0, 0, 0.06);
}

/* ================================================================
   Thumb Inner — 光点
   ================================================================ */
.console-theme-toggle__thumb-inner {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0.55em;
  height: 0.55em;
  border-radius: 50%;
  background: radial-gradient(circle, #f0c060 0%, transparent 80%);
  transform: translate(-50%, -50%);
  transition:
    width var(--duration-slow) var(--ease-out),
    height var(--duration-slow) var(--ease-out),
    background var(--duration-slow) var(--ease-out);
}

.console-theme-toggle__thumb-inner.is-dark {
  width: 0.45em;
  height: 0.45em;
  background: radial-gradient(circle, #b8c8e8 0%, transparent 80%);
}

/* ================================================================
   Reduced Motion
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .console-theme-toggle__thumb {
    transition: none;
  }

  .console-theme-toggle__star {
    animation: none;
  }
}
</style>
