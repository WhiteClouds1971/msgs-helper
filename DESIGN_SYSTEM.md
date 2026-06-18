# Design System — 面杀辅助工具

**版本**：1.0 | **日期**：2026-06-18 | **方案**：墨韵金章 x 暗夜谋局

---

## 1. 设计理念

### 扎根来源：三国物质文化

本设计系统的视觉语言从三国时期（公元220-280年）的真实物质载体中提取，而非从同类产品惯例或 UI 趋势中借鉴：

| 物质载体 | 视觉特征 | UI 翻译 |
|----------|---------|---------|
| **宣纸** (Rice Paper) | 暖白 `#faf6f0`、纤维肌理、吸墨 | Light 模式背景色；表面留白充足 |
| **松烟墨** (Pine Soot) | 暖黑 `#1a1a1f`（非纯黑）、棕底 | Dark 模式背景；暖色系暗底 |
| **朱砂** (Vermillion) | 印章红 `#c44536`（有灰度，非荧光） | 强调色、危险状态、关键标记 |
| **古铜金** (Bronze Gold) | 鎏金 `#b8860b`、漆器金粉 | 主色调、选中态、装饰线 |
| **竹简** (Bamboo Slips) | 纵向窄条、绳编串联、竖排 | 卡片视为独立"简"；金色装饰线如编绳 |
| **漆器** (Lacquerware) | 黑底朱纹、光泽表面 | 卡牌表面径向渐变模拟光感 |
| **印章** (Seals) | 方形朱红印记 | 徽章、标签、身份标识 |
| **青铜锈** (Bronze Patina) | 铜绿 `#5b8c5a` | 成功/正向状态色 |

### 设计原则

1. **克制留白** — 水墨画的核心审美：大面积留白，重点元素用金/朱砂点缀
2. **材质感** — 通过阴影、渐变、描边模拟实物（纸、墨、漆、金）的质感
3. **移动优先** — 手机竖屏为主要使用场景，最大宽度 480px，触摸友好
4. **暗色非纯黑** — Dark 模式底色为暖黑 `#1a1a1f`（松烟墨），避免 `#000` 的冷硬感
5. **一个签名就够了** — 动效只用于 2-3 个 key moment，不对所有组件加动画

---

## 2. Token 使用规则

### 2.1 颜色 (Color Tokens)

所有颜色必须通过 CSS 自定义属性引用，禁止硬编码 hex 值。

```
正确:  color: var(--text-primary);
错误:  color: #2c2c2c;
```

**语义命名原则**：Token 按用途命名（如 `--text-primary`），而非按色值命名（如 `--color-gray-900`）。这确保了 Light/Dark 切换时无需改动组件代码。

**色彩层级**：

| 层级 | Token | 用途 |
|------|-------|------|
| 背景 | `--bg` | 页面底色（宣纸/松烟墨） |
| 表面 | `--bg-surface` | 卡片、面板、弹窗 |
| 悬浮 | `--bg-surface-hover` | 列表项/卡片 hover |
| 遮罩 | `--bg-overlay` | Modal 遮罩层 |
| 主文字 | `--text-primary` | 标题、正文 |
| 次文字 | `--text-secondary` | 描述、辅助信息 |
| 弱文字 | `--text-tertiary` | 水印、placeholder |
| 反白 | `--text-inverse` | 深色底上的文字 |
| 边框 | `--border` | 卡片边框、分割线 |
| 微边框 | `--border-light` | 极细微的分割 |

**强调色使用规则**：

- `--accent-gold`（金）：主色调 — 标题装饰、选中态、CTA、品牌元素
- `--accent-red`（朱砂）：强调色 — 危险操作、警告、关键状态标记
- `--accent-green`（铜绿）：正向色 — 成功、通过、存活状态
- 每个强调色配 `-light`（高亮变体）和 `-bg`（浅底变体）供 hover/背景使用

### 2.2 字体 (Typography)

**字体栈**：

| Token | 字体 | 用途 |
|-------|------|------|
| `--font-display` | Ma Shan Zheng (毛笔书法) | 页面标题、武将名、章节标题 |
| `--font-body` | 系统字体栈 (PingFang SC / Noto Sans SC) | 正文、表单、列表、数字 |
| `--font-mono` | 等宽字体 | 代码、数值对齐场景 |

**使用规则**：

- `--font-display` 仅用于 `h1`/`h2` 及武将名展示，禁止用于正文
- 正文始终使用 `--font-body`，确保在移动端有最佳的中文渲染
- 英文字符和数字自动跟随系统字体（San Francisco / Segoe UI），无需单独处理

**字号阶梯**（移动端优先）：

| Token | 尺寸 | 用途 |
|-------|------|------|
| `--text-xs` | 12px | 时间戳、辅助标注 |
| `--text-sm` | 14px | 标签、次要信息 |
| `--text-base` | 16px | 正文、表单（触控最小舒适尺寸） |
| `--text-lg` | 18px | 强调正文 |
| `--text-xl` | 20px | 卡片标题 |
| `--text-2xl` | 24px | 区块标题 |
| `--text-3xl` | 30px | 页面标题 |
| `--text-4xl` | 36px | 武将名 / Hero 标题 |

### 2.3 间距 (Spacing)

基于 4px 网格，竹简纵向堆叠为视觉隐喻：

| Token | 值 | 用途 |
|-------|-----|------|
| `--space-1` | 4px | icon 与文字间距、极紧凑元素 |
| `--space-2` | 8px | 列表项内间距、标签间距 |
| `--space-3` | 12px | 组件内 padding（紧凑卡片） |
| `--space-4` | 16px | 标准 padding、卡片内边距 |
| `--space-6` | 24px | 区块间距 |
| `--space-8` | 32px | 大区块间距 |
| `--space-12` | 48px | 页面级间距、Hero 区域 |

**规则**：
- 优先使用 `--space-4`（16px）作为组件标准 padding
- 卡片之间使用 `--space-3`（12px）或 `--space-4`（16px）
- 页面左右留白使用 `--content-padding`（16px）

### 2.4 圆角 (Border Radius)

| Token | 值 | 语义 | 用途 |
|-------|-----|------|------|
| `--radius-sm` | 4px | 印章方中带圆 | 标签、徽章、小按钮 |
| `--radius-md` | 8px | 漆器圆润光泽 | 卡片、输入框、标准按钮 |
| `--radius-lg` | 12px | 漆盒圆角 | 面板、弹窗 |
| `--radius-full` | 9999px | 药丸形 | 胶囊标签、头像 |

### 2.5 阴影 (Shadows)

Light 模式使用暖棕色底阴影（`rgba(120,100,80,x)`），模拟墨色渗透纸面的自然投影。禁止使用冷灰 `rgba(0,0,0,x)`。

Dark 模式使用纯黑底阴影（`rgba(0,0,0,x)`），因暗底上暖色阴影不可见。

**辉光阴影**（签名元素）：

- `--shadow-glow-gold`：金色辉光，用于选中态、高亮卡片
- `--shadow-glow-red`：朱砂辉光，用于危险/警告状态

### 2.6 动效 (Animation)

**克制原则**：只对 2-3 个 key moment 使用动画，不对所有组件套用。

| Token | 值 | 用途 |
|-------|-----|------|
| `--duration-fast` | 150ms | hover、focus、toggle |
| `--duration-normal` | 200ms | 卡牌选中、状态切换 |
| `--duration-slow` | 300ms | 面板展开、内容呈现 |
| `--duration-page` | 400ms | 页面切换、路由过渡 |

**缓动曲线**：

| Token | 曲线 | 感官 | 用途 |
|-------|------|------|------|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | 物理沉降 | hover、active、toggle |
| `--ease-enter` | `cubic-bezier(0.22, 1, 0.36, 1)` | 入场沉降 | 页面切换、卡牌选中 |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | 对称平滑 | 循环动画 |
| `--ease-ink` | `cubic-bezier(0.25, 0.1, 0.1, 1)` | 水墨扩散 | 辉光展开、波纹效果 |

**无障碍**：`prefers-reduced-motion: reduce` 将所有 duration 归零，transition 设为 `none`。

---

## 3. 组件规范

### 3.1 卡片 (Card)

竹简意象 — 卡片是独立的"简"，纵向堆叠，有清晰边界。

```css
.card {
  background: var(--bg-surface);
  border: var(--border-thin) solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
  transition: transform var(--duration-normal) var(--ease-out),
              box-shadow var(--duration-normal) var(--ease-out),
              border-color var(--duration-fast) var(--ease-out);
}

/* 金色描边变体 — 重要卡片（如当前回合玩家） */
.card--accent {
  border-color: var(--accent-gold);
  background:
    var(--card-lacquer-gradient),
    var(--bg-surface);
  box-shadow: var(--shadow-md);
}

/* 选中态 — 水墨晕染 hover */
.card--selected {
  border-color: var(--accent-gold);
  box-shadow: var(--shadow-glow-gold);
  transform: scale(1.02);
}
```

### 3.2 按钮 (Button)

```css
/* 主按钮 — 深金底，确保 WCAG AA 对比度 */
.btn-primary {
  background: var(--accent-gold-dark);
  color: var(--text-inverse);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-6);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  transition: transform var(--duration-fast) var(--ease-out),
              box-shadow var(--duration-fast) var(--ease-out),
              background-color var(--duration-fast) var(--ease-out);
  min-height: 44px; /* 触控最小高度 */
}

.btn-primary:active {
  transform: scale(0.97);
  box-shadow: var(--shadow-glow-gold);
}

/* 幽灵按钮 — 金色描边 */
.btn-ghost {
  background: transparent;
  color: var(--accent-gold);
  border: var(--border-thin) solid var(--accent-gold);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-4);
  transition: background-color var(--duration-fast) var(--ease-out),
              color var(--duration-fast) var(--ease-out),
              border-color var(--duration-fast) var(--ease-out);
}

.btn-ghost:active {
  background: var(--accent-gold-bg);
}
```

### 3.3 装饰线 (Decorative Divider)

竹简编绳意象，用于章节/内容区块分隔。

```css
.decorative-line {
  height: var(--border-medium);
  background: var(--decorative-line);
  border: none;
  margin: var(--space-6) 0;
}
```

### 3.4 标签/徽章 (Badge)

印章意象，用于角色身份、状态标记。

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  border-radius: var(--radius-sm);
  line-height: 1.4;
}

.badge--gold {
  color: var(--accent-gold);
  background: var(--accent-gold-bg);
}

.badge--red {
  color: var(--accent-red);
  background: var(--accent-red-bg);
}
```

### 3.5 弹窗 (Modal)

漆盒意象 — 从暗色遮罩中浮现的亮面面板。

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg-overlay);
  z-index: var(--z-modal-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
}

.modal {
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-xl);
  width: 100%;
  max-width: calc(var(--max-width) - var(--space-8));
}
```

### 3.6 焦点状态 (Focus)

所有可交互元素必须有可见的焦点指示器。

```css
/* 全局焦点环 — 使用 :focus-visible 避免鼠标点击时显示 */
:focus-visible {
  outline: 2px solid var(--accent-gold);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* 表单控件用 :focus-within 高亮容器 */
.form-group:focus-within {
  border-color: var(--accent-gold);
  box-shadow: var(--shadow-glow-gold);
}
```

### 3.7 安全区域 (Safe Area)

移动端刘海屏/底部指示条适配：

```css
.page {
  padding-top: var(--safe-area-top);
  padding-bottom: var(--safe-area-bottom);
}

.fixed-bottom-bar {
  bottom: 0;
  padding-bottom: var(--safe-area-bottom);
}
```

### 3.8 触控优化

- 所有交互元素最小触控区域：44px x 44px
- 全局禁用双击缩放延迟：`touch-action: manipulation`（已在 `style.css` 设置）
- 自定义 tap 高亮色替代系统默认灰色（已通过 `--tap-highlight` 配置）
- 弹窗/抽屉内防止背景滚动：`overscroll-behavior: contain`

### 3.9 签名效果工具类 (Signature Utilities)

可复用的 CSS 类，分布在 `design-tokens.css` 末尾。贯彻"物质感"设计原则。

| 类名 | 灵感 | 效果 | 典型场景 |
|------|------|------|---------|
| `.texture-rice-paper` | 宣纸 | ::before 伪元素叠加 SVG 噪点纹理 | 特殊面板、战役记录、故事叙述区 |
| `.border-ink` | 松烟墨 | inset box-shadow 双环模拟墨洇毛边 | 文本卡片、引用块、手札笔记 |
| `.seal-stamp` | 印章 | 朱砂双线方框 + -2° 微旋转 | 身份标记（主公/反贼）、状态封印 |
| `.seal-stamp--gold` | 玉玺 | 同 seal-stamp 但用金色 | 特殊身份、帝王标记 |
| `.decorative-line--knotted` | 编绳 | 金色装饰线 + ◆ 菱形节点 | 章节间内容分隔 |
| `.ink-wash-hover` | 水墨晕染 | hover 时金色辉光扩散 | 可交互卡牌、武将头像 |

**使用规则**：
- `.texture-rice-paper` 内部直接子元素会获得 `z-index: 1` 以确保在纹理层上方——不要用 `z-index: 0` 或负数覆盖
- `.seal-stamp` 仅用于 ≤3 个汉字的短文本（印章特性），长文本撑破双框比例
- `.border-ink` 和 `box-shadow` 不叠加使用——墨洇已经是投影效果
- `.decorative-line--knotted` 必须与 `.decorative-line` 同时使用：`class="decorative-line decorative-line--knotted"`
- `.ink-wash-hover` 尊重 `prefers-reduced-motion`，退化后 hover 时无动画

---

## 4. 可访问性 (Accessibility)

### 4.1 颜色对比度

| 组合 | Light 对比度 | Dark 对比度 | 达标 |
|------|------------|------------|------|
| `--text-primary` / `--bg` | `#2c2c2c` / `#faf6f0` = 13.6:1 | `#e8e0d5` / `#1a1a1f` = 10.2:1 | AAA |
| `--text-secondary` / `--bg` | `#78716c` / `#faf6f0` = 4.6:1 | `#a0988c` / `#1a1a1f` = 4.7:1 | AA |
| `--accent-gold` / `--bg` | `#b8860b` / `#faf6f0` = 3.0:1 | `#d4a843` / `#1a1a1f` = 5.2:1 | Dark AA / Light 装饰用 |

注意：
- `--accent-gold` 在 Light 模式下对比度仅 3.0:1，**仅用于装饰元素和描边**，不作为正文文字颜色
- **主按钮背景**使用 `--accent-gold-dark`（Light: `#7a5c10`，白字对比度 6.1:1 ✓ AAA），而非 `--accent-gold`

### 4.2 动效

- 全局尊重 `prefers-reduced-motion: reduce`（所有 duration 归零）
- 仅动画 `transform` 和 `opacity`
- 过渡属性显式列出，禁止 `transition: all`

### 4.3 语义化

- 使用 `<button>` 做操作，`<a>` 做导航
- 图标按钮必须有 `aria-label`
- 表单控件必须有 `<label>` 关联
- 标题层级使用 `<h1>`-`<h6>` 有序嵌套

---

## 5. 主题切换

### 实现方式

```css
/* 系统偏好（自动） */
@media (prefers-color-scheme: dark) { :root { ... } }

/* 手动切换（高优先级） */
:root[data-theme="dark"]  { ... }
:root[data-theme="light"] { ... }
```

### JavaScript 切换逻辑

```js
// 设置主题
function setTheme(mode) {
  // mode: 'system' | 'light' | 'dark'
  if (mode === 'system') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', mode)
  }
  localStorage.setItem('theme-preference', mode)
}

// 初始化
const saved = localStorage.getItem('theme-preference') || 'system'
setTheme(saved)
```

**优先级**：手动选择 > 系统偏好 > Light 默认

---

## 6. 反模式 (Anti-Patterns)

以下是**严格禁止**的做法：

### 颜色

- ❌ 硬编码 hex 值（如 `color: #333`） → 必须使用 `var(--text-primary)`
- ❌ Dark 模式使用纯黑 `#000` 或冷灰 `#888` → 必须使用暖色系暗底
- ❌ 使用蓝色系（`#2563EB` 等）作为主色调 → 禁用蓝色，使用金色/朱砂红

### 动效

- ❌ 对每个组件都加 hover 动画 → 只对 2-3 个 key moment 使用
- ❌ 使用 `left`/`top`/`width`/`height` 做动画 → 只用 `transform` + `opacity`
- ❌ 不设 `prefers-reduced-motion` 退化 → 必须在媒体查询中将 duration 归零

### 字体

- ❌ 正文使用 `--font-display`（书法体） → 正文只用 `--font-body`
- ❌ 标题使用系统字体 → 标题/武将名使用 `--font-display`
- ❌ 使用 emoji 作为图标 → 使用 SVG 图标（Lucide / 自制）

### 布局

- ❌ 桌面端优先的布局思维 → 移动端竖屏优先，max-width: 480px
- ❌ 使用 px 硬编码间距 → 使用 `--space-*` token
- ❌ 触控目标小于 44px → 按钮/交互元素最小高度 44px

### 阴影

- ❌ Light 模式使用 `rgba(0,0,0,x)` 阴影 → 使用暖棕色 `rgba(120,100,80,x)`
- ❌ 多层重叠阴影 → 最多使用一层阴影

---

## 7. 文件结构

```
src/
├── main.js                          # 顶部 import design-tokens.css
├── style.css                        # 全局 reset + base 样式
└── assets/css/
    └── design-tokens.css            # 所有 CSS 自定义属性（本 Design System 的单一事实源）
```

`design-tokens.css` 是**单一事实源**（Single Source of Truth）。所有组件通过 `var(--token-name)` 引用，不在组件内重新定义颜色/字体/间距。

---

## 8. 设计决策记录

| 决策 | 理由 |
|------|------|
| 间距使用标准 4px 阶梯 | 移动端触控精度要求标准化间距；竹简纵向节奏通过装饰线和卡片堆叠体现，非间距值本身 |
| 圆角使用 4/8/12px | 标准值保证触摸友好；语义绑定（印章=sm, 漆器=md/lg）赋予上下文特异性 |
| Light 阴影使用暖棕而非冷灰 | 墨色渗透纸面的自然投影，比 `rgba(0,0,0,x)` 更符合宣纸意象 |
| Dark 背景 `#1a1a1f` 非纯黑 | 松烟墨有棕底，纯黑 `#000` 在 OLED 屏幕上过于冷硬 |
| 朱砂红 `#c44536` 非正红 | 印章朱砂在纸面上呈有灰度的红，正红 `#ff0000` 过于荧光刺眼 |
| 只做 2-3 个 key moment 动效 | 过多动画会让游戏工具 UI 显得轻浮，克制动效强化"工具感" |
| 正文不用书法体 | Ma Shan Zheng 虽有个性但可读性不如系统字体，正文阅读效率优先 |
