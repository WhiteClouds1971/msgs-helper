<script setup>
import { ref, onMounted } from 'vue';

const themes = ['system', 'light', 'dark'];
const themeLabels = { system: '🔄 系统', light: '☀️ 浅色', dark: '🌙 深色' };
const currentTheme = ref('system');

function setTheme(mode) {
  currentTheme.value = mode;
  if (mode === 'system') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', mode);
  }
  localStorage.setItem('theme-preference', mode);
}

// Color tokens
const bgTokens = ['--bg', '--bg-surface', '--bg-surface-hover'];
const textTokens = ['--text-primary', '--text-secondary', '--text-tertiary', '--text-inverse'];
const goldTokens = ['--accent-gold', '--accent-gold-dark', '--accent-gold-light', '--accent-gold-bg'];
const redTokens = ['--accent-red', '--accent-red-light', '--accent-red-bg'];
const greenTokens = ['--accent-green', '--accent-green-light', '--accent-green-bg'];
const borderTokens = ['--border', '--border-light'];

// Helper: background tokens 和 light bg tokens 用暗色文字
function isDarkBg(token) {
  return ['--bg', '--bg-surface', '--bg-surface-hover'].includes(token);
}
function isGoldDark(token) {
  return token === '--accent-gold-bg';
}
function isRedDark(token) {
  return token === '--accent-red-bg';
}
function isGreenDark(token) {
  return token === '--accent-green-bg';
}

// Typography scale
const typeScale = [
  { token: '--text-xs', size: '12px' },
  { token: '--text-sm', size: '14px' },
  { token: '--text-base', size: '16px' },
  { token: '--text-lg', size: '18px' },
  { token: '--text-xl', size: '20px' },
  { token: '--text-2xl', size: '24px' },
  { token: '--text-3xl', size: '30px' },
  { token: '--text-4xl', size: '36px' },
];

onMounted(() => {
  const saved = localStorage.getItem('theme-preference') || 'system';
  setTheme(saved);
});
</script>

<template>
  <div class="demo-page">
    <!-- ===== Header ===== -->
    <header class="demo-header">
      <h1 class="demo-title">
        墨韵金章
      </h1>
      <p class="demo-subtitle">
        Design System Showcase
      </p>
      <div class="theme-toggle">
        <button
          v-for="t in themes"
          :key="t"
          :class="['theme-btn', { 'is-active': currentTheme === t }]"
          @click="setTheme(t)"
        >
          {{ themeLabels[t] }}
        </button>
      </div>
    </header>

    <hr class="decorative-line">

    <!-- ===== Color Palette ===== -->
    <section class="demo-section">
      <h2 class="section-title">🎨 色彩 (Colors)</h2>

      <!-- 背景色 -->
      <h3 class="subsection-title">背景 (Background)</h3>
      <div class="swatch-group">
        <div class="swatch" v-for="token in bgTokens" :key="token" :style="{ background: `var(--${token})` }">
          <span class="swatch-label" :class="{ 'swatch-label--dark': isDarkBg(token) }">{{ token }}</span>
        </div>
      </div>

      <!-- 文字色 -->
      <h3 class="subsection-title">文字 (Text)</h3>
      <div class="swatch-group">
        <div class="swatch" v-for="token in textTokens" :key="token" :style="{ background: `var(--${token})` }">
          <span class="swatch-label swatch-label--dark">{{ token }}</span>
        </div>
      </div>

      <!-- 金色系 -->
      <h3 class="subsection-title">金色 (Gold)</h3>
      <div class="swatch-group">
        <div class="swatch" v-for="token in goldTokens" :key="token" :style="{ background: `var(--${token})` }">
          <span class="swatch-label" :class="{ 'swatch-label--dark': isGoldDark(token) }">{{ token }}</span>
        </div>
      </div>

      <!-- 红色系 -->
      <h3 class="subsection-title">朱砂 (Vermillion)</h3>
      <div class="swatch-group">
        <div class="swatch" v-for="token in redTokens" :key="token" :style="{ background: `var(--${token})` }">
          <span class="swatch-label" :class="{ 'swatch-label--dark': isRedDark(token) }">{{ token }}</span>
        </div>
      </div>

      <!-- 绿色系 -->
      <h3 class="subsection-title">铜绿 (Patina)</h3>
      <div class="swatch-group">
        <div class="swatch" v-for="token in greenTokens" :key="token" :style="{ background: `var(--${token})` }">
          <span class="swatch-label" :class="{ 'swatch-label--dark': isGreenDark(token) }">{{ token }}</span>
        </div>
      </div>

      <!-- 边框色 -->
      <h3 class="subsection-title">边框 (Border)</h3>
      <div class="swatch-group">
        <div class="swatch" v-for="token in borderTokens" :key="token" :style="{ background: `var(--${token})` }">
          <span class="swatch-label swatch-label--dark">{{ token }}</span>
        </div>
      </div>
    </section>

    <!-- ===== Typography ===== -->
    <section class="demo-section">
      <h2 class="section-title">🔤 字体 (Typography)</h2>

      <!-- 字体族对比 -->
      <h3 class="subsection-title">书法体 vs 正文字体</h3>
      <div class="type-compare">
        <p class="type-display">天地玄黄 宇宙洪荒</p>
        <span class="type-label">var(--font-display) · Ma Shan Zheng</span>
        <p class="type-body">天地玄黄 宇宙洪荒</p>
        <span class="type-label">var(--font-body) · PingFang SC</span>
      </div>

      <!-- 字号阶梯 -->
      <h3 class="subsection-title">字号阶梯 (Type Scale)</h3>
      <div class="type-scale">
        <div class="type-row" v-for="item in typeScale" :key="item.token">
          <span class="type-token">{{ item.token }}</span>
          <span class="type-size">{{ item.size }}</span>
          <span :style="{ fontSize: `var(--${item.token})` }" class="type-sample">面杀辅助工具</span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.demo-page {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: var(--safe-area-top) var(--content-padding) var(--space-12);
}

/* === Header === */
.demo-header {
  text-align: center;
  padding: var(--space-12) 0 var(--space-6);
}

.demo-title {
  font-family: var(--font-display);
  font-size: var(--text-4xl);
  color: var(--accent-gold);
  margin: 0 0 var(--space-2);
  line-height: var(--leading-tight);
}

.demo-subtitle {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  margin: 0 0 var(--space-6);
  letter-spacing: 0.05em;
}

/* Theme Toggle */
.theme-toggle {
  display: inline-flex;
  gap: var(--space-1);
  background: var(--bg-surface);
  border: var(--border-thin) solid var(--border);
  border-radius: var(--radius-md);
  padding: 3px;
}

.theme-btn {
  padding: var(--space-2) var(--space-4);
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  cursor: pointer;
  min-height: 44px;
  transition: background-color var(--duration-fast) var(--ease-out),
              color var(--duration-fast) var(--ease-out);
}

.theme-btn.is-active {
  background: var(--accent-gold-dark);
  color: var(--text-inverse);
}

/* === Section Shared === */
.demo-section {
  padding: var(--space-8) 0;
}

.section-title {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  color: var(--text-primary);
  margin: 0 0 var(--space-6);
  padding-bottom: var(--space-3);
  border-bottom: var(--border-thin) solid var(--border);
}

.subsection-title {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
  margin: var(--space-4) 0 var(--space-2);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* === Color Swatches === */
.swatch-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.swatch {
  width: 80px;
  height: 56px;
  border-radius: var(--radius-sm);
  border: var(--border-thin) solid var(--border);
  display: flex;
  align-items: flex-end;
  padding: var(--space-1);
  box-sizing: border-box;
}

.swatch-label {
  font-family: var(--font-mono);
  font-size: 8px;
  color: var(--text-primary);
  line-height: 1.2;
  word-break: break-all;
}

.swatch-label--dark {
  color: var(--text-inverse);
}

/* === Typography === */
.type-compare {
  background: var(--bg-surface);
  border: var(--border-thin) solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-6);
  text-align: center;
}

.type-display {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  color: var(--accent-gold);
  margin: 0 0 var(--space-1);
}

.type-body {
  font-family: var(--font-body);
  font-size: var(--text-3xl);
  color: var(--text-primary);
  margin: 0 0 var(--space-1);
}

.type-label {
  display: block;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin-bottom: var(--space-4);
}

.type-scale {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.type-row {
  display: flex;
  align-items: baseline;
  gap: var(--space-4);
  padding: var(--space-2) 0;
  border-bottom: var(--border-thin) solid var(--border-light);
}

.type-token {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  min-width: 100px;
}

.type-size {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-secondary);
  min-width: 40px;
}

.type-sample {
  font-family: var(--font-body);
  color: var(--text-primary);
  line-height: var(--leading-tight);
}
</style>
