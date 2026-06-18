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
</style>
