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
│   │   │   ├── yin_zhang.svg        # 印章
│   │   │   ├── yu_xi.svg            # 玉玺
│   │   │   ├── tai_yang.svg         # 太阳（主题切换）
│   │   │   └── yue_liang.svg        # 月亮（主题切换）
│   │   └── images/menus/            # 菜单卡片图片
│   ├── components/
│   │   ├── ui/                      # 无业务耦合的 UI 组件
│   │   │   ├── Drawer/                   # 抽屉面板（reka-ui 封装）
│   │   │   ├── SplashScreen/             # 启动画面
│   │   │   └── ThemeToggle.vue           # 主题切换按钮（主页）
│   │   ├── Console/                 # 尚书台控制台
│   │   │   ├── Index.vue                 # 编排层：zone 分组 → 网格渲染
│   │   │   └── components/
│   │   │       └── ThemeToggle.vue       # 昼夜滑动开关（控制台）
│   │   ├── InkWashBackground/       # 墨洇动态背景
│   │   ├── JadeSeal/                # 玉玺悬浮按钮
│   │   └── QingGangJian/            # 青釭剑悬浮球
│   ├── composables/                 # 组合式函数
│   │   ├── useAppShell.js           # 首屏 Splash → App 过渡（代际管理）
│   │   ├── useConsole.js            # 控制台面板开关状态
│   │   ├── usePageReady.js          # 页面资源就绪检测（自动/手动）
│   │   └── useImagePreload.js       # 图片预加载
│   ├── constants/
│   │   ├── menus.js                 # 工具注册表（单一事实源）
│   │   ├── consoleItems.js          # 控制台条目注册表（Zone + 网格参数）
│   │   └── storageKeys.js           # localStorage Key 枚举（单一事实源）
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
│   │   ├── localStorage.js          # 统一缓存 store（load/reset/pageData）
│   │   └── menuOrder.js
│   └── utils/
└── docs/
    └── superpowers/specs/
```

## Console 控制台

`consoleItems.js` → `Index.vue` → `components/*.vue`，数据驱动网格布局。

- 6 列正方形网格，`colSpan` / `rowSpan` 控制占位，ResizeObserver 计算单位尺寸
- 加控件：`consoleItems.js` 追加条目，`Console/components/` 写组件，Index.vue 不动

## 数据持久化

`useLocalStorage`（`src/stores/localStorage.js`）统一管理所有 localStorage 读写。三类数据：

| 类别 | key 来源 | 示例 |
|------|----------|------|
| 系统 | `StorageKeys` 枚举（固定 key） | 主题、菜单排序 |
| 控件 | `StorageKeys` 枚举（固定 key） | 控制台开关 |
| 页面 | `route.fullPath`（动态 key） | 表单内容、工具计算结果 |

### 新增持久化数据的步骤

1. `storageKeys.js` 加 key
2. 组件 setup 中调用 `store.load(key, defaults)` 加载
3. 读写 `store.cache[key]` 或 `store.pageData`（页面数据语法糖）
4. 重置用 `store.reset(key, defaults)`

```js
import { useLocalStorage } from '@/stores/localStorage'
import { StorageKeys } from '@/constants/storageKeys'

const store = useLocalStorage()

// 系统/控件
store.load(StorageKeys.CONSOLE, { isOpen: false })
store.cache[StorageKeys.CONSOLE].isOpen  // 读写

// 页面
store.load(route.fullPath, { selected: null })
store.pageData.selected                   // 语法糖，等同 cache[route.fullPath].selected
store.reset(route.fullPath, { selected: null })
```

### 不持久化的数据

以下保持内存状态，不纳入 `useLocalStorage`：
- `useAppShell` — Splash 过渡（路由切换即重置）
- `useImagePreload` — 图片加载状态
- 组件内瞬时手势/动画状态

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

## 组件分类

| 目录 | 性质 |
|------|------|
| `ui/` | 无业务耦合，跨项目可复用 |
| `<Name>/` | 有业务耦合，内部可含子组件 |

**命名**：组件与页面目录用大驼峰（`SplashScreen/`），入口文件命名为 `Index.vue`。  
**升级**：组件被其他通用组件引用时 → 提升到 `ui/`。

## 版本号管理

`useVersionCheck` 在首屏比对 `package.json` 的 `version`，不一致则清空 `localStorage`。

提交时检查改动是否影响持久化数据：store 字段变更、新增 localStorage key、`menus.js` 注册表变更。涉及则升级 patch 版本（`0.1.0` → `0.1.1`），与触发改动同一次 commit。

---
