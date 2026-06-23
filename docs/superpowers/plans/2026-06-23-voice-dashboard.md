# Voice 仪表盘 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 Console 底部新增 Voice Zone，渲染纯外观语音仪表盘（横向单行）。

**Architecture:** 沿用现有 Console 数据驱动模式 — `consoleItems.js` 注册条目 → `Index.vue` 网格渲染。VoiceDashboard.vue 为纯展示组件，使用设计 token 和 SVG 图标。

**Tech Stack:** Vue 3 + Pinia 3 + Less + Vite

## Global Constraints

- 全 `var(--token)` 引用设计 token，禁止硬编码颜色
- SVG 图标使用 `?raw` 导入 + `v-html` 渲染
- 组件放在 `src/components/Console/components/` 下
- 图标放在 `src/assets/icons/` 下
- 提交信息格式：`feat: <描述>`

---

### Task 1: 创建 SVG 图标文件

**Files:**
- Create: `src/assets/icons/voice-on.svg`
- Create: `src/assets/icons/voice-off.svg`
- Create: `src/assets/icons/play.svg`
- Create: `src/assets/icons/pause.svg`
- Create: `src/assets/icons/shuffle.svg`
- Create: `src/assets/icons/repeat-single.svg`
- Create: `src/assets/icons/repeat-all.svg`

**Produces:** 7 个可被 `?raw` 导入的 SVG 图标资源。

- [ ] **Step 1: 创建 voice-on.svg**

```svg
<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M257.493333 322.4l215.573334-133.056c24.981333-15.413333 57.877333-7.914667 73.493333 16.746667 5.301333 8.373333 8.106667 18.048 8.106667 27.914666v555.989334C554.666667 819.093333 530.784 842.666667 501.333333 842.666667c-9.994667 0-19.786667-2.773333-28.266666-8L257.493333 701.6H160c-41.237333 0-74.666667-33.013333-74.666667-73.738667V396.138667c0-40.725333 33.429333-73.738667 74.666667-73.738667h97.493333z m26.133334 58.4a32.298667 32.298667 0 0 1-16.96 4.8H160c-5.888 0-10.666667 4.714667-10.666667 10.538667v231.733333c0 5.813333 4.778667 10.538667 10.666667 10.538667h106.666667c5.994667 0 11.872 1.664 16.96 4.8L490.666667 770.986667V253.013333L283.626667 380.8zM800.906667 829.653333a32.288 32.288 0 0 1-45.248-0.757333 31.317333 31.317333 0 0 1 0.768-44.693333c157.653333-150.464 157.653333-393.962667 0-544.426667a31.317333 31.317333 0 0 1-0.768-44.682667 32.288 32.288 0 0 1 45.248-0.757333c183.68 175.306667 183.68 460.010667 0 635.317333z m-106.901334-126.186666a32.288 32.288 0 0 1-45.248-1.216 31.328 31.328 0 0 1 1.237334-44.672c86.229333-80.608 86.229333-210.56 0-291.178667a31.328 31.328 0 0 1-1.237334-44.672 32.288 32.288 0 0 1 45.248-1.216c112.885333 105.546667 112.885333 277.418667 0 382.965333z" fill="currentColor"/></svg>
```

- [ ] **Step 2: 创建 voice-off.svg**

```svg
<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M257.493333 322.4l215.573334-133.056c24.981333-15.413333 57.877333-7.914667 73.493333 16.746667 5.301333 8.373333 8.106667 18.048 8.106667 27.914666v555.989334C554.666667 819.093333 530.784 842.666667 501.333333 842.666667c-9.994667 0-19.786667-2.773333-28.266666-8L257.493333 701.6H160c-41.237333 0-74.666667-33.013333-74.666667-73.738667V396.138667c0-40.725333 33.429333-73.738667 74.666667-73.738667h97.493333z m26.133334 58.4a32.298667 32.298667 0 0 1-16.96 4.8H160c-5.888 0-10.666667 4.714667-10.666667 10.538667v231.733333c0 5.813333 4.778667 10.538667 10.666667 10.538667h106.666667c5.994667 0 11.872 1.664 16.96 4.8L490.666667 770.986667V253.013333L283.626667 380.8zM832.565333 518.4l86.474667 86.474667a30.570667 30.570667 0 1 1-43.232 43.242666L789.333333 561.653333l-86.474666 86.474667a30.570667 30.570667 0 1 1-43.232-43.242667l86.474666-86.474666-86.474666-86.474667a30.570667 30.570667 0 1 1 43.232-43.232L789.333333 475.178667l86.474667-86.474667a30.570667 30.570667 0 1 1 43.232 43.232l-86.474667 86.474667z" fill="currentColor"/></svg>
```

- [ ] **Step 3: 创建 play.svg**

```svg
<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M780.8 475.733333L285.866667 168.533333c-27.733333-17.066667-64 4.266667-64 36.266667v614.4c0 32 36.266667 53.333333 64 36.266667l492.8-307.2c29.866667-14.933333 29.866667-57.6 2.133333-72.533334z" fill="currentColor"/></svg>
```

- [ ] **Step 4: 创建 pause.svg**

```svg
<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M320 128A64 64 0 0 0 256 192v640a64 64 0 0 0 128 0v-640A64 64 0 0 0 320 128z m384 0A64 64 0 0 0 640 192v640a64 64 0 0 0 128 0v-640A64 64 0 0 0 704 128z" fill="currentColor"/></svg>
```

- [ ] **Step 5: 创建 shuffle.svg**

```svg
<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M914.2 705L796.4 596.8c-8.7-8-22.7-1.8-22.7 10V688c-69.5-1.8-134-39.7-169.3-99.8l-45.1-77 47-80.2c34.9-59.6 98.6-97.4 167.4-99.8v60.1c0 11.8 14 17.9 22.7 10l117.8-108.1c5.8-5.4 5.8-14.6 0-19.9L796.4 165c-8.7-8-22.7-1.8-22.7 10v76H758c-4.7 0-9.3 0.8-13.5 2.3-36.5 4.7-72 16.6-104.1 35-42.6 24.4-78.3 59.8-103.1 102.2L513 432l-24.3-41.5c-24.8-42.4-60.5-77.7-103.1-102.2C343 263.9 294.5 251 245.3 251H105c-22.1 0-40 17.9-40 40s17.9 40 40 40h140.3c71.4 0 138.3 38.3 174.4 99.9l47 80.2-45.1 77c-36.2 61.7-103 99.9-174.4 99.9H105c-22.1 0-40 17.9-40 40s17.9 40 40 40l142 0.1h0.2c49.1 0 97.6-12.9 140.2-37.3 42.7-24.4 78.3-59.8 103.2-102.2l22.4-38.3 22.4 38.3c24.8 42.4 60.5 77.8 103.2 102.2 33.1 18.9 69.6 30.9 107.3 35.4 3.8 1.2 7.8 1.8 11.9 1.8l15.9 0.1v55c0 11.8 14 17.9 22.7 10L914.2 725c5.9-5.5 5.9-14.7 0-20z" fill="currentColor"/></svg>
```

- [ ] **Step 6: 创建 repeat-single.svg**

```svg
<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M361.5 727.8c-119.1 0-215.9-96.9-215.9-215.9 0-119.1 96.9-215.9 215.9-215.9 2.3 0 4.6-0.2 6.8-0.6v58.3c0 12.3 14 19.4 23.9 12.1l132.6-97.6c8.1-6 8.1-18.2 0-24.2l-132.6-97.6c-9.9-7.3-23.9-0.2-23.9 12.1v58.1c-2.2-0.4-4.5-0.6-6.8-0.6-39.8 0-78.5 7.9-115 23.4-35.2 15-66.8 36.3-94 63.5s-48.6 58.8-63.5 94c-15.5 36.5-23.4 75.2-23.4 115s7.9 78.5 23.4 115c15 35.2 36.3 66.8 63.5 94s58.8 48.6 94 63.5c36.5 15.5 75.2 23.4 115 23.4 22.1 0 40-17.9 40-40s-17.9-40-40-40zM938.2 396.9c-15-35.2-36.3-66.8-63.5-94s-58.8-48.6-94-63.5c-36.5-15.5-75.2-23.4-115-23.4-22.1 0-40 17.9-40 40s17.9 40 40 40c119.1 0 215.9 96.9 215.9 215.9 0 119.1-96.9 215.9-215.9 215.9-4.1 0-8.1 0.6-11.8 1.8v-60.8c0-12.3-14-19.4-23.9-12.1l-132.6 97.6c-8.1 6-8.1 18.2 0 24.2L629.9 876c9.9 7.3 23.9 0.2 23.9-12.1V806c3.7 1.2 7.7 1.8 11.8 1.8 39.8 0 78.5-7.9 115-23.4 35.2-15 66.8-36.3 94-63.5s48.6-58.8 63.5-94c15.5-36.5 23.4-75.2 23.4-115s-7.8-78.5-23.3-115z" fill="currentColor"/><path d="M512.8 660.6c22.1-0.1 39.9-18.1 39.8-40.2l-1.2-214.1c-0.1-22-18-39.8-40-39.8h-0.2c-22.1 0.1-39.9 18.1-39.8 40.2l1.2 214.1c0.1 22 18 39.8 40 39.8h0.2z" fill="currentColor"/></svg>
```

- [ ] **Step 7: 创建 repeat-all.svg**

```svg
<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M361.5 727.8c-119.1 0-215.9-96.9-215.9-215.9 0-119.1 96.9-215.9 215.9-215.9 2.3 0 4.6-0.2 6.8-0.6v58.3c0 12.3 14 19.4 23.9 12.1l132.6-97.6c8.1-6 8.1-18.2 0-24.2l-132.6-97.6c-9.9-7.3-23.9-0.2-23.9 12.1v58.1c-2.2-0.4-4.5-0.6-6.8-0.6-39.8 0-78.5 7.9-115 23.4-35.2 15-66.8 36.3-94 63.5s-48.6 58.8-63.5 94c-15.5 36.5-23.4 75.2-23.4 115s7.9 78.5 23.4 115c15 35.2 36.3 66.8 63.5 94s58.8 48.6 94 63.5c36.5 15.5 75.2 23.4 115 23.4 22.1 0 40-17.9 40-40s-17.9-40-40-40zM938.2 396.9c-15-35.2-36.3-66.8-63.5-94s-58.8-48.6-94-63.5c-36.5-15.5-75.2-23.4-115-23.4-22.1 0-40 17.9-40 40s17.9 40 40 40c119.1 0 215.9 96.9 215.9 215.9 0 119.1-96.9 215.9-215.9 215.9-4.1 0-8.1 0.6-11.8 1.8v-60.8c0-12.3-14-19.4-23.9-12.1l-132.6 97.6c-8.1 6-8.1 18.2 0 24.2L629.9 876c9.9 7.3 23.9 0.2 23.9-12.1V806c3.7 1.2 7.7 1.8 11.8 1.8 39.8 0 78.5-7.9 115-23.4 35.2-15 66.8-36.3 94-63.5s48.6-58.8 63.5-94c15.5-36.5 23.4-75.2 23.4-115s-7.8-78.5-23.3-115z" fill="currentColor"/></svg>
```

- [ ] **Step 8: 提交图标**

```bash
git add src/assets/icons/voice-on.svg src/assets/icons/voice-off.svg \
        src/assets/icons/play.svg src/assets/icons/pause.svg \
        src/assets/icons/shuffle.svg src/assets/icons/repeat-single.svg \
        src/assets/icons/repeat-all.svg
git commit -m "feat: add voice control SVG icons"
```

---

### Task 2: 注册 Voice Zone 和 console item

**Files:**
- Modify: `src/constants/consoleItems.js`

**Produces:** `Zone.VOICE` 枚举值 + `voice-dashboard` 条目。

- [ ] **Step 1: 在 consoleItems.js 中新增 Zone.VOICE**

在 `Zone` 对象中追加 `VOICE: 'voice'`：

```js
export const Zone = Object.freeze({
  FEATURES: 'features',
  VOICE: 'voice',
})
```

- [ ] **Step 2: 追加 voice-dashboard 条目**

在 `consoleItems` 数组末尾追加：

```js
  {
    id: 'voice-dashboard',
    zone: Zone.VOICE,
    colSpan: 6,
    tip: '语音仪表',
    component: defineAsyncComponent(() => import('@/components/Console/components/VoiceDashboard.vue')),
  },
]
```

- [ ] **Step 3: 提交**

```bash
git add src/constants/consoleItems.js
git commit -m "feat: register Voice zone with voice-dashboard item"
```

---

### Task 3: Console Index.vue 追加 voice zone

**Files:**
- Modify: `src/components/Console/Index.vue`

**Produces:** Voice zone 渲染在 features zone 下方。

- [ ] **Step 1: 在 zoneCodes 数组末尾追加 'voice'**

将：
```js
const zoneCodes = ['features']
```
改为：
```js
const zoneCodes = ['features', 'voice']
```

- [ ] **Step 2: 提交**

```bash
git add src/components/Console/Index.vue
git commit -m "feat: add voice zone to console layout"
```

---

### Task 4: 创建 VoiceDashboard.vue 组件

**Files:**
- Create: `src/components/Console/components/VoiceDashboard.vue`

**Produces:** 纯外观语音仪表盘组件。

- [ ] **Step 1: 创建组件文件**

```vue
<script setup>
import voiceOnIcon from '@/assets/icons/voice-on.svg?raw'
import playIcon from '@/assets/icons/play.svg?raw'
import repeatAllIcon from '@/assets/icons/repeat-all.svg?raw'
</script>

<template>
  <div class="voice-dashboard">
    <span class="voice-dashboard__icon" v-html="voiceOnIcon" />
    <span class="voice-dashboard__label">语音仪表</span>
    <span class="voice-dashboard__spacer" />
    <button class="voice-dashboard__btn" tabindex="-1">
      <span class="voice-dashboard__btn-icon" v-html="playIcon" />
    </button>
    <span class="voice-dashboard__icon voice-dashboard__icon--mode" v-html="repeatAllIcon" />
  </div>
</template>

<style scoped lang="less">
.voice-dashboard {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  gap: var(--space-2);
  padding: 0 var(--space-1);
  user-select: none;
}

.voice-dashboard__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.3em;
  height: 1.3em;
  flex-shrink: 0;
  color: var(--text-tertiary);

  :deep(svg) {
    width: 100%;
    height: 100%;
  }
}

.voice-dashboard__label {
  font-family: var(--font-display);
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.voice-dashboard__spacer {
  flex: 1;
  min-width: 0;
}

.voice-dashboard__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2em;
  height: 2em;
  flex-shrink: 0;
  border: none;
  border-radius: 50%;
  background: var(--bg-surface-hover);
  color: var(--text-secondary);
  cursor: default;
  padding: 0;
  transition: background var(--duration-fast) var(--ease-out);
}

.voice-dashboard__btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 0.9em;
  height: 0.9em;
  margin-left: 0.15em; // 播放三角形视觉居中

  :deep(svg) {
    width: 100%;
    height: 100%;
  }
}

.voice-dashboard__icon--mode {
  width: 1.5em;
  height: 1.5em;
}
</style>
```

- [ ] **Step 2: 验证构建**

```bash
npm run dev
```

打开控制台面板，确认 Voice Zone 出现在最底部，仪表盘横向单行显示。

- [ ] **Step 3: 提交**

```bash
git add src/components/Console/components/VoiceDashboard.vue
git commit -m "feat: add VoiceDashboard static appearance component"
```
