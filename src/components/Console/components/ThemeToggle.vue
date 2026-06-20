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
      <!-- 昼：左侧暖光区域 -->
      <span class="console-theme-toggle__day">
        <span class="console-theme-toggle__day-glow" />
        <span class="console-theme-toggle__track-icon" v-html="taiYang" />
      </span>

      <!-- 夜：右侧星空区域 -->
      <span class="console-theme-toggle__night">
        <span class="console-theme-toggle__star" v-for="i in 4" :key="i" />
        <span class="console-theme-toggle__track-icon" v-html="yueLiang" />
      </span>

      <!-- 滑块 -->
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
   灵感：日升月落、墨洇纸背
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

/* ================================================================
   Track — 昼夜渐变轨道
   暖金宣纸 → 冷墨夜空
   ================================================================ */
.console-theme-toggle__track {
  position: relative;
  display: flex;
  align-items: center;
  width: 104px;
  height: 36px;
  border-radius: var(--radius-full);
  background: linear-gradient(
    to right,
    #fef7e0 0%,
    #f5f0e5 38%,
    #2a2a38 62%,
    #16162a 100%
  );
  box-shadow:
    inset 0 1px 2px rgba(0, 0, 0, 0.06),
    0 1px 2px rgba(0, 0, 0, 0.04);
  flex-shrink: 0;
  overflow: hidden;
  transition: box-shadow var(--duration-slow) var(--ease-out);
}

.console-theme-toggle--dark .console-theme-toggle__track {
  box-shadow:
    inset 0 1px 2px rgba(0, 0, 0, 0.12),
    0 0 8px rgba(212, 168, 67, 0.15);
}

/* ================================================================
   Day Side — 暖光区
   ================================================================ */
.console-theme-toggle__day {
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
  width: 40px;
  height: 40px;
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
   Night Side — 星空区
   ================================================================ */
.console-theme-toggle__night {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50%;
  height: 100%;
  z-index: 0;
}

/* 星点 — 随机散布的小亮圆 */
.console-theme-toggle__star {
  position: absolute;
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background: #fff;
  opacity: 0;
  transition: opacity var(--duration-slow) var(--ease-ink);
  pointer-events: none;
}

/* 用 CSS 变量伪装随机位置（编译时展开为静态值） */
.console-theme-toggle__star:nth-child(1) {
  top: 8px;
  left: 14px;
}
.console-theme-toggle__star:nth-child(2) {
  top: 14px;
  left: 32px;
  width: 1.5px;
  height: 1.5px;
}
.console-theme-toggle__star:nth-child(3) {
  top: 8px;
  left: 22px;
  width: 1.5px;
  height: 1.5px;
}
.console-theme-toggle__star:nth-child(4) {
  top: 20px;
  left: 10px;
}

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
   Track Icons — 两端日月图标
   ================================================================ */
.console-theme-toggle__track-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  z-index: 1;
  transition: color var(--duration-slow) var(--ease-out);

  :deep(svg) {
    width: 100%;
    height: 100%;
  }
}

/* 日：暖金色 */
.console-theme-toggle__day .console-theme-toggle__track-icon {
  color: #d4a843;
}

.console-theme-toggle--dark .console-theme-toggle__day .console-theme-toggle__track-icon {
  color: #8b7332;
}

/* 月：冷银白 */
.console-theme-toggle__night .console-theme-toggle__track-icon {
  color: #8899aa;
}

.console-theme-toggle--dark .console-theme-toggle__night .console-theme-toggle__track-icon {
  color: #c8d6e5;
}

/* ================================================================
   Thumb — 滑动圆块
   墨洇沉降般地滑到对侧
   ================================================================ */
.console-theme-toggle__thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--bg-surface);
  box-shadow:
    0 2px 6px rgba(0, 0, 0, 0.12),
    0 0 0 1px rgba(0, 0, 0, 0.04);
  z-index: 2;
  transition: transform 450ms cubic-bezier(0.34, 1.3, 0.64, 1);
}

/* Dark 态：滑到右侧 */
.console-theme-toggle--dark .console-theme-toggle__thumb {
  transform: translateX(68px);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(0, 0, 0, 0.06);
}

/* ================================================================
   Thumb Inner — 滑块内的微光
   轻触时光点微闪
   ================================================================ */
.console-theme-toggle__thumb-inner {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    #f0c060 0%,
    transparent 80%
  );
  transform: translate(-50%, -50%);
  transition:
    width var(--duration-slow) var(--ease-out),
    height var(--duration-slow) var(--ease-out),
    background var(--duration-slow) var(--ease-out);
}

.console-theme-toggle__thumb-inner.is-dark {
  width: 8px;
  height: 8px;
  background: radial-gradient(
    circle,
    #b8c8e8 0%,
    transparent 80%
  );
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
