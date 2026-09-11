@/Users/cloudswhite/Personal/Codes/my/claude/md/programming.md

# 面杀辅助工具 (msgs-helper)

面杀（桌上角色扮演推理游戏）辅助 Web 应用。

## 技术栈

| 类别 | 技术 |
|------|------|
| 状态管理 | Pinia 3 |
| CSS 预处理 | Less |
| 代码规范 | ESLint 9 (flat config) + Prettier |

## 目录结构

```
msgs-helper/
├── index.html
├── vite.config.js
├── jsconfig.json
├── eslint.config.js
├── .prettierrc.json
├── DESIGN_SYSTEM.md
├── ANIMATION_SPECS.md
├── build.sh
├── .env / .env.dev / .env.uat / .env.prod
├── public/
│   └── favicon.svg
├── src/
│   ├── main.js
│   ├── App.vue
│   ├── style.css
│   ├── assets/
│   │   ├── css/design-tokens.css    # Design Token 定义
│   │   ├── icons/                   # SVG 图标
│   │   │   ├── arrow-left.svg       # 左箭头（导览）
│   │   │   ├── arrow-right.svg      # 右箭头（导览）
│   │   │   ├── yin_zhang.svg        # 印章
│   │   │   ├── yu_xi.svg            # 玉玺
│   │   │   ├── tai_yang.svg         # 太阳（主题切换）
│   │   │   ├── yue_liang.svg        # 月亮（主题切换）
│   │   │   └── qing_chu.svg         # 清除（控制台 · 清除本页数据）
│   │   ├── images/menus/            # 菜单卡片图片
│   │   └── md/                      # 页内展示的 Markdown 正文（?raw 导入）
│   ├── components/
│   │   ├── Console/                 # 尚书台控制台
│   │   │   ├── Index.vue                 # 编排层：zone 分组 → 网格渲染
│   │   │   └── components/
│   │   │       ├── ThemeToggle.vue       # 昼夜滑动开关（控制台）
│   │   │       └── ClearPageData.vue     # 清除本页数据（控制台）
│   │   ├── GlobalControls/          # 全局控件容器：统一管理控件可见性
│   │   ├── InkWashBackground/       # 墨洇动态背景
│   │   ├── JadeSeal/                # 玉玺悬浮按钮
│   │   └── QingGangJian/            # 青釭剑悬浮球
│   ├── ui/                          # 无业务耦合的基础 UI 组件
│   │   ├── Drawer/                       # 抽屉面板（reka-ui 封装）
│   │   ├── ImageGallery/                 # 多图展示（逐张铺满宽度 + 纵向滚动）
│   │   ├── MdViewer/                     # Markdown 正文展示（marked 渲染）
│   │   ├── Message/                      # 全局轻提示宿主（reka-ui Toast 封装）
│   │   ├── SplashScreen/                 # 启动画面
│   │   └── Tooltip/                      # 悬停提示
│   ├── layout/                      # 布局容器
│   │   ├── BackgroundLayout.vue          # 背景全屏布局：墨洇动态背景 + 内容插槽
│   │   └── BlankLayout.vue               # 空白布局：纯 slot 透传，无任何装饰
│   ├── composables/                 # 组合式函数
│   │   ├── useAppShell.js           # 首屏 Splash → App 过渡（代际管理）
│   │   ├── useConsole.js            # 控制台面板开关状态
│   │   ├── usePageReady.js          # 页面资源就绪检测（自动/手动）
│   │   └── useImagePreload.js       # 图片预加载
│   ├── constants/
│   │   ├── menus.js                 # 工具注册表（单一事实源）
│   │   ├── consoleItems.js          # 控制台条目注册表（Zone + 网格参数）
│   │   ├── storageKeys.js           # localStorage Key 枚举（单一事实源）
│   │   ├── tourKeys.js              # 导览 Key 枚举（单一事实源）
│   │   └── tourSteps.js             # 导览步骤注册表（单一事实源）
│   ├── pages/
│   │   ├── index.js                 # 路由配置
│   │   ├── 404.vue
│   │   ├── demo/
│   │   └── home/                    # 主页（卡片堆叠）
│   │       └── components/
│   ├── router/
│   │   ├── index.js
│   │   └── routes.js
│   ├── stores/
│   │   ├── index.js
│   │   ├── localStorage.js          # 统一缓存 store（load/reset/clearPage/pageData）
│   │   └── menuOrder.js
│   └── utils/
└── docs/
    └── superpowers/specs/
```

## Console 控制台

`consoleItems.js` → `Index.vue` → `components/*.vue`，数据驱动网格布局。

- 6 列正方形网格，`colSpan` / `rowSpan` 控制占位，ResizeObserver 计算单位尺寸
- 加控件：`consoleItems.js` 追加条目，`Console/components/` 写组件，Index.vue 不动
- `tip` 为长按提示文本，由 Index.vue 统一监听长按后打开 Tooltip

## 数据持久化

`useLocalStorage`（`src/stores/localStorage.js`）统一管理 localStorage。Key 注册在 `src/constants/storageKeys.js`（单一事实源）。

- **系统/控件**：固定 key（`StorageKeys.XXX`），`store.load(key, defaults)` → `store.cache[key]` 读写
- **页面**：动态 key（`route.fullPath`），`store.load(fullPath, defaults)` → `store.pageData` 读写（语法糖）
- **重置**：`store.reset(key, defaults)` → 删缓存 + 还原默认值
- **清除页面数据**：`store.clearPage(key = route.fullPath)` → 删 localStorage + 删内存缓存 + 递增 `store.pageRevision`；`pageRevision` 参与 `App.vue` 中 router-view 的 key，页面随之重挂载，setup 重新 `load()` 回默认值（内存缓存必须一并删，否则残留态会在下次变更时被写回）。返回 `boolean`，页面本就无数据时为 `false`

## 全局轻提示 (Message)

`useMessage()` → `message.success/error/warning/info(content, { duration })`（默认 2000ms，`duration: 0` 常驻）、`message.close(id)` / `message.closeAll()`；宿主 `<Message />` 已在 `App.vue` 全局挂载，直接调用即可。

## 多图展示 (ImageGallery)

页面展示图片一律用 `src/ui/ImageGallery/`：`<ImageGallery :images="[{ src, alt? }]" />`（图片永不裁切，逐张铺满容器宽度纵向排列；一屏放不下就纵向滚动，放得下则整组居中；无内边距、无边框、无圆角）。

可选 props：`gap`（图间距，CSS 长度，默认 `var(--space-2)`）。排布与滚动全部由 CSS 完成（`width: 100%` + `height: auto`），没有脚本测量，图片加载前后不跳版；组件契约由同目录 `Index.test.js` 覆盖，`npm test` 可跑。

## Markdown 展示 (MdViewer)

页面展示 Markdown 一律用 `src/ui/MdViewer/`。两种送内容的方式，二选一：

```vue
<!-- ① content：原文直给（推荐）—— 正文随包发布，无请求、离线可用、改文件即热更 -->
<script setup>
import cunGuiMd from '@/assets/md/cun-gui.md?raw'
</script>
<template>
  <MdViewer :content="cunGuiMd" />
</template>

<!-- ② src：给地址，组件自行 fetch —— 内容可脱离构建单独更新 -->
<MdViewer src="/rules/cun-gui.md" />
```

- `content` 非空时优先，且**不发起请求**；换 `src` 时中断上一次请求，慢响应不会覆盖新内容
- 只负责"把 Markdown 画出来"：**不自建滚动容器**（滚动交给页面）、不带标题栏/操作栏
- 空 / 加载 / 失败三态各有提示文案，可覆盖：`loadingText` / `emptyText` / `errorText`
- 渲染出的 HTML 经 `v-html` 注入，**只喂可信来源**（仓库内的 `.md`），不要传用户输入
- 版式已按设计系统落定：h1/h2 用 `--font-display`、正文 `--font-body`，列表记号/引用线/分隔线走古铜金，图片铺满容器宽度（与 ImageGallery 同规则）；组件契约由同目录 `Index.test.js` 覆盖，`npm test` 可跑

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（端口 9456，监听 0.0.0.0） |

## 路径别名

| 别名 | 解析路径 | 用途 |
|------|----------|------|
| `@/` | `src/` | 源码根目录（组件、页面、路由、状态等） |
| `~/` | `./` (项目根目录) | 项目根目录资源引用 |

别名在 `vite.config.js` 和 `jsconfig.json` 中均有配置，确保 Vite 构建和 IDE 均可正确识别。

## UI 主题设计

遵守设计系统规范。完整规则见：

- `@/../DESIGN_SYSTEM.md` — 设计理念、Token、组件规范、反模式
- `@/../ANIMATION_SPECS.md` — 动效精确参数
- `src/assets/css/design-tokens.css` — **单一事实源**，所有颜色/字体/间距通过 `var(--token)` 引用，禁止硬编码

## 教学导览 (Tour)

基于 Driver.js，`tourSteps.js` → `useTour.js` → 组件。

| 文件 | 职责 |
|------|------|
| `src/constants/tourSteps.js` | 步骤注册表，按 tour name 分组（单一事实源） |
| `src/constants/tourKeys.js` | Tour Key 枚举（单一事实源），禁止在别处写字符串字面量 |
| `src/composables/useTour.js` | Driver 封装：`start(key)`/`stop()`、进度点、箭头导航、`onEnter` 脚本 |
| `src/assets/css/tour-theme.css` | 全局换肤，全部 `var(--token)` |

**Step 字段：** `element`（必填，目标元素 ID，如 `#card-stack`）、`popover`（`title`/`description` 必填，`side`/`align` 可选）、`onEnter`（可选，进入时执行）、`onLeave`（可选，离开时执行）。

**Tour 级钩子（`{ steps, ...hooks }` 格式，均可选）：**

| 钩子 | 触发时机 | 参数 |
|------|----------|------|
| `onBeforeStart` | 教学开始前 | 无 |
| `onBoundaryArrow` | 点击已禁用的 ◀/▶ 箭头 | `('left'\|'right')` |

向下兼容纯 `steps[]` 数组格式。

**使用：** `tourSteps.js` + `tourKeys.js` 追加 key，组件中 `start(TourKeys.XXX)`。禁止写字符串字面量。

## 新建页面

每个页面组件**必须**调用 `usePageReady()`，否则 SplashScreen 永不解除、页面卡在加载态。

```js
import { usePageReady } from '@/composables/usePageReady'
usePageReady()  // 自动追踪 <img> 加载，无图片则即刻就绪
```

**内容超出一屏的页面**：`#app` 是 `overflow: hidden` 的固定高度壳，文档本身不滚动，页面根元素需自建滚动容器：

```less
.page {
  height: 100%;            /* 不要用 min-height，否则只被裁剪 */
  /* 页边距：左右 = --content-padding（16px，设计系统规则）；上下 = --space-4 叠加安全区 */
  padding:
    calc(var(--safe-area-top) + var(--space-4))
    var(--content-padding)
    calc(var(--safe-area-bottom) + var(--space-4));
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}
```


## 版本号管理

`useVersionCheck` 在首屏比对 `package.json` 的 `version`，不一致则清空 `localStorage`。

提交时检查改动是否影响持久化数据：store 字段变更、新增 localStorage key、`menus.js` 注册表变更。涉及则升级 patch 版本（`0.1.0` → `0.1.1`），与触发改动同一次 commit。

---
