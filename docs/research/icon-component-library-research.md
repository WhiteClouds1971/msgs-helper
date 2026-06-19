# 图标库 & 组件库调研结论

**日期**：2026-06-18 | **会话**：2026-06-18-icon-component-lib-research

---

## 一、调研范围

| 维度 | 调研方案数 | 最终决策 |
|------|:--:|------|
| 图标库（npm 包） | 7 | ❌ 不引入 |
| 图标平台（iconfont） | 3 种接入方式 | 🔄 搁置待考察 |
| AI 自绘 SVG | 6 个样本试画 | 🔄 搁置，方向确认 |
| 组件库（headless） | 9 | ❌ 不引入 |
| 组件库（themable） | 4 | ❌ 不引入 |
| MCP 工具 | 6 | iconfont-mcp 待后续评估 |

---

## 二、各方案评估与结论

### 2.1 图标库（npm 包）

| 方案 | 推荐度 | 结论 |
|------|:--:|------|
| `@remixicon/vue` | ❌ | 图标数量 3,100+，风格偏现代 UI，缺少面杀游戏场景图标。**不采用** |
| `unplugin-icons` + Iconify | ❌ | 过度工程（~40 个图标不需要构建插件），且依赖的图标集本身风格不匹配 |
| `lucide-vue-next` | ❌ | 仅 ~1,700 图标，过于西方极简，无国风元素 |
| `@tabler/icons-vue` | ❌ | 中性几何风格，无文化个性 |
| `@heroicons/vue` | ❌ | ~400 图标、Tailwind 生态、停止更新 |
| `@iconify/vue` | ❌ | 运行时 API 拉取，移动端首屏不友好 |
| `@icon-park/vue-next` | ❌ | 字节出品，2,658 个图标，无明显中国风优势 |

**最终决策**：不引入任何第三方图标 npm 包。

### 2.2 iconfont 平台

| 接入方式 | 结论 |
|------|------|
| 在线 CDN（Font Class / Symbol） | ❌ 不推荐生产使用（CDN 不稳定、离线不可用、无 tree-shaking） |
| 下载 SVG → unplugin-icons 本地编译 | 🔄 技术可行，但作为"图标市场"使用 |
| iconfont-mcp 集成 | 🔄 `@thlg/icon-font-mcp` 可用，Claude Code 内搜图下载 |

**最终决策**：iconfont.cn 可后续作为**图标搜索来源**使用（中文搜国风图标有优势），当前不引入其 CDN 或工作流。iconfont-mcp 待项目图标需求明确后再评估。

### 2.3 AI 自绘 SVG

试画了 6 个国风游戏图标：

| 图标 | 迭代 | 评估 |
|------|:--:|------|
| 印章 seal-stamp | v1 | 24×24 下篆书笔画偏密 |
| 祥云纹 cloud-xiangyun | v1 | 弧线衔接需调，气韵不足 |
| 折扇 folding-fan | v1 | ⭐⭐⭐⭐ 几何结构清晰 |
| 勾玉 magatama | v2 | 逗号形方向正确 |
| 兜鍪 armor-helmet | v2 | 中式头盔，比 v1 甲片更可辨 |
| 团龙纹 dragon-emblem | v2 | 圆形徽章形态适合做标记背景 |

**最终决策**：

- ✅ **确认所有图标自建**，不从第三方图标库引入
- ❌ **不采用 AI 直接生成 SVG** 的方式——变动大、难精确调整、风格一致性不可控
- 🔄 **自建方式待定**，但排除"纯手写 SVG 路径"路线，需要更系统化的图标产出方案

### 2.4 组件库

| 类别 | 方案 | 结论 |
|------|------|------|
| Headless | reka-ui | ❌ 过于重型（~60-90KB），桌面交互模型不适用移动端，1 人维护有风险 |
| Headless | Headless UI (Vue) | ❌ 组件数不足（~10 个），Vue 版滞后于 React |
| Headless | Ark UI | 🔄 比 reka-ui 更 Vue-native，但 Vue 版本较新 |
| 工具层 | @vueuse/core | ✅ 预留引入（useDark/onClickOutside/useStorage 等） |
| 定位引擎 | @floating-ui/vue | ✅ 预留引入（tooltip/popover 定位，~5KB） |
| Themable | PrimeVue unstyled | ❌ CSS 残留 bug，pt API 额外抽象层 |
| Themable | Naive UI | ❌ JS 主题系统与 CSS Token 不兼容 |
| Themable | Element Plus | ❌ Element 风格渗透，:deep() 覆盖成本高 |
| Themable | Ant Design Vue | ❌ 设计语言最固执，几乎无法脱离 |

**最终决策**：**不引入任何 UI 组件库**。符合项目 CLAUDE.md 既定规则 §10。核心交互组件（Dialog→BottomSheet、Select→Picker、Tabs→Swipe Tabs）针对移动端 480px 自建。底层工具（VueUse、Floating UI）在需要时按需引入。

---

## 三、最终技术路线

```
图标系统                              组件系统
────────                              ────────
来源：自建（方案待定）                 来源：全部自建
约束：不引入第三方图标 npm 包          约束：不引入第三方 UI 组件库
     不依赖在线 CDN                         移动端优先 480px
     Light/Dark 双主题适配                  CSS Token 驱动样式
     通过 CSS var(--token) 控制颜色          自建 BottomSheet / Picker / Tabs

待定：图标自建的具体技术方案
     （排除：AI 直接生成 SVG / 纯手写路径）
```

### 保留引入的依赖（按需，非必须）

| 包 | 用途 | 预估增量 | 引入时机 |
|------|------|:--:|------|
| `@vueuse/core` | 工具 composable | ~20-40KB gzip | 需要 useDark/onClickOutside 时 |
| `@floating-ui/vue` | 弹出层定位 | ~5-8KB gzip | 需要 Tooltip/Popover 时 |
| `vite-svg-loader` | SVG 作为 Vue 组件导入 | 0（devDependency） | 图标方案确定后 |

---

## 四、调研过程记录

- 图标库：7 个方案逐项对比（风格匹配度、Vue 3 集成、tree-shaking、包体积）
- 组件库：9 个方案逐项对比（主题兼容性、a11y、移动端适配、维护活跃度）
- 集成方案：3 种组合路线的包体积估算
- Devil's Advocate 反方质证：发现 `@iconify-json/remix-icon` 包名错误、reka-ui 三大问题
- AI 自绘试画：6 个国风图标样本，v1→v2 迭代
- 预览页面：`src/pages/IconPreview.vue`（`/icon` 路由），展示多色多尺寸效果

试画图标文件位于 `src/assets/icons/game/`（作为参考保留，不用于生产）。

---

## 五、后续工作：自建图标与组件的 AI 可发现性维护

### 5.1 问题定义

本项目图标和组件全部自建。如果不做管理，AI 在开发时会**默认自己画**（→ 风格不一致、重复造轮子），或者**不知道已有可用的图标/组件**（→ 引入冗余实现）。

需要一个维护方案，让 AI 能**快速查找本项目已支持的图标和组件**，而不是每次用到时就当场画一个新的。

### 5.2 目标

| 目标 | 说明 |
|------|------|
| **单一事实源** | 图标和组件各有一个清单文件，AI 直接读取即可知全貌 |
| **可搜索** | 按名称/类别/关键词快速定位，不依赖文件系统遍历 |
| **可预览** | 图标能实际看到长什么样，而非凭名称猜测 |
| **版本可追踪** | Git 可 diff，新增/修改/删除都有记录 |
| **AI 友好格式** | 结构化的 Markdown 或 JSON，AI 单次 Read 即可理解 |

### 5.3 约束

- 不与 Vite/Vue 构建流程耦合（纯文档/清单层）
- 不引入额外的图标管理平台
- 维护成本低——新增图标/组件只需改 1-2 个文件

### 5.4 考察方向

| 方向 | 思路 | 优劣 |
|------|------|------|
| **A. Markdown 目录清单** | `docs/icons.md` + `docs/components.md`，列表形式列出所有图标/组件及用途 | 简单直接，但无图标预览 |
| **B. SVG Sprite + 预览页** | 所有图标编译为一个 `sprite.svg`，配一个 HTML 预览页可直观浏览 | 有预览，但需构建步骤 |
| **C. 图标即组件注册表** | 一个 `icons.js` 统一导出所有图标组件，AI import 一次即知全部 | Vue 组件方式，可直接用，但无预览 |
| **D. Claude Code 专用：CLAUDE.md 注入** | 在项目 CLAUDE.md 中维护图标/组件清单，AI 每次会话自动加载 | AI 会话原生支持，无需额外查询 |
| **E. 组合方案** | Markdown 目录（人类可读）+ CLAUDE.md 摘要（AI 快速索引）+ 预览页（视觉确认） | 最完整，但维护点多 |

### 5.5 待确定

- 图标自建的具体技术方案确定后，同步确定维护方案
- 优先度：高——在开始大规模写组件/图标之前必须先建立清单体系

---

## 六、调研过程记录
