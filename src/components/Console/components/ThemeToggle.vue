<script setup>
import { ref, computed } from 'vue'

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
      <!-- 太阳图标（左端） -->
      <span class="console-theme-toggle__icon">
        <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M473.386667 241.984a27.861333 27.861333 0 0 1-30.08-25.429333l-4.693334-56.128a27.861333 27.861333 0 0 1 55.488-4.693334l4.714667 56.149334c1.28 15.338667-10.090667 28.8-25.408 30.08zM666.752 273.557333a27.84 27.84 0 0 1-1.493333-39.36l38.314666-41.322666a27.84 27.84 0 0 1 40.832 37.866666L706.133333 272.064c-10.453333 11.285333-28.074667 11.946667-39.36 1.493333zM773.034667 415.786667a27.861333 27.861333 0 0 1 27.690666-28.010667l56.32-0.362667a27.84 27.84 0 1 1 0.362667 55.701334l-56.32 0.362666a27.861333 27.861333 0 0 1-28.053333-27.669333zM764.245333 616.810667a27.861333 27.861333 0 0 1 37.504-12.053334l50.133334 25.728a27.861333 27.861333 0 0 1-25.450667 49.557334l-50.133333-25.728a27.861333 27.861333 0 0 1-12.053334-37.504zM662.250667 729.6a27.861333 27.861333 0 0 1 36.970666 13.589333l23.68 51.136a27.861333 27.861333 0 1 1-50.56 23.381334l-23.68-51.136a27.861333 27.861333 0 0 1 13.589334-36.970667zM308.544 337.28c9.024-12.458667 6.229333-29.866667-6.250667-38.890667l-45.653333-33.024a27.861333 27.861333 0 0 0-32.64 45.141334l45.653333 33.024c12.458667 9.002667 29.866667 6.208 38.890667-6.250667zM263.509333 513.024a27.861333 27.861333 0 0 0-30.357333-25.109333l-56.106667 5.333333a27.84 27.84 0 1 0 5.290667 55.466667l56.064-5.333334a27.84 27.84 0 0 0 25.109333-30.357333zM318.677333 677.269333a27.861333 27.861333 0 0 0-38.506666-8.213333L232.896 699.733333a27.861333 27.861333 0 0 0 30.293333 46.72l47.274667-30.634666c12.906667-8.362667 16.597333-25.6 8.213333-38.506667zM480.064 760.234667a27.84 27.84 0 0 0-33.237333 21.12l-12.245334 54.997333a27.84 27.84 0 1 0 54.357334 12.096l12.245333-54.976a27.84 27.84 0 0 0-21.12-33.237333zM756.842667 499.2c0 130.773333-105.984 236.736-236.714667 236.736-130.752 0-236.736-105.984-236.736-236.714667 0-130.752 105.984-236.736 236.736-236.736 130.730667 0 236.714667 105.984 236.714667 236.736z m-236.714667 194.069333a194.069333 194.069333 0 1 0 0-388.117333 194.069333 194.069333 0 0 0 0 388.117333z"
            fill="currentColor"
          />
        </svg>
      </span>

      <!-- 滑块 -->
      <span class="console-theme-toggle__thumb" />

      <!-- 月亮图标（右端） -->
      <span class="console-theme-toggle__icon">
        <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M525.963636 93.090909c225.745455 6.981818 404.945455 193.163636 404.945455 418.909091 0 230.4-188.509091 418.909091-418.909091 418.909091-174.545455 0-323.490909-107.054545-386.327273-256H139.636364c230.4 0 418.909091-188.509091 418.909091-418.909091 0-58.181818-11.636364-111.709091-32.581819-162.909091m0-93.090909c-30.254545 0-58.181818 13.963636-76.8 39.563636-18.618182 25.6-20.945455 60.509091-9.309091 88.436364 16.290909 41.890909 25.6 83.781818 25.6 128 0 179.2-146.618182 325.818182-325.818181 325.818182h-11.636364-2.327273c-30.254545 0-58.181818 13.963636-76.8 39.563636-18.618182 25.6-20.945455 60.509091-9.309091 88.436364C121.018182 900.654545 304.872727 1024 512 1024c281.6 0 512-230.4 512-512C1024 235.054545 807.563636 9.309091 528.290909 0h-2.327273z"
            fill="currentColor"
          />
        </svg>
      </span>
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
