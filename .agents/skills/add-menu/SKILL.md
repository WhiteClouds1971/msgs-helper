---
name: add-menu
description: 在面杀辅助工具 (msgs-helper) 中新增一个菜单/工具卡片：转换并重命名图片资源（卡片封面、页面内容图）、在 menus.js 注册表追加条目（含全局搜索用的 tags / docs 字段）、创建页面（ImageFigure 图片页、MdViewer 文档页模板）、选择布局与教学导览、升级版本号。Use when adding, registering, or creating a new menu, tool entry, or home card in this project.
whenToUse: 用户说「添加一个菜单 / 新增工具 / 加一张卡片 / 让某个武将或玩法出现在主页」时；或需要调整已有菜单的注册表字段（标题、路由、分类、布局、封面、检索标签、关联文档）时。
---

# 新增菜单（msgs-helper）

菜单 = 主页卡片 + 路由 + 页面，由 `src/constants/menus.js` 单一事实源驱动。
路由、卡片、页面入口全部自动生成，**通常只需改 menus.js + 新增页面文件**。

本技能**不做任何验证或测试**：不跑 eslint、不跑 vitest、不跑 build，也不启动浏览器实测。改完文件、升级版本号即收工，结果交给用户自行确认。

## 0. 先定这 7 件事

| 项 | 注册表字段 | 默认 / 取法 |
|---|---|---|
| 标题 | `name` | 用户给定的中文名，如 `夏侯渊 神速` |
| 签题分类 | `packageName` | 卡片上「签」与「题」之间的标签；现有 `工具/OL/十周年/M/大旗`，无合适项就在 `PackageName` 枚举里加一条 |
| 代号 | `code` | 标题转拼音 kebab-case，如 `xia-hou-yuan-shen-su`；全局唯一 |
| 路由 | `route` | `/<包前缀>/<code>`，包前缀与 packageName 对应 |
| 页面目录 | `component` | `@/pages/<包前缀>/<PascalCase>/Index.vue`，与路由同构 |
| 布局 | `layout` | 默认 `MenuLayout.BACKGROUND`；纯内容页/无装饰页用 `MenuLayout.BLANK` |
| 封面图 | `image` | 用户给的图片路径；命名与 focal 见第 1 步 |

包前缀 = `PackageName` 枚举 key 的 kebab-case 小写：`TOOL → tool`、`DA_QI → da-qi`、`OL → ol`、`ANNIVERSARY → anniversary`、`MOBILE → mobile`、`JXTP → jxtp`、`SHZL → shzl`、`YJCM → yjcm`、`JX → jx`、`JSRG → jsrg`。**目录即分类**，页面按 packageName 归档，不按图片来源（封面图里的「大旗」是图片命名前缀，不是目录前缀）。

另需问清（决定第 2、3 步的写法）：
- **要不要教程**：要 → 加 `tourKey`（并在 `tourKeys.js`/`tourSteps.js` 注册）；不要 → **不写该字段**，控制台「教学导览」会自动提示「本页面暂无教学导览」。
- **要不要持久化数据**：要 → 页面里用 `useLocalStorage`；不要 → 页面不引入该 store，控制台「清除本页数据」会自动提示「本页面暂无持久化数据」（`clearPage` 返回 false）。
- **页面主内容是什么形态**：图片为主 → 用现成的 `@/ui/ImageFigure`（第 3 步有模板）；Markdown 正文为主 → 用 `@/ui/MdViewer`（第 3 步有模板，**并且必须在注册表里声明 `docs`**）；内容待开发 → 空壳骨架；有交互 → 按需写。

主题色 `themeColor` 从 `ThemeColor` 枚举里挑一个贴合封面主色调的；`orientation` 现有条目统一为 `'vertical'`。

### 两个只影响全局搜索的可选字段

卡片、路由、导航都不看这两个字段，它们只喂给 `src/components/GlobalSearch/`（玉玺单击 / 控制台「搜索」控件打开的那个蒙层）：

| 字段 | 作用 | 何时写 |
|---|---|---|
| `tags` | **补充检索标签**：与 `name`、`packageName` 一起拼成检索文本，汉字 / 全拼 / 首字母三路模糊匹配都能命中；同时作为小标签显示在搜索结果行 | 菜单名之外还有常用叫法时写，如村规写 `tags: ['规则', '约定']`，搜「规则」或「guize」都能出它；没有额外叫法就省略 |
| `docs` | **本菜单页展示的 Markdown 正文**：整篇写 id（`src/assets/md/` 下的文件名，不含扩展名），只展示其中一节写 `{ id, heading }` | 页面用 `MdViewer` 渲染 `.md` 时必写；纯图片页 / 空壳页不写 |

`docs` 为什么必需：`src/assets/md/*.md` 由 `import.meta.glob` **自动收录**，文件自己并不知道谁在渲染它，而文档搜索结果要跳转就必须知道目标路由。`docs` 就是把「本菜单页展示哪份文档」显式写下来的地方 —— 搜索据此把命中的文档行挂到本菜单的 `route` 上，并用 `name` 作为该结果行的标题。

不写 `docs` 会**静默降级**：文档照样能被搜到，但结果行标题退化成文件名（如 `cun-gui`）、整行变灰不可点，点击只弹「该文档暂未挂到任何菜单」。一份文档可被多个菜单认领（先声明的生效），一个菜单也能挂多份（`docs: ['a', 'b']`）。

**多张牌 / 多条规则合并成一篇 `.md`** 时（正文里一节一张牌，如 `src/assets/md/you-xi-pai.md` 的 `## 趁火打劫`、`## 洞烛先机`、`## 推心置腹`），各页面**按节认领**且互不重叠：注册表写 `docs: [{ id: 'you-xi-pai', heading: '趁火打劫' }]`，页面侧用 `extractMarkdownSection(raw, '趁火打劫')` 只取自己那一节喂给 `MdViewer`。整页展示一篇的照旧写字符串 id —— 别为了「统一」把整篇拆成一堆单节文件，也别让两个页面认领同一节（先声明的生效，另一个页面的搜索结果会落空）。

## 1. 封面图

1. **重命名**：格式 `<出处/皮肤名>-<武将>[-静态].webp`，令牌取自标题（如 `大旗-夏侯渊-神速.webp`）。**不要保留原始哈希文件名**。
2. **转换＋归档**：源码图常是数 MB 的 jpg，必须转成 webp 并缩到卡片够用的尺寸（与仓库现有封面同量级：120–380 KB）：

   ```bash
   bash .agents/skills/add-menu/scripts/prepare-image.sh <源图片> "<文件名不带扩展名>"
   ```

   脚本用 `cwebp -q 82 -m 6 -sharp_yuv` 把**长边**缩到 1920（**只缩不放**，小图原样保留），输出到 `src/assets/images/menus/`，并打印体积、像素和可直接粘贴的 `image.src` 行；已存在同名文件会拒绝覆盖。常用选项：`-f` 覆盖、`-o <目录>` 换输出目录、`-q <质量>`、`-e <长边上限>`（详见 `--help`）。
3. **focalX / focalY**：`HomePageCard.vue` 用 `object-position` 裁切。看不到图时先用 `50/50`；需要估计时用显著性兴趣质心（PIL）：

   ```bash
   python3 -c "
   from PIL import Image
   im=Image.open('<图>').convert('RGB').resize((80,113)); px=im.load(); w,h=im.size
   def it(x,y):
       r,g,b=px[x,y]; mx,mn=max(r,g,b),min(r,g,b); return (mx/255)*(0.25+(0 if mx==0 else (mx-mn)/mx))
   rows=[sum(it(x,y) for x in range(w)) for y in range(h)]
   cols=[sum(it(x,y) for y in range(h)) for x in range(w)]
   c=lambda v: round(100*sum(i*x for i,x in enumerate(v))/sum(v)/(len(v)-1))
   print('focalX',c(cols),'focalY',c(rows))"
   ```

**关键约束**：`image.src` 必须是 `src/assets/images/menus/<文件名>`，**文件名（含中文）要与磁盘文件逐字一致**——卡片通过 `import.meta.glob('@/assets/images/menus/*.{gif,png,jpg,jpeg,webp}')` 按路径末段匹配，写错只会静默显示「图片加载失败」。`fit` 固定 `'cover'`。

## 2. 在 menus.js 追加条目

`src/constants/menus.js` 的 `menus` 数组顺序即默认排序，**追加到末尾**：

```js
{
  code: 'xia-hou-yuan-shen-su',
  name: '夏侯渊 神速',
  route: '/da-qi/xia-hou-yuan-shen-su',
  component: () => import('@/pages/da-qi/XiaHouYuanShenSu/Index.vue'),
  image: {
    src: 'src/assets/images/menus/大旗-夏侯渊-神速.webp',
    focalX: 50,
    focalY: 50,
    fit: 'cover',
  },
  themeColor: ThemeColor.STEEL_BLUE,
  packageName: PackageName.DA_QI,
  // 可选：补充检索标签（全局搜索用，也显示在结果行）
  tags: ['神速', '大旗'],
  // 仅当本菜单页用 MdViewer 渲染 .md 时才写：文档 id = src/assets/md/ 下的文件名（不含扩展名）
  // docs: ['cun-gui'],
  // 无教程：不写 tourKey
  layout: MenuLayout.BLANK,
  orientation: 'vertical',
},
```

枚举都在同文件顶部（`PackageName` / `MenuLayout` / `ThemeColor`），缺项就在枚举里补一条，不要在条目里写字面量。注意该文件是**带分号**风格。

`tags` / `docs` 是可选项，按第 0 步的结论决定写不写 —— 别为了「整齐」给所有条目都补上 `docs`，它表达的是「这个页面确实渲染了那份 .md」，写错等于指错路。

## 3. 路由与页面

- 路由无需手写：`src/pages/index.js` 遍历注册表生成，`meta.layout = menu.layout || MenuLayout.BACKGROUND`，`meta.tourKey = menu.tourKey`。
- 新建 `src/pages/<包前缀>/<PascalCase>/Index.vue`。**每个页面必须调用 `usePageReady()`**，否则 SplashScreen 永不解除（它会自动追踪首屏 `<img>` 的加载）。
- 页面内容图放 `src/assets/images/<包前缀>/<文件名>.webp`，用 `import` 引入（Vite 会 hash 进产物），不要写死 `/src/...` 路径：

  ```bash
  bash .agents/skills/add-menu/scripts/prepare-image.sh <源图> "<文件名>" -o src/assets/images/<包前缀> -q 88
  ```

  带文字的说明图/牌面用更高质量 `-q 88`；源图长边未超 1920 时不会被缩放，读得清、体积仍在几百 KB 级。
- 最小骨架（空白布局、无持久化、内容待开发）：

```vue
<script setup>
import { usePageReady } from '@/composables/usePageReady'

usePageReady()
</script>

<template>
  <div class="xia-hou-yuan-shen-su"></div>
</template>

<style scoped lang="less">
.xia-hou-yuan-shen-su {
  /* #app 是 overflow: hidden 的固定高度壳，内容超一屏时自建滚动容器 */
  height: 100%;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}
</style>
```

- **页面主内容是图片**（牌面 / 立绘 / 流程板 / 长图说明）时，**用现成的 `@/ui/ImageFigure`，不要手写 `<img>`**：
  一张图 = 一个 `<ImageFigure>`，铺满容器宽度、等比缩放 —— 永不裁切、永不拉伸；自身无内边距 / 边框 / 圆角。
  它**只管一张图，不管一组图**：不自建滚动容器、不画列表，多图怎么排、间距多大、谁跟谁一组，全由页面自己叠；
  滚动与居中也在页面。仓库现有页面清一色是这一个组件的不同排法，**没有多图专用组件**。

  **单图（最常见：一页就一张牌面）** —— 参考 `src/pages/ol/GuanSuoZhengNan/Index.vue`：

```vue
<script setup>
import { usePageReady } from '@/composables/usePageReady'
import ImageFigure from '@/ui/ImageFigure/Index.vue'
import bannerUrl from '@/assets/images/<包前缀>/<文件名>.webp'

// 空白布局页面：无装饰、无教学导览、无持久化数据
usePageReady()
</script>

<template>
  <div class="<页面根类名>">
    <ImageFigure
      class="<页面根类名>__figure"
      :src="bannerUrl"
      alt="<图是什么>"
    />
  </div>
</template>

<style scoped lang="less">
.<页面根类名> {
  /* 图片页同样要自建滚动容器：#app 是 overflow: hidden 的固定高度壳 */
  display: flex;
  flex-direction: column;
  height: 100%;
  /* 页边距：左右 = --content-padding（设计系统页面左右留白）；
     上下 = --space-4（16px，标准 padding）叠加刘海屏 / 底部指示条安全区 */
  padding:
    calc(var(--safe-area-top) + var(--space-4))
    var(--content-padding)
    calc(var(--safe-area-bottom) + var(--space-4));
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

/* 一张图独自成页：放得下就整屏居中 —— margin: auto 在内容溢出时自动归零，
   不像 justify-content: center 那样把图的顶部裁掉；放不下就整页滚 */
.<页面根类名>__figure {
  margin: auto;
}
</style>
```

  **多图** —— 叠几个 `<ImageFigure>`，间距由页面给（图多必超一屏，页面根元素照样是那个滚动容器）。
  参考 `src/pages/jsrg/GuoJia/Index.vue`（立绘 + 牌面两张）：

```vue
<template>
  <div class="<页面根类名>">
    <ImageFigure
      class="<页面根类名>__figure"
      :src="shenSuUrl"
      alt="神速"
    />
    <ImageFigure
      class="<页面根类名>__figure"
      :src="paiMianUrl"
      alt="洞烛先机"
    />
  </div>
</template>

<style scoped lang="less">
.<页面根类名> {
  height: 100%;
  /* 页边距同上：左右 --content-padding + 上下 --space-4 叠加安全区 */
  padding:
    calc(var(--safe-area-top) + var(--space-4))
    var(--content-padding)
    calc(var(--safe-area-bottom) + var(--space-4));
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

/* 图间距也是页面的事：相邻两张之间垫一段标准块间距 */
.<页面根类名>__figure + .<页面根类名>__figure {
  margin-top: var(--space-4);
}
</style>
```

  **图下要带说明**（可选；不给就不渲染说明区，图下不留空位）—— 两种喂法二选一：
  `:caption="'一句话'"` 给纯文本，或用默认插槽塞正文块（`<ImageFigure>` 里放 `<MdViewer>`，
  参考 `src/pages/jsrg/GuoJia/Index.vue` 的第二张图）。完整契约见
  `src/ui/ImageFigure/Index.vue` 顶部注释与同目录 `Index.test.js`。

- **页面主内容是 Markdown 正文**（规则、说明、FAQ 这类长文）时：正文放 `src/assets/md/<id>.md`，页面用 `@/ui/MdViewer` 渲染，并在注册表条目里写 `docs: ['<id>']`（id = 文件名不含扩展名）；只画合并文档里的一节，就写 `docs: [{ id, heading }]` 并在页面侧用 `extractMarkdownSection` 取节（见第 2 步 `docs` 字段说明）。
  `MdViewer` 不自建滚动容器，**滚动交给页面**，所以页面根元素要是那个滚动容器（同时也是全局搜索跳转落地的定位范围）：

```vue
<script setup>
import { ref } from 'vue'
import MdViewer from '@/ui/MdViewer/Index.vue'
import { usePageReady } from '@/composables/usePageReady'
import { useKeywordHighlight } from '@/composables/useKeywordHighlight'
// 正文随包发布：?raw 静态导入，无需请求、离线可用、改文件即热更
import rulesMd from '@/assets/md/<id>.md?raw'

usePageReady()

// 全局搜索点中本文档某一行时会带 query 跳过来，靠它滚动 + 高亮到那一行
const pageRef = ref(null)
useKeywordHighlight(pageRef)
</script>

<template>
  <div ref="pageRef" class="page">
    <MdViewer :content="rulesMd" />
  </div>
</template>

<style scoped lang="less">
.page {
  height: 100%;
  padding:
    calc(var(--safe-area-top) + var(--space-4))
    var(--content-padding)
    calc(var(--safe-area-bottom) + var(--space-4));
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}
</style>
```

  三处连带关系，缺一不可：① `src/assets/md/*.md` 会被 `@/assets/md/index.js` 自动收录进全局搜索索引；② 注册表的 `docs` 决定这些文档行跳到哪个路由（不写就只能搜、点不动）；③ 页面里的 `useKeywordHighlight(pageRef)` 负责落地时滚动 + 高亮，**ref 必须挂在滚动容器上**。

  落地「认人」靠的是**块标题 + 块内第几处**（URL 上的 `section` / `hit`，由引擎按 `.md` 算好）：同一页里同一句话出现几次也指得准，页面**不需要**为此加任何标记 —— 块标题就是 Markdown 里那一节的标题。两条推论：一页里多份正文各自成块时，**节标题不要重名**（重名会认错块）；把节的标题从正文里切掉再渲染（例如只喂正文给 `MdViewer`），落地就只能退回「整页第一处」。

- 需要持久化时（此时才引入 store，key 用路由全路径）：

```js
import { useRoute } from 'vue-router'
import { useLocalStorage } from '@/stores/localStorage'
const route = useRoute()
const ls = useLocalStorage()
ls.load(route.fullPath, { qty: 0 })   // 读 ls.pageData.qty
```

- 想要教程：在 `tourKeys.js` 加 key、`tourSteps.js` 加步骤（`element` 必填，用目标元素的 id），再在注册表条目写 `tourKey: TourKeys.XXX`。

## 4. 版本号

`menus.js` 注册表变更会影响持久化数据 → `package.json` 的 `version` **patch +1**（如 `0.1.7` → `0.1.8`），与本次改动同一次提交。`useVersionCheck` 首屏比对版本号，不一致即清空 localStorage。`package-lock.json` 早已与 package.json 脱节，**不要动**。

## 5. 陷阱

- **别对 `src/pages`、`src/components` 下的文件跑 `prettier --write`**：仓库真实风格是无分号、`<script>` 顶格，而 `.prettierrc.json` 要求 `semi: true` + `vueIndentScriptAndStyle: true`，全量格式化会产生整文件噪声。`src/constants/*` 是带分号风格且符合 prettier。
- `BlankLayout` 只有 `<slot />`，无背景无装饰；导航依赖 `App.vue` 全局挂载的悬浮控件（GlobalControls），页面本身不需要返回按钮。
- 主页卡片按「最近访问」重排（`localStorage['/']`），新菜单默认排在最后一张。
- 卡片渲染窗口是当前索引 ±5 张，菜单超过 11 个时新条目不会立刻出现在 DOM 里。
- 图片文件名含中文，`git status` 会显示为转义八进制，属正常。
- `docs` 里的 id 必须与 `src/assets/md/` 下的**文件名逐字一致**（不含扩展名）。写错不会报任何错，只会让那份文档的搜索结果变成灰行、标题显示文件名、点击弹「该文档暂未挂到任何菜单」—— 排查时先比对 `ls src/assets/md/`。
- `docs` 的 `heading` 同理，必须与 `.md` 里的**标题行文字逐字一致**（不含 `#` 号；行内标记会被剥掉再比）。写错时认领落空：该节的搜索行照样能搜到，但变灰不可点；页面上 `extractMarkdownSection` 返回空串，`MdViewer` 显示空态文案。`src/components/GlobalSearch/engine.test.js` 用两个真实菜单把「哪一节跳哪个路由」钉住了，改认领后跑 `npm test`。
