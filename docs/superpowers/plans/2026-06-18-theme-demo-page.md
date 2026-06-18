# Theme Demo Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `src/pages/demo/Demo.vue` 创建一个单文件主题展示页面，全面呈现"墨韵金章 × 暗夜谋局"设计系统效果

**Architecture:** 单文件 Vue 3 SFC（Composition API），7 个展示区块纵向排列，主题切换通过操作 `data-theme` 属性实现，动效通过 button 手动触发 CSS class

**Tech Stack:** Vue 3 (Composition API), CSS Custom Properties, Less (scoped), Vite

## Global Constraints

- 所有颜色使用 `var(--token)`，禁止硬编码 hex 值
- 移动端优先：`max-width: var(--max-width)` (480px)，居中显示
- 过渡属性必须显式列出，禁止 `transition: all`
- 触控目标最小 44px
- 正文用 `var(--font-body)`，标题用 `var(--font-display)`
- 动效尊重 `prefers-reduced-motion: reduce`
- 动效仅 `transform` + `opacity`，不使用 `left`/`top`/`width`/`height`

---

### Task 1: 添加路由 + Demo.vue 骨架（Header + 主题切换）

**Files:**
- Modify: `src/pages/index.js`
- Create: `src/pages/demo/Demo.vue`

**Interfaces:**
- Produces: 路由 `/demo` 指向 `Demo.vue`；Demo.vue 提供 `currentTheme` ref 和 `setTheme(mode)` 方法

- [ ] **Step 1: 在 index.js 中添加 demo 路由导出**

```js
// src/pages/index.js
export default [
  {
    name: 'Home',
    path: '/',
    component: () => import('@/pages/Home.vue'),
    meta: { title: '首页' },
  },
  {
    name: 'Demo',
    path: '/demo',
    component: () => import('@/pages/demo/Demo.vue'),
    meta: { title: '主题展示' },
  },
];
```

- [ ] **Step 2: 验证路由生效**

Run: `npm run dev`，访问 `http://localhost:9456/demo`，应看到空白页面（Vue 渲染但无内容）

- [ ] **Step 3: 创建 Demo.vue — script setup（主题切换逻辑）**

```vue
<!-- src/pages/demo/Demo.vue -->
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
```

- [ ] **Step 4: 创建 Demo.vue — template（Header + 主题切换）**

```vue
<template>
  <div class="demo-page">
    <!-- ===== Header ===== -->
    <header class="demo-header">
      <h1 class="demo-title">墨韵金章</h1>
      <p class="demo-subtitle">Design System Showcase</p>
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

    <hr class="decorative-line" />
  </div>
</template>
```

- [ ] **Step 5: 添加 scoped 样式（Header 区块）**

```vue
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
```

- [ ] **Step 6: Commit**

```bash
git add src/pages/index.js src/pages/demo/Demo.vue
git commit -m "feat: add demo page route and header with theme toggle"
```

---

### Task 2: Color Palette + Typography 区块

**Files:**
- Modify: `src/pages/demo/Demo.vue`

**Interfaces:**
- Consumes: `Demo.vue` 骨架（Task 1）
- Produces: 色板矩阵 + 字体层级展示区块

- [ ] **Step 1: 添加 Color Palette 区块 template（在 `<hr class="decorative-line" />` 之后）**

```vue
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
```

- [ ] **Step 2: 添加 Color Palette script 数据**

在 `<script setup>` 中添加：

```js
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
```

- [ ] **Step 3: 添加 Typography 区块 template**

```vue
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
```

- [ ] **Step 4: 添加 Typography script 数据**

```js
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
```

- [ ] **Step 5: 添加 Color Palette + Typography 样式**

```css
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
```

- [ ] **Step 6: 验证**

Run: `npm run dev`，访问 `/demo`，检查色板和字体层级渲染正确，切换主题色板随之变化

- [ ] **Step 7: Commit**

```bash
git add src/pages/demo/Demo.vue
git commit -m "feat: add color palette and typography showcase sections"
```

---

### Task 3: Spacing & Shadows + Components 区块

**Files:**
- Modify: `src/pages/demo/Demo.vue`

**Interfaces:**
- Consumes: Task 2 的 Demo.vue
- Produces: 间距可视化 + 阴影层级 + 组件状态矩阵区块

- [ ] **Step 1: 添加 Spacing & Shadows 区块 template**

```vue
    <!-- ===== Spacing & Shadows ===== -->
    <section class="demo-section">
      <h2 class="section-title">📐 间距 & 阴影 (Spacing & Shadows)</h2>

      <!-- 间距 Scale -->
      <h3 class="subsection-title">间距阶梯 (Spacing Scale)</h3>
      <div class="spacing-scale">
        <div class="spacing-row" v-for="item in spacingScale" :key="item.token">
          <span class="spacing-token">{{ item.token }}</span>
          <span class="spacing-value">{{ item.value }}</span>
          <div class="spacing-bar" :style="{ width: `var(--${item.token})` }"></div>
        </div>
      </div>

      <!-- 阴影层级 -->
      <h3 class="subsection-title">阴影层级 (Shadows)</h3>
      <div class="shadow-grid">
        <div class="shadow-card" v-for="item in shadowTokens" :key="item.token" :style="{ boxShadow: `var(--${item.token})` }">
          <span class="shadow-label">{{ item.token }}</span>
        </div>
      </div>
    </section>
```

- [ ] **Step 2: 添加 Spacing & Shadows script 数据**

```js
const spacingScale = [
  { token: '--space-1', value: '4px' },
  { token: '--space-2', value: '8px' },
  { token: '--space-3', value: '12px' },
  { token: '--space-4', value: '16px' },
  { token: '--space-6', value: '24px' },
  { token: '--space-8', value: '32px' },
  { token: '--space-12', value: '48px' },
];

const shadowTokens = [
  { token: '--shadow-sm' },
  { token: '--shadow-md' },
  { token: '--shadow-lg' },
  { token: '--shadow-xl' },
  { token: '--shadow-glow-gold' },
  { token: '--shadow-glow-red' },
];
```

- [ ] **Step 3: 添加 Components 区块 template**

```vue
    <!-- ===== Components ===== -->
    <section class="demo-section">
      <h2 class="section-title">🧩 组件 (Components)</h2>

      <!-- 卡片 -->
      <h3 class="subsection-title">卡片 (Cards)</h3>
      <div class="component-row">
        <div class="card-demo">
          <h4>默认卡片</h4>
          <p>竹简意象，纵向堆叠</p>
        </div>
        <div class="card-demo card-demo--accent">
          <h4>金色描边</h4>
          <p>漆器光感渐变底</p>
        </div>
        <div :class="['card-demo', 'card-demo--clickable', { 'is-selected': cardSelected }]" @click="cardSelected = !cardSelected">
          <h4>可选中（点击切换）</h4>
          <p>{{ cardSelected ? '✨ 已选中' : '点击选中' }}</p>
        </div>
      </div>

      <!-- 按钮 -->
      <h3 class="subsection-title">按钮 (Buttons)</h3>
      <div class="btn-matrix">
        <div class="btn-col">
          <span class="btn-col-label">Primary</span>
          <button class="btn-demo btn-demo--primary">默认</button>
          <button class="btn-demo btn-demo--primary" disabled>禁用</button>
        </div>
        <div class="btn-col">
          <span class="btn-col-label">Ghost</span>
          <button class="btn-demo btn-demo--ghost">默认</button>
          <button class="btn-demo btn-demo--ghost" disabled>禁用</button>
        </div>
      </div>

      <!-- 徽章 -->
      <h3 class="subsection-title">徽章 (Badges)</h3>
      <div class="badge-row">
        <span class="badge-demo badge-demo--gold">金色标记</span>
        <span class="badge-demo badge-demo--red">朱砂警示</span>
        <span class="badge-demo badge-demo--green">铜绿通过</span>
      </div>
    </section>
```

- [ ] **Step 4: 添加 Components script 数据**

```js
const cardSelected = ref(false);
```

- [ ] **Step 5: 添加 Spacing & Shadows + Components 样式**

```css
/* === Spacing Scale === */
.spacing-scale {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.spacing-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.spacing-token {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  min-width: 90px;
}

.spacing-value {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-secondary);
  min-width: 36px;
}

.spacing-bar {
  height: 12px;
  background: var(--accent-gold);
  border-radius: var(--radius-sm);
  opacity: 0.6;
  min-width: 0;
}

/* === Shadows === */
.shadow-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
}

.shadow-card {
  width: 120px;
  height: 80px;
  background: var(--bg-surface);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2);
  text-align: center;
}

.shadow-label {
  font-family: var(--font-mono);
  font-size: 8px;
  color: var(--text-secondary);
}

/* === Components === */
.component-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/* Card Demo */
.card-demo {
  background: var(--bg-surface);
  border: var(--border-thin) solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
  transition: transform var(--duration-normal) var(--ease-enter),
              box-shadow var(--duration-normal) var(--ease-enter),
              border-color var(--duration-fast) var(--ease-out);
}

.card-demo h4 {
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-1);
}

.card-demo p {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
}

.card-demo--accent {
  border-color: var(--accent-gold);
  background:
    var(--card-lacquer-gradient),
    var(--bg-surface);
}

.card-demo--clickable {
  cursor: pointer;
  user-select: none;
  min-height: 44px;
}

.card-demo--clickable.is-selected {
  border-color: var(--accent-gold);
  box-shadow: var(--shadow-glow-gold);
  transform: scale(1.02);
}

/* Button Demo */
.btn-matrix {
  display: flex;
  gap: var(--space-6);
}

.btn-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  align-items: flex-start;
}

.btn-col-label {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-1);
}

.btn-demo {
  padding: var(--space-2) var(--space-4);
  border: none;
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  min-height: 44px;
  transition: transform var(--duration-fast) var(--ease-out),
              box-shadow var(--duration-fast) var(--ease-out),
              background-color var(--duration-fast) var(--ease-out);
}

.btn-demo:active:not(:disabled) {
  transform: scale(0.97);
}

.btn-demo:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-demo--primary {
  background: var(--accent-gold-dark);
  color: var(--text-inverse);
}

.btn-demo--primary:active:not(:disabled) {
  box-shadow: var(--shadow-glow-gold);
}

.btn-demo--ghost {
  background: transparent;
  color: var(--accent-gold);
  border: var(--border-thin) solid var(--accent-gold);
}

.btn-demo--ghost:active:not(:disabled) {
  background: var(--accent-gold-bg);
}

/* Badge Demo */
.badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.badge-demo {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  border-radius: var(--radius-sm);
  line-height: 1.4;
}

.badge-demo--gold {
  color: var(--accent-gold);
  background: var(--accent-gold-bg);
}

.badge-demo--red {
  color: var(--accent-red);
  background: var(--accent-red-bg);
}

.badge-demo--green {
  color: var(--accent-green);
  background: var(--accent-green-bg);
}

/* reduced-motion 退化 */
@media (prefers-reduced-motion: reduce) {
  .card-demo,
  .card-demo--clickable,
  .btn-demo {
    transition: none;
  }
}
```

- [ ] **Step 6: 验证**

Run: `npm run dev`，访问 `/demo`，检查间距横条/阴影卡片/组件渲染正确，卡牌点击切换选中态有动画

- [ ] **Step 7: Commit**

```bash
git add src/pages/demo/Demo.vue
git commit -m "feat: add spacing, shadows, and components showcase sections"
```

---

### Task 4: Signature Effects + Animation Triggers 区块

**Files:**
- Modify: `src/pages/demo/Demo.vue`

**Interfaces:**
- Consumes: Task 3 的 Demo.vue
- Produces: 5 个签名效果演示 + 2 个动效触发按钮

- [ ] **Step 1: 添加 Signature Effects 区块 template**

```vue
    <!-- ===== Signature Effects ===== -->
    <section class="demo-section">
      <h2 class="section-title">✨ 签名效果 (Signature Effects)</h2>

      <!-- 宣纸纹理 -->
      <h3 class="subsection-title">宣纸纹理 .texture-rice-paper</h3>
      <div class="card-demo texture-rice-paper effect-card--tall">
        <h4>宣纸肌理面板</h4>
        <p>SVG 噪点叠加，模拟纸纤维</p>
      </div>

      <!-- 墨洇边框 -->
      <h3 class="subsection-title">墨洇边框 .border-ink</h3>
      <div class="card-demo border-ink">
        <h4>手札笔记</h4>
        <p>墨色渗透毛边投影</p>
      </div>

      <!-- 印章 -->
      <h3 class="subsection-title">印章 .seal-stamp</h3>
      <div class="effect-row">
        <span class="seal-stamp">主公</span>
        <span class="seal-stamp seal-stamp--gold">天子</span>
      </div>

      <!-- 编绳节点 -->
      <h3 class="subsection-title">编绳节点 .decorative-line--knotted</h3>
      <hr class="decorative-line decorative-line--knotted" />

      <!-- 水墨晕染 -->
      <h3 class="subsection-title">水墨晕染 .ink-wash-hover</h3>
      <div class="card-demo ink-wash-hover effect-card--tall">
        <h4>悬浮此卡片</h4>
        <p>金色辉光从中心扩散</p>
      </div>
    </section>
```

- [ ] **Step 2: 添加 Animation Triggers 区块 template**

```vue
    <!-- ===== Animation Triggers ===== -->
    <section class="demo-section">
      <h2 class="section-title">🎬 动效触发 (Animations)</h2>

      <!-- 卡牌选中 -->
      <h3 class="subsection-title">卡牌选中 (Card Selection) — 200ms</h3>
      <div :class="['card-demo', 'card-demo--accent', 'anim-card', { 'is-selected': animCardSelected }]">
        <h4>动效演示卡牌</h4>
        <p>{{ animCardSelected ? '✨ 选中态 — scale(1.02) + 金色辉光' : '未选中 — 点击按钮切换' }}</p>
      </div>
      <button class="anim-trigger-btn" @click="animCardSelected = !animCardSelected">
        {{ animCardSelected ? '取消选中' : '选中卡牌' }}
      </button>

      <!-- 装饰线入场 -->
      <h3 class="subsection-title">装饰线入场 (Line Draw) — 500ms</h3>
      <hr :class="['decorative-line', 'anim-line', { 'is-revealed': lineRevealed }]" />
      <button class="anim-trigger-btn" @click="triggerLineDraw">
        {{ lineRevealed ? '重置并重播' : '绘制装饰线' }}
      </button>
    </section>
```

- [ ] **Step 3: 添加 Animation Triggers script**

```js
const animCardSelected = ref(false);
const lineRevealed = ref(false);

function triggerLineDraw() {
  lineRevealed.value = false;
  // 用 nextTick 确保 class 移除后再添加，触发动画重播
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      lineRevealed.value = true;
    });
  });
}
```

- [ ] **Step 4: 添加 Signature Effects + Animation Triggers 样式**

```css
/* === Signature Effects === */
.effect-card--tall {
  min-height: 80px;
}

.effect-row {
  display: flex;
  gap: var(--space-4);
  align-items: center;
}

/* === Animation Triggers === */
.anim-card {
  margin-bottom: var(--space-3);
}

.anim-trigger-btn {
  padding: var(--space-2) var(--space-4);
  background: var(--accent-gold-dark);
  color: var(--text-inverse);
  border: none;
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  min-height: 44px;
  transition: transform var(--duration-fast) var(--ease-out),
              box-shadow var(--duration-fast) var(--ease-out);
}

.anim-trigger-btn:active {
  transform: scale(0.97);
  box-shadow: var(--shadow-glow-gold);
}

/* Decorative Line Animation */
.decorative-line {
  height: var(--border-medium);
  background: var(--decorative-line);
  border: none;
  margin: var(--space-6) 0;
  transform-origin: center;
}

.anim-line {
  opacity: 0;
  transform: scaleX(0);
}

.anim-line.is-revealed {
  animation: line-draw 500ms cubic-bezier(0.25, 0.1, 0.1, 1) forwards;
}

@keyframes line-draw {
  from {
    transform: scaleX(0);
    opacity: 0;
  }
  to {
    transform: scaleX(1);
    opacity: 1;
  }
}

/* reduced-motion 退化 */
@media (prefers-reduced-motion: reduce) {
  .anim-line.is-revealed {
    animation: none;
    transform: scaleX(1);
    opacity: 1;
  }
}
```

- [ ] **Step 5: 验证**

Run: `npm run dev`，访问 `/demo`：
- 所有签名效果正确渲染（宣纸纹理噪点、墨洇边框双环、印章双线+微旋转、编绳节点菱形、水墨晕染 hover 辉光）
- 卡牌选中按钮触发动画（scale+glow transition）
- 装饰线按钮触发绘制动画（从中心向两端展开）
- Light/Dark 切换所有区块跟随变化

- [ ] **Step 6: Commit**

```bash
git add src/pages/demo/Demo.vue
git commit -m "feat: add signature effects and animation triggers sections"
```

---

### Task 5: 最终验证 + 收尾

**Files:**
- 无修改（仅验证）

- [ ] **Step 1: 运行 lint 检查**

```bash
npm run lint
```

Expected: 无 error

- [ ] **Step 2: 运行构建验证**

```bash
npm run build
```

Expected: 构建成功，无 warning

- [ ] **Step 3: 启动 dev server 完整走查**

Run: `npm run dev`，访问 `http://localhost:9456/demo`

检查清单：
- [ ] 页面 7 个区块完整渲染
- [ ] Light/Dark/System 三种主题切换正常，刷新后保持
- [ ] 所有色板 token 名称和颜色正确对应
- [ ] 书法体和正文字体均正常加载
- [ ] 字号阶梯从 xs 到 4xl 依次增大
- [ ] 间距横条宽度递增
- [ ] 阴影卡片各有层次
- [ ] 组件状态矩阵完整（卡片默认/金边/选中，按钮 primary/ghost 默认/禁用，徽章三色）
- [ ] 签名效果：宣纸纹理可视（极淡噪点）、墨洇边框双环可见、印章双线+微旋转、编绳节点菱形、水墨晕染 hover 发光
- [ ] 卡牌选中动画：点击按钮可见 scale + glow 过渡
- [ ] 装饰线动画：点击按钮可从中心展开金线
- [ ] 移动端竖屏：max-width 480px 居中，无横向溢出
- [ ] 所有颜色通过 `var(--token)` 引用，无硬编码
- [ ] 所有触控元素 ≥ 44px

- [ ] **Step 4: 提交最终变更（如有 lint/build 修复）**

```bash
git add -A
git commit -m "chore: final verification and cleanup for demo page"
```
