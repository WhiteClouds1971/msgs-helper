# 动效精确参数表 — 面杀辅助工具

**版本**：1.0 | **日期**：2026-06-18 | **方案**：墨韵金章 x 暗夜谋局

## 克制原则

只对以下 3 个 key moment 设计动效。不对按钮、输入框、列表项、徽章等高频交互元素添加动画 —— 它们使用 instant state change。

---

## Key Moment 1: 页面/路由切换

**决策框架**：

| 问题 | 答案 |
|------|------|
| 频率 | Occasional（每局游戏数次） |
| 目的 | Continuity — 保持空间上下文，告知"已进入新区块" |
| 缓动 | `var(--ease-enter)` — 标准 enter 曲线，陡峭起始 + 柔和沉降 |
| 速度 | Enter 300ms / Leave 200ms — 非对称时序，入场稍慢建立感知，离场快速不拖沓 |

**精确参数**：

| 属性 | Enter | Leave |
|------|-------|-------|
| `opacity` | 0 → 1 | 1 → 0 |
| `transform` | `translateY(8px)` → `translateY(0)` | 不变（仅淡出） |
| `duration` | 300ms | 200ms |
| `easing` | `var(--ease-enter)` | `var(--ease-enter)` |
| `transform-origin` | N/A | N/A |

**Vue Router 实现**（`App.vue` 中使用 `<Transition>`）：

```css
/* Enter: 淡入 + 微上移 8px */
.page-enter-active {
  transition:
    opacity 300ms var(--ease-enter),
    transform 300ms var(--ease-enter);
}
.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

/* Leave: 快速淡出 */
.page-leave-active {
  transition: opacity 200ms var(--ease-enter);
  position: absolute;  /* 避免布局抖动 */
  inset: 0;
}
.page-leave-to {
  opacity: 0;
}
```

```html
<!-- App.vue -->
<template>
  <router-view v-slot="{ Component, route }">
    <transition
      name="page"
      mode="out-in"
    >
      <component :is="Component" :key="route.path" />
    </transition>
  </router-view>
</template>
```

**退化方案**（`prefers-reduced-motion: reduce`）：

```css
@media (prefers-reduced-motion: reduce) {
  .page-enter-active,
  .page-leave-active {
    transition: none;
  }
}
```

效果：页面瞬间切换，无动画。

---

## Key Moment 2: 卡牌选中（核心交互）

**决策框架**：

| 问题 | 答案 |
|------|------|
| 频率 | 每局数十次（核心操作） |
| 目的 | Feedback — 确认用户的选择操作，视觉区分选中/未选中态 |
| 缓动 | `cubic-bezier(0.22, 1, 0.36, 1)` — 同 enter 曲线，前端加载让反馈即时 |
| 速度 | 200ms — 快速但不突兀 |

**精确参数**：

| 属性 | 未选中 → 选中 | 选中 → 未选中 |
|------|--------------|--------------|
| `transform` | `scale(1)` → `scale(1.02)` | `scale(1.02)` → `scale(1)` |
| `box-shadow` | 默认 → `var(--shadow-glow-gold)` | `var(--shadow-glow-gold)` → 默认 |
| `border-color` | 默认 → `var(--accent-gold)` | `var(--accent-gold)` → 默认 |
| `duration` | 200ms | 200ms |
| `easing` | `var(--ease-enter)` | `var(--ease-enter)` |

**CSS 实现**：

```css
.card {
  /* 基准态过渡定义 */
  transition:
    transform 200ms var(--ease-enter),
    box-shadow 200ms var(--ease-enter),
    border-color 200ms var(--ease-enter);
  transform: scale(1);
  will-change: transform;  /* 仅在过渡期间提升为合成层 */
}

.card.is-selected {
  transform: scale(1.02);
  box-shadow: var(--shadow-glow-gold);
  border-color: var(--accent-gold);
}
```

**性能说明**：
- `transform` + `box-shadow` + `border-color` 均在 compositor 层面，不触发 layout
- `box-shadow` 在移动端 GPU 合成良好（仅 5-10 张卡片同时存在）
- 若需极致性能，可将辉光改为 `::after` 伪元素 + `opacity` 过渡（见附录 A）

**退化方案**：

```css
@media (prefers-reduced-motion: reduce) {
  .card {
    transition: none;
  }
}
```

效果：选中态瞬间切换（scale 和 glow 即刻生效），无过渡动画。

---

## Key Moment 3: 装饰线入场（水墨绘制）

**决策框架**：

| 问题 | 答案 |
|------|------|
| 频率 | Rare（每章节一次，首次可见时触发） |
| 目的 | Delight — 为章节分隔注入个性，模拟毛笔在纸上绘制金线的过程 |
| 缓动 | `cubic-bezier(0.25, 0.1, 0.1, 1)` — 水墨扩散曲线，慢起缓收，模拟墨洇 |
| 速度 | 500ms — 装饰性元素可略长，赋予仪式感 |

**精确参数**：

| 属性 | 隐藏 → 显示 |
|------|------------|
| `transform` | `scaleX(0)` → `scaleX(1)` |
| `opacity` | `0` → `1` |
| `duration` | 500ms |
| `easing` | `cubic-bezier(0.25, 0.1, 0.1, 1)` |
| `transform-origin` | `center`（从中点向两端展开） |

**CSS 实现**：

```css
.decorative-line {
  height: var(--border-medium);
  background: var(--decorative-line);
  border: none;
  transform-origin: center;
  /* 默认不可见，等待触发 */
}

/* 当元素进入视口时，通过 JS 添加此 class */
.decorative-line.is-revealed {
  animation: line-draw 500ms cubic-bezier(0.25, 0.1, 0.1, 1) both;
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
```

**触发方式**（推荐 IntersectionObserver）：

```js
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-revealed')
      observer.unobserve(entry.target) // 仅播放一次
    }
  })
}, { threshold: 0.3 })

document.querySelectorAll('.decorative-line').forEach(el => observer.observe(el))
```

**退化方案**：

```css
@media (prefers-reduced-motion: reduce) {
  .decorative-line.is-revealed {
    animation: none;
    transform: scaleX(1);
    opacity: 1;
  }
}
```

效果：装饰线静态显示（无绘制动画），视觉上仍是金色渐变线。

---

## 汇总表

| Key Moment | 属性 | Duration | Easing | 退化行为 |
|------------|------|----------|--------|---------|
| 页面切换 (enter) | opacity + translateY(8px→0) | 300ms | `var(--ease-enter)` | instant |
| 页面切换 (leave) | opacity (1→0) | 200ms | `var(--ease-enter)` | instant |
| 卡牌选中 | scale(1→1.02) + glow | 200ms | `var(--ease-enter)` | instant |
| 装饰线入场 | scaleX(0→1) + opacity | 500ms | `cubic-bezier(0.25, 0.1, 0.1, 1)` | static show |

## 不添加动画的元素（显式排除）

以下元素使用 instant state change，**不加任何 transition/animation**：

- 按钮 hover/press（使用 `:active` 瞬间状态，无过渡）
- 输入框 focus
- 徽章/标签
- 列表项 hover
- 数字变化
- 通知/Toast（可加 150ms 淡入淡出，但非 key moment）

理由：游戏工具 UI 追求响应速度，动画过多会让操作感变"粘滞"。克制动效强化工具的专业感。

---

## 附录 A：卡牌辉光性能优化方案（可选）

如果需要极度性能优化（如 50+ 张卡牌同时存在），将 `box-shadow` 过渡替换为伪元素 `opacity` 过渡：

```css
.card {
  position: relative;
  transition: transform 200ms var(--ease-enter);
}

.card::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: inherit;
  box-shadow: var(--shadow-glow-gold);
  opacity: 0;
  transition: opacity 200ms var(--ease-enter);
  pointer-events: none;
  z-index: -1;
}

.card.is-selected {
  transform: scale(1.02);
  border-color: var(--accent-gold);
}

.card.is-selected::after {
  opacity: 1;
}
```

优势：仅动画 `transform` + `opacity`（零 layout/paint），辉光本身不参与过渡。

## 附录 B：曲线可视化参考

| 曲线名称 | 贝塞尔值 | 特征 |
|---------|---------|------|
| Enter (标准) | `cubic-bezier(0.22, 1, 0.36, 1)` | 陡峭起始覆盖大部分距离，末端柔和沉降 |
| Ink Spread | `cubic-bezier(0.25, 0.1, 0.1, 1)` | 慢启动（墨洇开），中段加速，长尾缓收 |
| Ease-out (Token) | `cubic-bezier(0.16, 1, 0.3, 1)` | 极陡起始（爆炸式），强烈减速，用于微交互 |

在线调试：[easings.co](https://easings.co/) | [cubic-bezier.com](https://cubic-bezier.com/)
