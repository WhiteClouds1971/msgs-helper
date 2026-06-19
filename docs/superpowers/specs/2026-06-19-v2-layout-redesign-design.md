# 面杀辅助工具 — 布局设计 v2

**版本**：v2 | **日期**：2026-06-19 | **状态**：设计完成，待审查

---

## 1. 架构改动概览

### 1.1 改动对比

| 项目 | 原设计 (layout-design.md v2.2) | 新设计 v2 |
|------|-------------------------------|----------|
| 悬浮元素 | 朱砂印章圆形 (56px) FloatingBall.vue | 横置古剑 QingGangJian.vue（剑身台词 + 剑柄交互） |
| 切换入口 | 长按悬浮球弹出 AppSwitcher 遮罩 | 主页 `/` 本身就是堆叠卡片 |
| 短按 | 扇形菜单 | 扇形菜单（不变） |
| 双击 | 返回上一个工具 | 全局搜索（后续开发） |
| 长按 | 打开 AppSwitcher | 返回主页 `/` |
| 卡片内容 | 静态快照（名称+图标+主题色） | 精美图片 + 诏书标签 |
| 返回功能 | 双击返回上一个工具 | 移除，不需要了 |
| 横竖屏导航 | 无 | 菜单声明首选方向，不一致时旋转进入 |

### 1.2 路由

```
/                  → HomePage.vue（3D 卡片堆叠，工具切换唯一入口）
/tool/:name        → ToolShell.vue → 各工具组件
```

### 1.3 组件

```
src/
├── App.vue                          # <router-view v-slot> + <Transition>
├── components/ui/
│   ├── QingGangJian.vue             # 悬浮古剑（替代 FloatingBall）
│   ├── FanMenu.vue                  # 扇形菜单（新建）
│   ├── FanMenuItem.vue              # 扇形菜单项（新建）
│   ├── TopBar.vue                   # 工具页可选顶部栏（新建）
│   └── ThemeToggle.vue              # 主题切换（新建）
├── composables/
│   └── useImagePreload.js           # 图片预加载逻辑
├── constants/
│   └── packageEnum.js               # 包名枚举（纯常量模块，非 Store）
├── pages/
│   ├── index.js                     # 路由配置
│   ├── HomePage.vue                 # 主页 = 卡片堆叠（替代 AppSwitcher）
│   ├── HomePageCard.vue             # 单张卡片（图片 + 诏书标签）
│   ├── ToolShell.vue                # 工具页外壳（墨洇背景 + 方向感知）
│   └── tools/                       # 各工具页面（defineAsyncComponent 动态加载）
├── stores/
│   ├── qingGangJian.js              # 剑的状态（位置、展开/收起、台词）+ localStorage
│   └── menuOrder.js                 # LRU 排序 + localStorage
└── menus.js                         # 工具注册表（menus[] — 单一事实源）
```

### 1.4 废弃

| 组件 | 原因 |
|------|------|
| FloatingBall.vue | 被 QingGangJian.vue 取代 |
| AppSwitcher.vue | 被 HomePage.vue 取代（不再是 overlay，是路由页面） |
| AppSwitcherCard.vue | 卡片结构内联到 HomePage.vue |
| 双击返回功能 | 移除 |

---

## 2. 主页设计（HomePage.vue）

### 2.1 背景：墨洇（Ink Wash Overlay）

```
┌────────────────────────────────────────────┐
│  · · · · · · · · · · · · · · · · · · · · ·│  texure-rice-paper 宣纸纹理
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│  backdrop-filter: blur(12px)
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  radial-gradient 暖黑遮罩
│                                            │
│       ┌──────────────────────┐             │  ← 卡片区
│       │   6 张等大水平偏移卡片  │             │     isolation: isolate
│       └──────────────────────┘             │     隔断模糊继承
│                                            │
└────────────────────────────────────────────┘
```

**技术实现**：
- 父容器 `background: var(--bg)`
- `::before`：`backdrop-filter: blur(12px) brightness(0.6)` + `radial-gradient(ellipse at center, transparent 40%, var(--ink-wash-overlay) 100%)`
- 卡片区域 `isolation: isolate` 隔断背景模糊继承，保持卡片清晰

### 2.2 卡片布局：等大卡片 · 水平偏移堆叠

所有卡片**尺寸相同**，水平方向偏移堆叠。最前面的卡片完整展示，后面的依次向右偏移，只露出右侧边缘。

```
┌──────────────────────────────────────────┐
│                                          │
│  ┌──────────────────────────────┐        │  ← 卡片 A（最前，完整可见）
│  │                              │        │
│  │      [完整精美图片]           │        │
│  │                              │        │
│  │    ┌────────────────────┐    │        │  ← 诏书完整可见
│  │    │  基础 · 体力卡       │    │        │
│  │    └────────────────────┘    │        │
│  └──┬───────────────────────────┘        │
│   ┌┴──┴──────────────────────────┐       │  ← 卡片 B（露出一截右侧）
│   │  [图片右侧边缘可见]           │       │     被 A 遮挡左侧 ~80%
│   └──┬───────────────────────────┘       │
│    ┌┴──┴──────────────────────────┐      │  ← 卡片 C（露出更少）
│    │                              │      │
│    └──┬───────────────────────────┘      │
│     ┌┴──┴──────────────────────────┐     │  ← 卡片 D（仅露一条边）
│     │                              │     │
│     └──────────────────────────────┘     │
│     ··· 最多 6 张卡片可见                 │
│                                          │
│  ← 左右滑动：前层滑出 → 下一张完整展示     │
└──────────────────────────────────────────┘
```

| 属性 | 值 |
|------|-----|
| 卡片尺寸 | **全部相同**（等宽等高） |
| 水平偏移 | 每层向右偏移 60-80px |
| 可见层数 | 6 张 |
| Z 轴顺序 | z-index 递减（前层最高） |
| 前层高亮 | `box-shadow: var(--shadow-glow-gold)` |
| 后层样式 | 无缩放、无缩小、无 3D perspective 旋转。唯一变化是**被遮挡** |

**交互**：

| 手势 | 行为 |
|------|------|
| 左右滑动 | 前层卡片滑出 → 下一张完整展示 → 原前层移到堆叠末尾 |
| 超过 25% 宽度 | 吸附切换到相邻卡片 |
| 未达阈值 | 弹回原位 |
| 上滑 | 无操作（主页不关闭） |
| 点击空白区 | 无操作（主页不关闭） |

### 2.3 卡片结构

```
┌──────────────────────────┐
│                          │
│   [精美图片]              │  图片区
│   object-fit: cover      │  focalX/focalY 焦点对齐
│                          │
├──────────────────────────┤
│  谕  基础 · 体力卡  旨    │  诏书标签（始终显示）
│      ════════════════     │  底部金色装饰线
└──────────────────────────┘
```

**诏书标签规格**：

| 元素 | 字体/颜色 |
|------|----------|
| 左端 "谕" 小印 | `.seal-stamp`，朱砂红 `--accent-red`，`--text-xs` |
| 分隔符 `·` | `--accent-gold-light` |
| 包名 | `var(--text-secondary)`，`--text-sm`，系统字体 |
| 标题 | `--font-display`，`--text-lg`，可被菜单自定义主题色覆盖 |
| 右端 "旨" 小印 | `.seal-stamp`，朱砂红 `--accent-red`，`--text-xs` |
| 底部装饰线 | `.decorative-line--knotted`，颜色可被主题色覆盖 |
| 背景 | `var(--bg-surface)`，**不受主题色影响**（你说的"底色不变"） |

**主题色影响范围**：边框装饰线、标题文字颜色、金色辉光。不影响背景底色。

### 2.4 排序逻辑

```
首次加载 → 按 menus[] 注册表定义顺序排列
之后     → 最近访问的工具移到最前
           Pinia store 维护 lastAccessTimestamp
           用户选中工具 → 该工具移到数组首位
           下次回主页 → 最近用的在最前
```

### 2.5 图片规格

每个菜单的图片配置：

```js
// 工具注册表字段
{
  name: '体力卡',
  image: {
    src: '/images/ti-li-ka.webp',     // 图片路径（支持 gif/webp/png）
    focalX: 50,                         // 焦点 X（百分比 0-100，默认 50 居中）
    focalY: 50,                         // 焦点 Y（百分比 0-100，默认 50 居中）
    fit: 'cover',                       // 'cover' | 'contain'（默认 'cover'）
  },
  themeColor: '#c44536',                // 自定义主题色（影响标题/装饰线/辉光）
  packageName: '基础',                   // 包名（枚举，映射到 Pinia 的 packageEnum）
  orientation: 'vertical',              // 'vertical'(竖) | 'horizontal'(横)
}
```

**CSS 生成**：`object-position: ${focalX}% ${focalY}%` + `object-fit: cover`

### 2.6 图片预加载 & 加载态

```
策略：渲染当前可见 6 张 + 预加载后续 8 张

预加载：new Image() 或 <link rel="preload" as="image">

图片未就绪时 → 占位与 Splash Screen 相同视觉：
  ┌──────────────────────────┐
  │                          │
  │     ◯ 面杀（旋转印章）    │
  │     ── 水墨线 ──          │
  │                          │
  └──────────────────────────┘
```

### 2.7 包名枚举

包名由项目维护者自行定义。代码中提供枚举结构：

```js
// stores/packageEnum.js
export const PackageName = {
  BASIC: '基础',
  WARLORD: '武将',
  ASSIST: '辅助',
  // 自行扩展...
}
```

---

## 3. 青釭剑（QingGangJian.vue）

### 3.1 视觉结构

```
剑尖 ◆                                           ┌──┐
       ═══════════════════════════════════════    │剑│  ← 剑首（56px 圆形）
       剑身 → "宁教我负天下人…"（从右向左滚动）    │首│     交互入口
       ═══════════════════════════════════════    └──┘
       ▎▎                                      ▎▎  ← 剑格（护手，古铜金）
                                                  ← 将来语音控件区（▶⏸🔇）
```

| 部位 | 尺寸 | 角色 | 颜色/材质 |
|------|------|------|----------|
| 剑首 | 56×56px 圆形 | 短按/长按/双击交互 | `--bg-surface` 底 + `--accent-gold` 描边 + 朱砂穗绳装饰 |
| 剑格 | 横向短线 | 将来语音控件预留 | `--accent-gold-light` |
| 剑身 | 160-200px × 28px | 台词展示 | `--bg-surface` 半透明底，`--text-primary` 文字 |
| 剑尖 | 三角形小箭头 | 装饰 | `--accent-gold-light` |

### 3.2 台词滚动

| 属性 | 值 |
|------|-----|
| 滚动方向 | 固定从右向左（符合古文阅读习惯，从剑首流向剑尖） |
| 播放中 | 跑马灯滚动（CSS `overflow: hidden` + 内层 `animation: translateX`） |
| 播放完/暂停 | 定格在当前位，不循环 |
| 无台词时 | 显示当前工具名称作为默认文本 |
| 将来语音 | 台词同步滚动 + 剑格嵌入播放控件（后续开发） |

### 3.3 手势映射

```
pointerdown（在剑首上）
  │
  ├─ [移动 > 10px] → DRAGGING（整体拖拽，剑柄吸附左/右边缘）
  │
  ├─ [500ms 不动] → LONG_PRESS → router.push('/') 回主页
  │
  └─ [<300ms 抬起]
       ├─ [300ms 内第二次 pointerdown] → DOUBLE_TAP → 全局搜索（后续开发）
       └─ [300ms 超时] → SHORT_PRESS → 打开扇形菜单
```

**扇形菜单项调整**：

| 项 | 图标 | 行为 |
|----|------|------|
| 语音 | 🎙 | 展开/收起剑身（替代原来的 TTS 朗读） |
| 搜索 | 🔍 | emit `@select('search')`（全局搜索后续开发） |
| 设置 | ⚙ | emit `@select('settings')` |
| 关于 | ℹ️ | emit `@select('about')` |

> "返回"不放进去，已移除。

### 3.4 剑身展开/收起

```
收起：手指在剑身上向剑柄方向滑动 → 剑身缩入剑首方向
      动画：transform: scaleX(0)，origin 在剑柄侧
      收起后：仅剩 56×56px 剑首 + 微型台词指示图标

展开：短按剑首 → 扇形菜单 → 点击语音图标
      动画：transform: scaleX(1)，origin 在剑柄侧
      或者双击语音图标快速展开
```

### 3.5 拖拽 & 吸附

```
剑柄始终贴屏幕左或右边缘
剑身横置，剑尖朝内：
  - 剑柄贴右边 → 剑尖朝左（←━◆）
  - 剑柄贴左边 → 剑尖朝右（◆━→）

吸附规则（以剑柄中心为准）：
  剑柄 X < 屏幕宽度 50% → 吸附左边
  剑柄 X ≥ 屏幕宽度 50% → 吸附右边
  正中间相等 → 吸附右侧（默认侧）

吸附动画：transform: translate() + var(--ease-enter) 300ms
```

### 3.6 展开/收起状态记忆

```
首次加载 → 默认展开
之后     → 记住上次选择
           Pinia store 维护 isExpanded
           同步到 localStorage
```

---

## 4. 工具页外壳（ToolShell.vue）

### 4.1 页面结构

```
路由 /tool/:name → ToolShell.vue（包裹层）→ 具体工具组件

┌──────────────────────────────────────────┐
│                                          │
│  [工具组件内容区]                          │  ← 100vw × 100vh
│                                          │     flex: 1，组件自主布局
│                                          │
│  背景：菜单图片弱化（墨洇处理）             │  ← 与主页背景处理一致
│                                          │     backdrop-filter: blur() + 暖色遮罩
│                                     ┌──┐ │
│                                     │剑│ │  ← 青釭剑，始终悬浮
│                                     └──┘ │
└──────────────────────────────────────────┘
```

### 4.2 方向感知导航

每个菜单声明首选方向：

```js
// 工具注册表
{
  name: '体力卡',
  orientation: 'vertical',   // 'vertical'(竖) | 'horizontal'(横)
}
```

**点击卡片判断逻辑**：

```
点击卡片
  │
  ├─ 菜单方向 == 设备方向
  │    → 卡片直接 scaleUp 全屏（~200ms） → 路由进入工具页
  │
  └─ 菜单方向 ≠ 设备方向
       → 卡片先 rotate(90°)（~250ms） → scaleUp 全屏（~200ms） → 路由进入
         旋转本身就是提示，不需要额外文字
```

### 4.3 卡片放大动画

时序：

```
Phase 1（200ms）：卡片从堆叠位置 scale 到全屏
Phase 2（150ms）：路由导航到 /tool/:name
Phase 3（100ms）：工具组件淡入
总时长 ~450ms，var(--ease-enter)
```

方向不一致时在前面插入一个 250ms 的 90° 旋转。

### 4.4 返回机制

- **长按剑首** → 回主页 `/`（卡片堆叠）
- 各工具可自行决定是否添加顶部栏返回按钮（可选）

---

## 5. 状态管理

| Store | 职责 | 持久化 |
|-------|------|:------:|
| `qingGangJian` | 剑的位置、吸附边、展开/收起、当前台词 | 展开状态 → localStorage |
| `menuOrder` | 菜单排序（first: 定义顺序 → 之后: 按访问时间） | 访问时间 → localStorage |
| （路由状态） | 当前工具 = `useRoute().params.name`，历史栈由 Vue Router 管理 | 否（Router 内置） |
| `packageEnum` | 包名枚举定义 | 否（纯 JS 常量模块，非 Store） |
| 各工具 store | 按需使用 Pinia 或组件本地状态 | 按需 |

---

## 6. 关键 Design Token 新增

| Token | 建议值 | 说明 |
|-------|--------|------|
| `--sword-blade-length` | 180px | 剑身长度 |
| `--sword-blade-height` | 28px | 剑身高度 |
| `--card-offset-x` | 70px | 卡片水平偏移量 |
| `--card-visible-count` | 6 | 可见卡片数 |

---

## 7. 与 Design System 的衔接

| 元素 | Design Token / 类 |
|------|-------------------|
| 剑首 | `--bg-surface` + `--accent-gold` 描边 + 朱砂穗装饰 |
| 剑身 | `--bg-surface` 半透明 + `--text-primary` |
| 剑格 | `--accent-gold-light` |
| 主页背景 | `.texture-rice-paper` + `backdrop-filter: blur()` + `--bg-overlay` |
| 卡片底色 | `--bg-surface` |
| 前层高亮 | `--shadow-glow-gold` |
| 诏书印章 | `.seal-stamp`（朱砂红） |
| 诏书装饰线 | `.decorative-line--knotted` |
| 卡片标题 | `--font-display` + 自定义主题色 |
| 吸附动画 | `transform: translate()` + `--ease-enter` 300ms |
| 剑身伸缩 | `transform: scaleX()` + `--ease-ink` |
| 所有动画 | 仅 `transform` + `opacity` |

---

## 附录：设计决策汇总

| # | 决策 | 选择 | 理由 |
|----|------|------|------|
| 1 | 悬浮元素形状 | 横置古剑（剑身+剑柄） | 二元结构匹配"信息面+交互点"双需求；收起态=原悬浮球 |
| 2 | 主页定位 | 路由 `/` = 卡片堆叠 | 无中间页，切换路径最短 |
| 3 | 主页背景 | 墨洇（backdrop-filter + 暖黑渐变） | 与 Design Token 体系一致 |
| 4 | 卡片布局 | 等大水平偏移堆叠 | iPhone 式交互，简洁直观 |
| 5 | 卡片内容 | 精美图片 + 诏书标签 | 视觉优先；取消静态快照方案 |
| 6 | 图片裁剪策略 | focalX/focalY 焦点百分比 | 用户只需指定重要区域位置，CSS 自动处理 |
| 7 | 包名 | 枚举定义，展示在诏书中 | 用户自维护；代码只提供结构和展示位 |
| 8 | 排序 | 第一次按定义顺序，之后按访问时间 | LRU 策略 |
| 9 | 渲染策略 | 可见 6 + 预加载 8 | 性能保护 |
| 10 | 加载态 | Splash Screen 占位 | 视觉一致性 |
| 11 | 剑身展开/收起 | 向剑柄滑收起；语音图标展开 | 自然手势映射 |
| 12 | 展开默认态 | 首次展开，之后记住状态 | 视觉冲击 + 用户控制 |
| 13 | 拖拽吸附 | 剑柄贴边，始终横置 | 肌肉记忆一致 |
| 14 | 双击 | 全局搜索（后续开发） | 腾出双击，比"返回"更有价值 |
| 15 | 返回功能 | 移除 | 长按随时回主页，双击返回无实际价值 |
| 16 | 方向感知 | vertical/horizontal 声明；不一致时旋转进入 | 不阻塞用户 |
| 17 | 包名用词 | 中文（基础/武将/辅助） | 用户自定 |
| 18 | 台词滚动 | 固定右→左；播完定格不循环 | 符合古文阅读 + 语义合理 |

---

## 设计审查决策补充（2026-06-19 plan-design-review）

以下决策在审查过程中确定，补充原附录：

| # | 决策 | 选择 | 理由 |
|----|------|------|------|
| 19 | 剑在主页可见性 | 主页隐藏，工具页展示 | 主页卡片堆叠本身就是导航，剑增加视觉噪音 |
| 20 | 剑默认位置 | 工具页右下角 | 不遮挡工具内容，可由用户拖拽调整 |
| 21 | 剑与内容重叠 | 用户自行拖拽避让 | 不增加自动避让复杂度，用户有完全控制权 |
| 22 | 0 工具空状态 | 不做特殊处理 | 开发者自用场景，menus[] 由代码配置 |
| 23 | 404 路由 | 显示国风 404 页面 | 明确告知用户工具不存在 |
| 24 | 返回主页 | 长按剑首 + 首次使用教程 | 保留长按唯一入口，用教程解决发现性问题 |
| 25 | 方向感知旋转 | 仅旋转动画，不加文字 | 旋转本身就是优雅提示 |
| 26 | 卡片尺寸 | 宽 = 100vw - 32px，宽高比 3:2 | 与 --content-padding token 一致 |
| 27 | 卡片边界行为 | 线性弹回（非循环） | 明确告知"到边界了" |
| 28 | 卡片过渡动画 | 简化交叉淡入淡出 | 避免 FLIP 复杂度，卡片淡出→路由→工具页淡入 |
| 29 | 剑身台词 | 由后续语音模块注入 | 初期显示当前工具名称 |
| 30 | 墨洇遮罩 Token | 新建 `--ink-wash-overlay` | 不与 --bg-overlay（modal 纯黑遮罩）冲突 |

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | issues_open | score: 7/10 → 8/10, 14 decisions |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | issues_open | 18 issues, 4 critical gaps |

| Run | Date | Status | Score/Issues | Unresolved |
|-----|------|--------|-------------|------------|
| Design #1 | 2026-06-19 | issues_open | 7→8/10 | 6 |
| Eng #1 | 2026-06-19 | issues_open | 18 findings, 4 critical | 2 |

**CODEX:** Not available (CLI not installed). Subagent used for outside voice (18 findings).

**CROSS-MODEL:** Outside voice found 11 issues missed by primary review. Key tensions resolved: toolNavigation doc contradiction fixed, image path architecture decided (src/assets/), swipe gesture conflict addressed (CSS防护+死区). Remaining findings documented below.

**VERDICT:** 设计方案 + 工程架构审查完成。8 项待定。Eng Review required — 2 unresolved architectural decisions remain. Ready to proceed to implementation after resolving the test infrastructure setup and SPA fallback deployment config.

**UNRESOLVED DECISIONS:**
- 图片制作规格（分辨率、安全区、文件格式）— 待图片资源制作时确定
- 剑的 z-index 层级系统（与 modal、fan menu、keyboard 的关系）— 待组件实现时调试
- 扇形菜单相对于可移动剑的定位自适应 — 待 FanMenu 组件实现时处理
- 应用冷启动白屏防止（HTML 预置 background-color）— 一行 CSS，实现时加入
- 图片加载失败 vs 未加载的视觉区分 — 待图片加载组件实现时处理
- SPA fallback 部署配置（Nginx/Vercel/Netlify 重定向规则）— 待部署时配置
- localStorage 持久化版本管理（version key + migration）— 待 store 实现时加入
- 剑拖拽与工具页滚动手势冲突（touch-action: none on sword）— 实现时处理
