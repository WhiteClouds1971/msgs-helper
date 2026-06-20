# Console 主题切换功能 — 设计文档

**日期**：2026-06-20 | **状态**：已确认

---

## 1. 目标

在"尚书台"控制台面板中新增主题切换功能，同时建立 Console 的数据驱动架构，为后续功能扩展打好基础。

---

## 2. 架构

### 文件分工

| 路径 | 职责 | 变更类型 |
|------|------|---------|
| `src/components/Console/Index.vue` | 编排层 — 定义 zone 布局区块，读注册表 → 分组 → 渲染 | 修改 |
| `src/components/Console/consoleItems.js` | 数据注册表 — 每条记录声明 zone + component | 新增 |
| `src/components/Console/components/ThemeToggle.vue` | 主题切换滑块组件 — 自包含交互逻辑 | 新增 |

### 数据流

```
consoleItems.js（纯数据，按 zone 归类的条目列表）
       │
       ▼
  Index.vue（读数据 → 按 zone 分组 → 映射到布局区块）
       │
       ▼
  每个 zone section 内部用 <component :is> 动态渲染
```

### 设计原则

- **Index.vue 只做编排**：定义有哪些区块（zone），不关心每个区块里有什么组件
- **加功能只加数据**：新功能 = `consoleItems.js` 加一条 + 写对应组件，Index.vue 不动
- **zone 是路由 key**：每个条目声明 `zone`，Index.vue 据此决定渲染位置

---

## 3. 数据注册表 — `consoleItems.js`

```js
// 区域标识常量
export const Zone = {
  APPEARANCE: 'appearance',   // 外观
}

// 控制台条目注册表 — 扩展只需在此数组追加
export const consoleItems = [
  {
    id: 'theme-toggle',
    zone: Zone.APPEARANCE,
    component: () => import('./components/ThemeToggle.vue'),
  },
]
```

### 字段约定

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 唯一标识，用作 `:key` |
| `zone` | `Zone` | 目标布局区域，决定渲染到哪个 section |
| `component` | `() => Promise<Component>` | 异步组件加载函数 |

后续扩展可加 `label`、`description`、`props` 等字段，按需演进。

---

## 4. 编排层 — `Index.vue`

### 布局结构

```
┌─ Drawer ──────────────────────────────┐
│  尚书台 — 经纬天下 · 纲纪四方          │
│  ─────────────────────────────────── │
│                                       │
│  ┌─ console-zone (外观) ────────────┐ │
│  │  外观                             │ │
│  │  ┌─ ThemeToggle ───────────────┐ │ │
│  │  │  主题模式        [☀️ ◉ 🌙]  │ │ │
│  │  └────────────────────────────┘ │ │
│  │  （未来更多控件…）               │ │
│  └─────────────────────────────────┘ │
│                                       │
│  ┌─ console-zone (行为) ────────────┐ │
│  │  （未来扩展…）                    │ │
│  └─────────────────────────────────┘ │
└───────────────────────────────────────┘
```

### 关键逻辑

- `zones` 常量数组定义布局区块（code + label），zone 数量 = section 数量
- `itemsByZone` 为 computed，将 `consoleItems` 按 zone 分组
- 空 zone 的 section 仍然渲染（保留结构，不渲染空壳更好 → filter 掉无数据的 zone）
- 渲染用 `<component :is>` + 异步组件，Console 打开时才加载组件代码

---

## 5. ThemeToggle 组件 — 滑动开关

### UI 布局

```
┌──────────────────────────────────────────┐
│  浅色模式                    ┌───☀️─◉─🌙──┐ │
│                              └────────────┘ │
└──────────────────────────────────────────┘

Dark 模式时 thumb 滑到右侧，label 文字变为"深色模式"
```

### 结构

- **整行**可点击，触发切换
- 左侧：动态标签（"浅色模式" / "深色模式"）
- 右侧：滑动开关（track + thumb + 两端图标）
  - Track：胶囊形底槽，`var(--bg-surface-hover)` 底色 + `var(--border)` 边框
  - Thumb：正圆滑块，白色表面 + 微阴影，内含当前状态图标
  - Icons：太阳 SVG 在左端、月亮 SVG 在右端，静止显示在 track 上

### 交互

- 点击整行 / 拖动 thumb → toggle
- Thumb 滑动动画: `transform translateX`，`var(--duration-fast)` + `var(--ease-out)`
- 切换时同步更新 `data-theme` 和 `localStorage('theme-preference')`

### 图标

- 太阳 SVG：`viewBox="0 0 1024 1024"`，fill 使用 `currentColor`
- 月亮 SVG：`viewBox="0 0 1024 1024"`，fill 使用 `currentColor`
- 通过 CSS `color` 控制颜色，暗模式文字用 `var(--accent-gold)`

### 样式要点

```less
.console-theme-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 44px;           // 触控最小高度
  padding: var(--space-2) 0;
  cursor: pointer;
  user-select: none;

  &__label {
    font-family: var(--font-body);
    font-size: var(--text-sm);
    color: var(--text-primary);
  }

  &__track {
    position: relative;
    width: 56px;
    height: 30px;
    border-radius: var(--radius-full);
    background: var(--bg-surface-hover);
    border: var(--border-thin) solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 5px;
    flex-shrink: 0;
    transition: background-color var(--duration-fast) var(--ease-out);
  }

  &__icon {
    width: 16px;
    height: 16px;
    display: flex;
    z-index: 0;               // 在 thumb 下方
    
    svg {
      width: 100%;
      height: 100%;
    }
  }

  &__thumb {
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

    .console-theme-toggle--dark & {
      transform: translateX(26px);
    }
  }
}
```

### 行为细节

- 初始化读取 `localStorage('theme-preference')`，默认 light
- `reduced-motion` 时 thumb transition 归零
- `aria-label` + `role="switch"` + `aria-checked` 提供无障碍支持

---

## 6. `console-zone__items` 自适应布局

### 设计约束

- 未来控件类型多样：toggle 开关、下拉选择、滑块、按钮、输入框……
- 容器不做任何假设性 layout，只提供：
  - 垂直方向弹性堆叠（`display: flex; flex-direction: column`）
  - 统一的子元素间距（`gap`）
- 每个控件组件自己决定内部布局（横向/纵向、占宽等）

```css
.console-zone__items {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
```

配合 item 分隔线（可选，按设计需要）：

```css
.console-zone__items > * + * {
  border-top: var(--border-thin) solid var(--border-light);
  padding-top: var(--space-2);
}
```

用 `border-top` 而非 `gap` 做分隔更符合设计系统的漆器/竹简分隔线意象。

---

## 7. 设计 Token 使用

| 元素 | Token |
|------|-------|
| 区域标题 | `--font-display`、`--text-lg`、`--text-primary` |
| 控件标签 | `--font-body`、`--text-sm`、`--text-primary` |
| Track 背景 | `--bg-surface-hover` |
| Track 边框 | `--border`、`--border-thin` |
| Thumb 表面 | `--bg-surface` |
| Thumb 阴影 | `--shadow-sm` |
| 间距 | `--space-1`、`--space-2`、`--space-3` |
| 圆角 | `--radius-full` |
| 动效 | `--duration-fast`、`--ease-out` |
| SVG 当前色 | `--text-secondary`（静止）/ `--accent-gold`（active） |

---

## 8. 变更范围

| 操作 | 文件 |
|------|------|
| 修改 | `src/components/Console/Index.vue` |
| 新增 | `src/components/Console/consoleItems.js` |
| 新增 | `src/components/Console/components/ThemeToggle.vue` |
| 不动 | `src/components/ui/ThemeToggle.vue`（保持原样，不做修改） |

## 9. 版本号

不影响 localStorage 数据结构（theme-preference key 不变），不涉及版本升级。
