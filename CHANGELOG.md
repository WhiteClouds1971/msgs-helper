# Changelog

## [0.1.0] — 2026-06-19

### Added
- **青釭剑 (QingGangJian)** 悬浮控件：横置古剑形态，支持拖拽吸附、短按扇形菜单、长按回主页、剑身文字滚动
- **主页卡片堆叠 (HomePage)**：6 张等大卡片水平偏移堆叠，滑动切换 + 阈值吸附，墨洇背景
- **扇形菜单 (FanMenu)**：以剑首为中心 45° 圆弧展开 3 个菜单项（语音/搜索/设置）
- **工具页外壳 (ToolShell)**：墨洇背景 + 青釭剑悬浮，方向感知导航
- **国风 404 页面 (NotFound)**：印章 + 书法体标题 + 古诗文案
- **主题切换 (ThemeToggle)**：light/dark 一键切换，持久化到 localStorage
- **顶部栏 (TopBar)**：工具页可选顶部导航栏
- **菜单注册表 (menus.js)**：23 条目，含图片路径/主题色/方向/焦距
- **LRU 排序 Store (menuOrder)**：最近访问的工具排到最前，localStorage 持久化
- **剑状态 Store (qingGangJian)**：位置/展开状态/台词，localStorage 持久化
- **图片预加载 Composable (useImagePreload)**：可见 6 + 预加载 8 策略
- **包名枚举 (packageEnum)**：基础/武将/辅助分类
- **5 个新 Design Token**：--ink-wash-overlay, --sword-blade-length, --sword-blade-height, --card-offset-x, --card-visible-count
- **测试基础设施**：vitest + happy-dom + 23 tests
- **冷启动白屏防护**：index.html inline background-color
- **性能优化**：will-change + contain + lazy loading + decoding async

### Changed
- **App.vue**：添加 `<router-view v-slot>` + `<Transition name="page-fade">` 页面过渡动画
- **路由重构**：`/` → HomePage, `/tool/:name` → ToolShell, `/:pathMatch(.*)*` → NotFound
- **design-tokens.css**：追加 v2 Layout Tokens 和 --ink-wash-overlay

### Removed
- **Home.vue**：被 HomePage.vue 取代
- **双击返回功能**：设计移除
