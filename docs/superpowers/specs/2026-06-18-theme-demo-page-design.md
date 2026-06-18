# Theme Demo Page — 设计文档

**日期**：2026-06-18 | **状态**：已确认

## 概述

在 `src/pages/demo/` 下创建 `Demo.vue`，一个单文件 SFC 主题展示页面，用于直观呈现"墨韵金章 × 暗夜谋局"设计系统的所有效果。

## 目标

- 设计师/开发者可在一个页面看到所有 design token 和组件的实际渲染效果
- 支持 Light/Dark 实时切换对比
- 手动触发 3 个 key moment 动效

## 涉及文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/pages/demo/Demo.vue` | 新建 | 主题展示页面（单文件，~350 行） |
| `src/pages/index.js` | 编辑 | 添加 demo 路由导出 |
| `src/router/routes.js` | 不变 | 已通过 `...index` 自动导入 |

## 页面结构（7 个区块，单页纵滚）

### 1. Header — 标题 + 主题切换

- `h1` 使用 `var(--font-display)` 书法体显示"墨韵金章"
- 主题切换按钮组：☀️ Light / 🌙 Dark / 🔄 System 三选一
- 背景使用 `var(--bg)`，下方金色装饰线分隔

### 2. Color Palette — 色板矩阵

按语义分组展示色块，每组一行：

- **背景色**：`--bg` / `--bg-surface` / `--bg-surface-hover` / `--bg-overlay`
- **文字色**：`--text-primary` / `--text-secondary` / `--text-tertiary` / `--text-inverse`
- **金色系**：`--accent-gold` / `--accent-gold-dark` / `--accent-gold-light` / `--accent-gold-bg`
- **红色系**：`--accent-red` / `--accent-red-light` / `--accent-red-bg`
- **绿色系**：`--accent-green` / `--accent-green-light` / `--accent-green-bg`
- **边框**：`--border` / `--border-light`

每个色块：背景色 = `var(--token)`，下方标注 token 名称。文字色和浅底色块使用 `var(--text-inverse)` 或 `var(--text-primary)` 作为标注文字色以确保可读性。

### 3. Typography — 字体系统

- **字体族对比**：两句相同文字，分别用 `var(--font-display)` 和 `var(--font-body)` 渲染
- **字号阶梯**：`--text-xs` 到 `--text-4xl` 共 8 级，依次排布，每行标注 token 名 + rem 值
- **字重展示**（可选）：Light → Bold 四个字重在 body 字体下对比

### 4. Spacing & Shadows — 间距与阴影

- **间距**：横条图示 4px → 48px 间距 scale（每个 token 一个色块条）
- **阴影**：一排白色卡片分别应用 `--shadow-sm` / `--shadow-md` / `--shadow-lg` / `--shadow-xl` / `--shadow-glow-gold` / `--shadow-glow-red`

### 5. Components — 组件状态矩阵

- **卡片**：默认 / 金色描边(.card--accent) / 选中态(.card--selected)，每个展示标题+描述文字
- **按钮**：Primary（默认/hover/active/disabled） + Ghost（默认/hover/active）
- **徽章**：金色(.badge--gold) / 红色(.badge--red)，展示文字"身份标记"

### 6. Signature Effects — 签名效果

5 个 utility class 的独立演示：

- `.texture-rice-paper` — 一个卡片叠加宣纸纹理
- `.border-ink` — 一个卡片带墨洇边框效果
- `.seal-stamp` + `.seal-stamp--gold` — "主公"朱砂印 + "天子"金色印
- `.decorative-line--knotted` — 带编绳节点的金色装饰线
- `.ink-wash-hover` — 可悬浮卡片，hover 时金色辉光扩散

### 7. Animation Triggers — 动效触发

- **卡牌选中动画**：一个卡片 + 按钮"Toggle 选中"，点击切换 `.is-selected` class
- **装饰线入场**：按钮"绘制装饰线"，点击触发 `line-draw` 动画（500ms 墨水绘制）

## 技术实现

### 主题切换逻辑

```js
function setTheme(mode) {
  if (mode === 'system') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', mode)
  }
  localStorage.setItem('theme-preference', mode)
}
```

初始化时从 localStorage 读取偏好。

### 动效

- 卡牌选中：复用 `ANIMATION_SPECS.md` Key Moment 2 的规则 — `transform: scale(1.02)` + `box-shadow: var(--shadow-glow-gold)` + `border-color: var(--accent-gold)`，200ms `var(--ease-enter)`，显式属性列表，不写 `transition: all`
- 装饰线：复用 Key Moment 3 — `@keyframes line-draw`，`scaleX(0→1)` + `opacity(0→1)`，500ms `cubic-bezier(0.25, 0.1, 0.1, 1)`，按钮添加 `.is-revealed` class 触发
- `prefers-reduced-motion` 退化：duration 归零，transition 为 none

### 设计规范遵守

- 所有颜色使用 `var(--token)`，零硬编码
- 移动端优先 `max-width: var(--max-width)` (480px)，居中
- 触控最小 44px（按钮 + 色块）
- 过渡仅 `transform` + `opacity`，显式属性列表
- 正文用 `var(--font-body)`，标题用 `var(--font-display)`

## 路由

```js
// src/pages/index.js 新增
{
  name: 'Demo',
  path: '/demo',
  component: () => import('@/pages/demo/Demo.vue'),
  meta: { title: '主题展示' },
}
```

## 不考虑

- 不需要子组件拆分（单文件足够）
- 不需要路由守卫（demo 页生产环境也可访问，便于线上验收）
- 不引入第三方库
- 不需要响应式桌面布局（移动端优先，桌面自然居中）
