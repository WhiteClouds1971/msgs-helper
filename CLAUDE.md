@/Users/cloudswhite/Personal/Codes/my/claude/md/programming.md

# 面杀辅助工具 (msgs-helper)

面杀（桌上角色扮演推理游戏）辅助 Web 应用。

## 技术栈

| 类别 | 技术 |
|------|------|
| 状态管理 | Pinia 3 |
| CSS 预处理 | Less |
| 代码规范 | ESLint 9 (flat config) + Prettier |
| 后端 | Spring Boot 3.3.7 · Java 21 · MyBatis-Plus · Flyway · MySQL 8 |

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
├── start-dev.sh                     # 本地开发：一条命令起前后端（profile=dev + Vite）
├── build.sh                         # 生产部署：dist + jar + systemd 重启后端
├── .env / .env.dev / .env.uat / .env.prod
├── public/
│   └── favicon.svg
├── src/
│   ├── main.js
│   ├── App.vue
│   ├── style.css
│   ├── api/                         # 接口封装（axios 统一出口见 utils/request.js）
│   ├── assets/                      # 静态资源
│   │   ├── css/                     # 全局样式（Design Token 定义）
│   │   ├── icons/                   # SVG 图标
│   │   ├── images/menus/            # 菜单卡片图片
│   │   └── md/                      # 页内展示的 Markdown 正文（?raw 导入）
│   ├── components/                  # 业务组件
│   │   ├── Console/                 # 尚书台控制台
│   │   ├── GlobalSearch/            # 全局搜索
│   │   ├── GlobalControls/          # 全局控件容器：统一管理控件可见性
│   │   ├── InkWashBackground/       # 墨洇动态背景
│   │   ├── JadeSeal/                # 玉玺悬浮按钮
│   ├── ui/                          # 无业务耦合的基础 UI 组件
│   │   ├── Button/                       # 按钮（primary / ghost 两变体）
│   │   ├── Drawer/                       # 抽屉面板（reka-ui 封装）
│   │   ├── ImageFigure/                  # 单张图片展示（铺满宽度 + 可选说明区域）
│   │   ├── MdViewer/                     # Markdown 正文展示（marked 渲染）
│   │   ├── Message/                      # 全局轻提示宿主（reka-ui Toast 封装）
│   │   ├── RadioGroup/                   # 单选按钮组（选项摊成一行按钮，原生 radio 语义）
│   │   ├── SearchSelect/                 # 可搜索 / 可手填的下拉选择
│   │   ├── Select/                       # 单选下拉框（reka-ui 封装）
│   │   ├── SkillCard/                    # 单个三国杀技能展示（居中技能名 + 标签 + 规则）
│   │   ├── SplashScreen/                 # 启动画面
│   │   └── Tooltip/                      # 悬停提示
│   ├── layout/                      # 布局容器
│   │   ├── BackgroundLayout.vue          # 背景全屏布局：墨洇动态背景 + 内容插槽
│   │   └── BlankLayout.vue               # 空白布局：纯 slot 透传，无任何装饰
│   ├── composables/                 # 组合式函数
│   │   ├── useAppShell.js           # 首屏 Splash → App 过渡（代际管理）
│   │   ├── useConsole.js            # 控制台面板开关状态
│   │   ├── useGlobalSearch.js       # 搜索蒙层开关状态（单例）
│   │   ├── useKeywordHighlight.js   # 跳转落地后的滚动 + 高亮（mark.js）
│   │   ├── usePageReady.js          # 页面资源就绪检测（自动/手动）
│   │   ├── usePageTour.js           # 页面级自动教学调度（同屏一个 / 第二次进入才教）
│   │   └── useImagePreload.js       # 图片预加载
│   ├── constants/
│   │   ├── menus.js                 # 工具注册表（单一事实源）
│   │   ├── consoleItems.js          # 控制台条目注册表（Zone + 网格参数）
│   │   ├── storageKeys.js           # localStorage Key 枚举（单一事实源）
│   │   ├── tourKeys.js              # 导览 Key 枚举（单一事实源）
│   │   └── tourSteps.js             # 导览步骤注册表（单一事实源）
│   ├── pages/                       # 页面：一个菜单一个目录
│   │   ├── home/                    # 主页（卡片堆叠）
│   │   ├── demo/
│   │   ├── jiang-chi/               # 将池胜率统计（隐藏页；components/ 下每个模式一个表单）
│   │   └── ji/ jx/ ol/ shzl/ yjcm/ jsrg/ jxtp/ mode/ mobile/ tool/   # 各扩展包页面
│   ├── router/
│   │   ├── index.js
│   │   └── routes.js
│   ├── stores/
│   │   ├── index.js
│   │   ├── localStorage.js          # 统一缓存 store（load/reset/clearPage/pageData）
│   │   └── menuOrder.js             # 菜单访问顺序（主页卡片堆的展示顺序）
│   └── utils/
│       ├── request.js               # axios 实例：baseURL / 统一响应体拆包 / 错误提示
│       ├── markdown.js              # Markdown 逐行切段 + 跳转锚点候选
│       ├── highlight.js             # 搜索落地定位（按 section + 第几处命中认人）
│       ├── pinyin.js                # 汉字 → 全拼 / 首字母
│       ├── random.js                # 加权随机工具
│       └── search.js                # Fuse 封装 + 命中片段高亮
├── server/                          # 后端（Spring Boot，独立 Maven 工程）
│   ├── pom.xml                      # Java 21 / Spring Boot 3.3.7
│   ├── mvnw                         # Maven Wrapper —— 机器上不用装 Maven
│   └── src/main/
│       ├── java/com/msgshelper/server/
│       │   ├── MsgsHelperServerApplication.java
│       │   ├── controller/          # REST 入口（路径不写 /api，前缀来自 context-path）
│       │   ├── service/             # JiangChiRecordService / RoleCounter（胜败场计数）
│       │   │                        # JiangChiExportService + JiangChiStatRow（Excel 导出）
│       │   ├── mapper/ entity/ dto/ # MyBatis-Plus Mapper / 实体 / 请求体
│       │   └── common/              # Result 统一响应体 / 全局异常处理
│       └── resources/
│           ├── application.yml      # 端口 8081、context-path /api、MyBatis-Plus
│           ├── application-dev.yml  # 本地 MySQL（profile=dev）
│           ├── application-prod.yml # 生产库（profile=prod）；不入库，部署机手工放
│           └── db/migration/        # Flyway 迁移脚本，应用启动时自动执行
└── docs/
    └── superpowers/specs/
```

## 后端 (server/)

Spring Boot 3.3.7 · Java 21 · MyBatis-Plus · Flyway · MySQL 8。独立 Maven 工程，一律用 `./server/mvnw` 构建（机器上不用装 Maven）。

| 项 | 说明 |
|----|------|
| 端口 / 前缀 | 8081，context-path `/api` —— Controller 里不写前缀；前端 `.env*` 的 `APP_BASE_API=/api` 即指此处 |
| 启动 | 开发：`./start-dev.sh`（profile=dev，Vite 一起起）；生产：`./build.sh`（profile=prod，交给 systemd） |
| 配置 | `application.yml` 公共 / `-dev.yml` 本机 MySQL / `-prod.yml` **不入库**（见 `server/.gitignore`），部署机手工放一份到 `server/src/main/resources/`；也可放 jar 工作目录，Spring Boot 外部配置优先级更高 |
| 建表 | `resources/db/migration/*.sql` 由 Flyway 启动时执行 —— 改表加脚本，别手改库 |
| 响应体 | `common/Result.java` `{ code, message, data }`，`code === 0` 为成功，异常由 `GlobalExceptionHandler` 兜底 —— 前端 `utils/request.js` 据此拆包、弹错 |
| 现有接口 | `GET /api/ping`（探针）、`POST /api/jiang-chi/records`（记一局 / 只登记将池）、`GET /api/jiang-chi/heroes`（武将候选）、`GET /api/jiang-chi/export`（导出武将胜率统计 xlsx —— **不走 Result 统一响应体**，直接回文件流） |
| Excel 导出 | EasyExcel 4.0.3（POI 5.2.5）按模板填充：模板 `resources/template/武将胜率统计模版.xlsx` **第三行是列表行**，格子内容是 `{.字段名}` 占位符，字段由 `service/JiangChiStatRow.toMap()` 提供；加列 = 模板加占位符 + 那里多 put 一个 key |
| 部署 | JDK 21、Node ≥ 22、nginx 把 `/api` 转发到 8081、systemd 单元 `msgs-helper.service`（入口是 build.sh 生成的 `server/app.jar` 软链）—— 完整步骤见 README「生产部署」 |

## Console 控制台

`consoleItems.js` → `Index.vue` → `components/*.vue`，数据驱动网格布局。

- 6 列正方形网格，`colSpan` / `rowSpan` 控制占位，ResizeObserver 计算单位尺寸
- 加控件：`consoleItems.js` 追加条目，`Console/components/` 写组件，Index.vue 不动
- `tip` 为长按提示文本，由 Index.vue 统一监听长按后打开 Tooltip
- 抽屉高度：`min-height: 35dvh`（保底，控件下方留白）+ `max-height: 75dvh`（封顶），两者均用 dvh

## 数据持久化

`useLocalStorage`（`src/stores/localStorage.js`）统一管理 localStorage。Key 注册在 `src/constants/storageKeys.js`（单一事实源）。

- **系统/控件**：固定 key（`StorageKeys.XXX`），`store.load(key, defaults)` → `store.cache[key]` 读写
- **页面**：动态 key（`route.fullPath`），`store.load(fullPath, defaults)` → `store.pageData` 读写（语法糖）
- **重置**：`store.reset(key, defaults)` → 删缓存 + 还原默认值
- **清除页面数据**：`store.clearPage(key = route.fullPath)` → 删 localStorage + 删内存缓存 + 递增 `store.pageRevision`；`pageRevision` 参与 `App.vue` 中 router-view 的 key，页面随之重挂载，setup 重新 `load()` 回默认值（内存缓存必须一并删，否则残留态会在下次变更时被写回）。返回 `boolean`，页面本就无数据时为 `false`
- **菜单访问顺序**：`useMenuOrder`（`src/stores/menuOrder.js`）维护「最近访问的菜单排最前」，顺序就存在**主页的页面数据**里（key = 主页 path），所以在主页上「清除本页数据」即复位。**记录入口只有一处**：`App.vue` 监听 `route.meta.code`，主页卡片点击、全局搜索、直链/刷新一视同仁 —— 页面各自 `router.push` 时不用管顺序。主页读取用 `storeToRefs`（直接解构拿到的是解包后的值，既丢响应式又没有 `.value`）

## 全局轻提示 (Message)

`useMessage()` → `message.success/error/warning/info(content, { duration })`（默认 2000ms，`duration: 0` 常驻）、`message.close(id)` / `message.closeAll()`；宿主 `<Message />` 已在 `App.vue` 全局挂载，直接调用即可。

## 图片展示 (ImageFigure)

页面展示图片一律用 `src/ui/ImageFigure/`：`<ImageFigure :src="url" alt="…" caption="…" />`（**一张图 = 一个组件**，铺满容器宽度、等比缩放，永不裁切、永不拉伸；无内边距、无边框、无圆角）。

- **只画一张图，不管一组图**：多图的排列、间距、谁跟谁一组，全由使用方在自己的页面里组织（叠几个 `<ImageFigure>` 即可）—— 组件不自建滚动容器、不画列表，否则同页多图各成一个滚动区会互相打架
- **说明区域（可选）**：图下的 `<figcaption>`，与图之间只隔一段 `--space-3` 间距、不加装饰线。两种喂法二选一：`caption` 给纯文本，或默认插槽塞任意内容（如 `<MdViewer>`，参考 `src/pages/jsrg/GuoJia/`）；两者都不给就不渲染，图下不留空位
- **滚动与居中归页面**：组件是普通块级元素（`margin: 0`）。整页只有一张图时，页面用 `display: flex` + 图 `margin: auto` 实现「放得下就整屏居中，放不下就整页滚」（`margin: auto` 在溢出时自动归零，不像 `justify-content: center` 那样裁掉顶部）
- 尺寸全部交给 CSS（`width: 100%` + `height: auto`），没有脚本测量，图片加载前后不跳版；加载失败会撤下 `<img>` 原地留占位
- 组件契约由同目录 `Index.test.js` 覆盖，`npm test` 可跑

## Markdown 展示 (MdViewer)

页面展示 Markdown 一律用 `src/ui/MdViewer/`。两种送内容的方式，二选一：

```vue
<!-- ① content：原文直给（推荐）—— 正文随包发布，无请求、离线可用、改文件即热更 -->
<script setup>
import guiZeCunGuiMd from '@/assets/md/gui-ze-cun-gui.md?raw'
</script>
<template>
  <MdViewer :content="guiZeCunGuiMd" />
</template>

<!-- ② src：给地址，组件自行 fetch —— 内容可脱离构建单独更新 -->
<MdViewer src="/rules/gui-ze-cun-gui.md" />
```

- `content` 非空时优先，且**不发起请求**；换 `src` 时中断上一次请求，慢响应不会覆盖新内容
- 只负责"把 Markdown 画出来"：**不自建滚动容器**（滚动交给页面）、不带标题栏/操作栏
- 空 / 加载 / 失败三态各有提示文案，可覆盖：`loadingText` / `emptyText` / `errorText`
- 渲染出的 HTML 经 `v-html` 注入，**只喂可信来源**（仓库内的 `.md`），不要传用户输入
- **合并文档按节取用**：多张牌 / 多条规则共用一篇 `.md` 时（一节一张牌，如 `src/assets/md/you-xi-pai.md` 的 `## 趁火打劫`），页面用 `extractMarkdownSection(raw, '趁火打劫')`（`@/utils/markdown`）切出自己那一节再喂 `MdViewer`；注册表同一篇由各页面**按节认领**（`docs: [{ id, heading }]`，见 `menus.js` 顶部字段说明），搜索结果的跳转路由据此落到真正渲染该节的页面
- **搜索结果落地按「哪一块 + 块内第几处」认人**：文档结果点击后 URL 带 `keyword`（锚点文字）+ `section`（块标题）+ `hit`（块内第几处），落地页 `useKeywordHighlight` 先在页面上找到标题为 `section` 的那一块（MdViewer 把一节画在一个容器里，标题是它的直接子元素），再在块内取第 `hit` 处命中 —— 一页里同一句话出现几次也不会指错（否则点哪条都跳第一处）。**页面无需为此加任何标记**：块标题就是 Markdown 里那一节的标题，位置与序号由 `GlobalSearch/engine.js` 按文档算好（见 `utils/highlight.js`）
- 版式已按设计系统落定：h1/h2 用 `--font-display`、正文 `--font-body`，列表记号/引用线/分隔线走古铜金，图片铺满容器宽度（与 ImageFigure 同规则）；组件契约由同目录 `Index.test.js` 覆盖，`npm test` 可跑

## 技能展示 (SkillCard)

三国杀技能**单个**技能的展示用 `src/ui/SkillCard/`：`<SkillCard :skill="{ name, types, description }" />`。

- **纯展示**：技能名居中（`--font-display` 毛笔字），下面接规则正文；技能标签（`types`，可选，可多个）加粗、以空格分隔后平铺在正文最前面，**技能可以没有标签**（不传 `types` 或传空数组就只显示正文，不留空位）
- **只画一个技能，不画列表**：排列、间距、排序、左滑删除等一律由使用方在自己的页面里组织（`ui` 层不出现 `List`）
- 根元素是 `div.skill-card`（`position: relative` + 底色/描边/圆角/阴影），class 可透传，方便页面挂自己的类做交互状态
- 动效只动 `transform` / `border-color` 且时长走 token（reduced-motion 归零）；组件契约由同目录 `Index.test.js` 覆盖，`npm test` 可跑

**列表参考实现**：神华佗 五禽戏页（`src/pages/mobile/ShenHuaTuoWuQinXi/`）—— 列表结构写在页面 `Index.vue`（`ul.skill-board` + `li.skill-board__item[data-skill-key]` + `.skill-board__viewport` 裁剪层 + `.skill-board__bed` 朱砂滑出层，每项内嵌 `<SkillCard class="skill-board__card">`），手势由同目录 `useSkillGestures.js` 接管：

- 长按 360ms 拖动排序；左滑移除（滑过 72px，或距离过半 ≥40px 且速度 ≥0.5px/ms）
- 位移内联写在元素上，纯几何计算（落点下标 / 让位量）抽在 `sortable.js`，`sortable.test.js` 覆盖
- 三个状态类挂在 li 上、样式在页面里：`is-pressed`（按下）/ `is-dragging`（拖起，金色描边 + 辉光）/ `is-swiping`（左滑中，滑出层才显形 —— 平时 `opacity: 0`，否则卡片浮起时缩放会漏红底）
- li 上必须带 `touch-action: pan-y`：纵向滚动照常放行，横向留给手势。缺了它，触屏上的横向滑动会被浏览器判成平移并掐断指针事件流，左滑会整个失效
- 拖拽期间 `preventDefault` 掉 touchmove 压住页面滚动；数据提交与视觉解耦（让位量 = 提交后的真实布局差，故清掉 transform 不跳版，被拖项再用一次 FLIP 补间落位）

## 表单选择 (Select / RadioGroup / SearchSelect)

按「选项多不多」挑，三者对外都是 `v-model` + `:options="[{ label, value }]"`（`value` 是稳定标识：改 label 不动已存数据）。

| 组件 | 用在哪 | 形态 |
|------|--------|------|
| `src/ui/Select/` | 值域大或会长（模式、将池） | 下拉，收着 |
| `src/ui/RadioGroup/` | 两三枚、扫一眼就能定（身份、位置、对局） | 一行按钮，摊开 |
| `src/ui/SearchSelect/` | 候选多到要找（武将：可搜、可手填） | 输入框 + 候选浮层 |

- RadioGroup 每个选项是一枚按钮面，选中态＝金描边 + 淡金底 + 金辉光 + 半档字重（**不靠金色写字**：Light 模式下 `--accent-gold` 只有 3.0:1，见设计系统 §4.1）
- 单选语义整个交给原生 `<input type="radio">`：同组自动同名（不传 `name` 按实例生成，一页放几组也不串台），方向键切换、表单提交、屏幕阅读器都是白拿的；按钮面只是它的 `label`
- 选项一律排一行、等分宽度；一行放不下时文字省略而不折行（折行会让第二行那枚独占整行，看着像被选中）
- 组件契约由同目录 `Index.test.js` 覆盖，`npm test` 可跑
- SearchSelect 的候选浮层是**滚动容器**（条目多时靠手指划），所以「点一下」与「拖着滚」必须分得开：按下只记落点，抬手位移 ≤ TAP_SLOP（8px）才算选中。按下就选中会同时踩两个坑 —— 列表永远滚不动，且一碰就 pick（收起候选 + blur 输入框，软键盘跟着退）。拖动期间还要保住输入框的焦点：条目 pointerdown 上 preventDefault（规范保证它拦不住滚动，只拦复合鼠标事件）＋「面板上正按着指针时来的 blur 不当成失焦」兜底
- `@/ui/Select` 的选项少（模式 3 项、将池 8 项），面板不溢出、无需滚动；真出现长列表再照 SearchSelect 那套改写

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

**页面自动教学（主页除外）：** 一律用 `src/composables/usePageTour.js` 调度，不要在页面里自己写定时器 / 自己判有没有别的教程：

```js
const pageReady = ref(false)                     // 页面资源就绪信号（可选）
usePageTour(TourKeys.XXX, { ready: pageReady })  // 资源就绪后再调度（等 Splash 淡出）
usePageTour(TourKeys.XXX)                        // 不等资源：挂载后 delay（默认 600ms）调度
```

它保证三条硬规则，页面不用再操心冲突：

| 规则 | 行为 |
|------|------|
| **玉玺教程优先** | 菜单页（`meta.code`）且 `menu-seal` 还没教过 → 本页教学这次不上场。玉玺教程由 JadeSeal 在挂载 600ms 后拉起，与本页教学是同一条时间线上的竞速：不挡它就会出现「谁后起谁赢」，输的一方次数已被记掉，第二次进入反而没教学 |
| **同屏只有一个教程** | 调度那一刻屏幕上已有教程（`.driver-overlay` 在）→ 本次跳过，不抢也不排队 |
| **页面教学从第二次进入本页起加载** | 首次进入整个让给玉玺教程，也避免用户刚点开搜索 / 控制台就被本页教学糊一脸 |

三条让位路径都**不会调用 `startTour`**，所以 `msgs-tour` 里本页的 count 保持为 0，下次进入本页自动补上 —— 这是本模块最容易踩的坑：只要先 `startTour` 再被别的教程顶掉，次数就已经消耗掉了。

进入次数按路由 path 记在 `StorageKeys.PAGE_VISITS`（`msgs-page-visits`），以「页面组件挂载」为一次进入。**主页不走这条**：主页教学逻辑保持原样（`pages/home/Index.vue` 里自己 `startTour(TourKeys.HOME, { mode: 'auto' })`）。

**可静态导入：** `useTour.js` 的 store 是延迟获取的（不在模块顶层调 `useLocalStorage()`）—— 它会被 App.vue 的组件树静态导入（如 `GlobalControls → JadeSeal`），而那一刻 `main.js` 的 `use(pinia)` 尚未执行，模块顶层取 store 会直接白屏。
**交互放行：** driver 挂在目标元素上的 `.driver-active-element` 会被 Vue 的 class 补丁抹掉（该元素 class 绑定一变就整体重写），需要放行指针事件时用**组件自己绑定的类**（如玉玺的 `#jade-seal.is-touring`，见 `tour-theme.css` 7a/7b）。

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
