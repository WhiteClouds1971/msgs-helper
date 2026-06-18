# UI 主题设计 — 面杀辅助工具

**日期**：2026-06-18 | **状态**：已确认 | **会话**：`2026-06-18-ui-theme-design`

## 需求画像

| 维度 | 决策 |
|------|------|
| 视觉基调 | 雅致国风（水墨留白、克制优雅的东方美学） |
| 色彩模式 | 跟随系统 + 手动切换（Light + Dark 双色板） |
| 目标设备 | 手机为主，竖屏优先，触控友好 |
| 审美参考 | 三国杀十周年版（暗色基底、金饰点缀、传统纹样） |
| 字体策略 | 系统字体正文 + 书法 webfont 标题（Ma Shan Zheng） |

## 方案选型

选择 **A（墨韵金章）+ C（暗夜谋局）融合**：

- 以 C 的暗色策略游戏功能性结构为基础
- 注入 A 的水墨克制感、留白美学和金色细节点缀
- Light/Dark 在统一 Design Token 体系下覆盖

## 设计纲要

### 色板

| Token | Light（宣纸） | Dark（松烟墨） | 用途 |
|-------|-------------|---------------|------|
| `--bg` | `#faf6f0` | `#1a1a1f` | 页面底色 |
| `--bg-surface` | `#ffffff` | `#25252b` | 卡片/面板 |
| `--text-primary` | `#2c2c2c` | `#e8e0d5` | 主文字 |
| `--text-secondary` | `#78716c` | `#a0988c` | 次文字 |
| `--border` | `#e7e0d5` | `#333338` | 分割线/边框 |
| `--accent-gold` | `#b8860b` | `#d4a843` | 主色调（金） |
| `--accent-red` | `#c44536` | `#e0554a` | 强调色（朱砂红） |
| `--accent-green` | `#5b8c5a` | `#6b9b6a` | 成功/正向 |

### 字体

- **标题/武将名**：`Ma Shan Zheng`（Google Fonts，书法体）
- **正文**：`-apple-system, PingFang SC, Noto Sans SC, sans-serif`
- **数字/英文**：跟随系统（San Francisco / Inter）

### 间距 & 圆角

- 基础单位：`4px`
- 间距阶梯：`4 / 8 / 12 / 16 / 24 / 32 / 48`
- 圆角：`4px`（标签/徽章）`8px`（卡片）`12px`（面板/弹窗）

### 签名元素

1. **水墨晕染 hover** — 悬浮时金色描边 + 暖光扩散 4-8px
2. **章节装饰线** — 2px 渐变金色横线作为内容分隔
3. **卡牌质感** — 1px 金色描边 + 极淡径向渐变模拟光感

### 动效

- 页面切换：淡入 + 微上移（300ms ease-out）
- 卡牌选中：scale 1.02 + 金色辉光（200ms）
- 全程 `@media (prefers-reduced-motion: reduce)` 退化
- **克制原则**：只选 2-3 个 key moment，不对所有组件加动画

## 产出物目标

| 文件 | 内容 |
|------|------|
| `design-tokens.css` | CSS 自定义属性（颜色/字体/间距/圆角/阴影） |
| `DESIGN_SYSTEM.md` | 设计理念 + Token 使用规则 + 组件规范 |
| `animation-specs.md` | 动效精确参数 |

## 约束

- Vue 3 项目，Design Token 放 `src/assets/css/design-tokens.css`，`main.js` 最顶部导入
- 不使用任何 UI 组件库（Vant/shadcn 等），原生 CSS + Vue 组件
- 移动端优先，最大宽度 `480px`，大于此宽度居中显示
