---
name: add-menu
description: 在面杀辅助工具 (msgs-helper) 中新增一个菜单/工具卡片：转换并重命名图片资源（卡片封面、页面内容图）、在 menus.js 注册表追加条目（含全局搜索用的 tags / docs 字段）、创建页面（ImageFigure 图片页、MdViewer 文档页模板）、选择布局与教学导览、升级版本号。Use when adding, registering, or creating a new menu, tool entry, or home card in this project.
whenToUse: 用户说「添加一个菜单 / 新增工具 / 加一张卡片 / 让某个武将或玩法出现在主页」时；或需要调整已有菜单的注册表字段（标题、路由、分类、布局、封面、检索标签、关联文档）时。
---

# 新增菜单（msgs-helper）

菜单 = 主页卡片 + 路由 + 页面，由 `src/constants/menus.js` 单一事实源驱动；路由、卡片、页面入口全部自动生成。
**通常只需改 menus.js + 新增页面文件 + 升版本号。不改其他任何文件。**

本技能**不做任何验证或测试**：不跑 eslint / vitest / build，不启动浏览器，不读无关源码、不探索目录结构。改完即收工。

## 0. 先定这 7 件事

| 项 | 字段 | 取法 |
|---|---|---|
| 标题 | `name` | 用户给的中文名，如 `夏侯渊 神速` |
| 分类 | `packageName` | 枚举 `PackageName`，现有 `工具/OL/十周年/M/大旗`；无合适项就在枚举加一条 |
| 代号 | `code` | 标题转拼音 kebab-case，全局唯一，如 `xia-hou-yuan-shen-su` |
| 路由 | `route` | `/<包前缀>/<code>` |
| 页面 | `component` | `() => import('@/pages/<包前缀>/<PascalCase>/Index.vue')` |
| 布局 | `layout` | 默认 `MenuLayout.BACKGROUND`；纯内容页用 `MenuLayout.BLANK` |
| 封面 | `image` | 见第 1 步 |

包前缀 = 枚举 key 的 kebab-case 小写：`TOOL→tool`、`DA_QI→da-qi`、`OL→ol`、`ANNIVERSARY→anniversary`、`MOBILE→mobile`、`JXTP→jxtp`、`SHZL→shzl`、`YJCM→yjcm`、`JX→jx`、`JSRG→jsrg`。**目录即分类**（按 packageName 归档，不按图片来源）。
`themeColor` 取 `ThemeColor` 里贴合封面主色的；`orientation` 一律 `'vertical'`。

另需定：**要不要教程**（要 → 加 `tourKey` 并在 `tourKeys.js`/`tourSteps.js` 注册；不要 → 不写该字段）、**要不要持久化**（要 → 页面用 `useLocalStorage`，key 用路由全路径；不要 → 不引入 store）、**页面主内容形态**（图片 / Markdown / 空壳 / 交互）。

### 两个只喂全局搜索的可选字段

| 字段 | 作用 | 何时写 |
|---|---|---|
| `tags` | 补充检索词（汉字 / 全拼 / 首字母三路匹配），也显示在结果行 | 菜单名之外还有常用叫法时，如 `['规则', '约定']`；没有就省略 |
| `docs` | 本页用 MdViewer 渲染的 Markdown：整篇写 id（`src/assets/md/` 下文件名，不含扩展名），只画一节写 `{ id, heading }` | 页面用 `MdViewer` 时**必写**；纯图片页 / 空壳页不写 |

不写 `docs` 会**静默降级**：文档照样能搜到，但结果行变灰不可点、标题退化成文件名、点击弹「该文档暂未挂到任何菜单」。
一份文档可被多个菜单认领（先声明的生效），一个菜单可挂多份（`docs: ['a', 'b']`）。合并文档各页**按节认领且不重叠**：注册表 `docs: [{ id: 'you-xi-pai', heading: '趁火打劫' }]`，页面用 `extractMarkdownSection(raw, '趁火打劫')` 取节。

## 1. 封面图

1. 重命名格式 `<出处/皮肤名>-<武将>[-静态].webp`（如 `大旗-夏侯渊-神速.webp`），**不要保留原始哈希文件名**。
2. 转换 + 归档（源码图常是数 MB 的 jpg，必须转 webp 并缩到同量级 120–380 KB）：

   ```bash
   bash .agents/skills/add-menu/scripts/prepare-image.sh <源图片> "<文件名不带扩展名>"
   ```

   脚本用 `cwebp -q 82` 把长边缩到 1920（只缩不放），输出到 `src/assets/images/menus/`，并打印可直接粘贴的 `image.src` 行；同名文件会拒绝覆盖。选项：`-f` 覆盖、`-o <目录>`、`-q <质量>`、`-e <长边上限>`（`--help`）。
3. `focalX`/`focalY`（`HomePageCard.vue` 的 `object-position` 裁切）：看不到图就先 `50/50`；需要估计时用显著性兴趣质心（PIL）：

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

**关键约束**：`image.src` 必须是 `src/assets/images/menus/<文件名>`，中文文件名与磁盘文件**逐字一致**（卡片按路径末段 glob 匹配，写错只会静默显示「图片加载失败」）；`fit` 固定 `'cover'`。

页面内容图（非封面）放 `src/assets/images/<包前缀>/`，同样走脚本、加 `-o src/assets/images/<包前缀>`，带文字的图用 `-q 88`。

## 2. 在 menus.js 追加条目

`src/constants/menus.js` 的数组顺序即默认排序，**追加到末尾**；枚举在同文件顶部，缺项在枚举里补，不在条目里写字面量。该文件是**带分号**风格。

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
  tags: ['神速', '大旗'],          // 可选：补充检索标签
  // docs: ['cun-gui'],           // 仅当本页用 MdViewer 渲染 .md 时写
  // tourKey: TourKeys.XXX,       // 无教程就不写
  layout: MenuLayout.BLANK,
  orientation: 'vertical',
},
```

别为了「整齐」给所有条目补 `docs`：它表达的是「这个页面确实渲染了那份 .md」，写错等于指错路。

## 3. 页面

新建 `src/pages/<包前缀>/<PascalCase>/Index.vue`（路由无需手写，`src/pages/index.js` 遍历注册表生成）。**每个页面必须调用 `usePageReady()`**，否则 SplashScreen 永不解除。

`#app` 是 `overflow: hidden` 的固定高度壳，文档本身不滚动 —— 页面根元素自建滚动容器，样式统一：

```less
.page {
  height: 100%;          /* 不要 min-height，否则只被裁剪 */
  padding:
    calc(var(--safe-area-top) + var(--space-4))
    var(--content-padding)
    calc(var(--safe-area-bottom) + var(--space-4));
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}
```

样式一律走 token，色彩/间距不硬编码。

**A. 图片页**（牌面 / 立绘 / 流程板 / 长图）—— 用现成的 `@/ui/ImageFigure`，**不要手写 `<img>`**：一张图 = 一个组件，铺满容器宽度、等比缩放，永不裁切拉伸。它只管一张图，多图怎么排、间距多大全由页面叠，没有多图专用组件。

```vue
<script setup>
import { usePageReady } from '@/composables/usePageReady'
import ImageFigure from '@/ui/ImageFigure/Index.vue'
import bannerUrl from '@/assets/images/<包前缀>/<文件名>.webp'

usePageReady()
</script>

<template>
  <div class="page">
    <ImageFigure class="page__figure" :src="bannerUrl" alt="<图是什么>" />
  </div>
</template>

<style scoped lang="less">
.page { /* 上面那段滚动容器样式 */ }
/* 单图独自成页：放得下整屏居中，放不下整页滚。
   margin: auto 在溢出时自动归零，不像 justify-content: center 会裁掉顶部 */
.page { display: flex; flex-direction: column; }
.page__figure { margin: auto; }
/* 多图：去掉上面的 flex 两行，改为相邻图垫一段间距 */
// .page__figure + .page__figure { margin-top: var(--space-4); }
</style>
```

图下可选说明（不给就不渲染、不留空位）：`:caption="'一句话'"` 给纯文本，或用默认插槽塞内容（如 `<MdViewer>`）。参考 `src/pages/ol/GuanSuoZhengNan/Index.vue`（单图）、`src/pages/jsrg/GuoJia/Index.vue`（多图 + 说明）。

**B. Markdown 页**（规则 / 说明 / FAQ）—— 正文放 `src/assets/md/<id>.md`，页面用 `@/ui/MdViewer`，并在注册表写 `docs`。`MdViewer` 不自建滚动容器，滚动交给页面根元素（同时是搜索落地定位范围）：

```vue
<script setup>
import { ref } from 'vue'
import MdViewer from '@/ui/MdViewer/Index.vue'
import { usePageReady } from '@/composables/usePageReady'
import { useKeywordHighlight } from '@/composables/useKeywordHighlight'
import rulesMd from '@/assets/md/<id>.md?raw'   // ?raw 静态导入：无请求、离线可用、改文件即热更

usePageReady()

const pageRef = ref(null)
useKeywordHighlight(pageRef)   // 搜索跳转落地时滚动 + 高亮
</script>

<template>
  <div ref="pageRef" class="page">
    <MdViewer :content="rulesMd" />
  </div>
</template>
```

合并文档只画一节：`import { extractMarkdownSection } from '@/utils/markdown'` 切出本节再喂 `MdViewer`。
三处连带缺一不可：① `src/assets/md/*.md` 被 `@/assets/md/index.js` 自动收录进搜索索引；② 注册表 `docs` 决定文档行跳哪个路由；③ 页面 `useKeywordHighlight(pageRef)`，**ref 必须挂在滚动容器上**。
落地按「块标题 + 块内第几处」认人，页面无需加标记；一页多份正文时**节标题不要重名**，切节时别把标题行丢掉（丢了只能退回整页第一处）。

**C. 空壳页**（内容待开发）：`<div class="page"></div>` + 上面的滚动容器样式即可。
**交互 / 持久化**：按需写；持久化用 `useLocalStorage`：

```js
import { useRoute } from 'vue-router'
import { useLocalStorage } from '@/stores/localStorage'
const route = useRoute()
const ls = useLocalStorage()
ls.load(route.fullPath, { qty: 0 })   // 读 ls.pageData.qty
```

**教程**：`tourKeys.js` 加 key、`tourSteps.js` 加步骤（`element` 必填，用目标元素 id），再在注册表写 `tourKey`。

## 4. 版本号

`package.json` 的 `version` **patch +1**（`0.1.7` → `0.1.8`），与本次改动同一次提交。`package-lock.json` 早已脱节，**不要动**。

## 5. 陷阱

- **别对 `src/pages`、`src/components` 下文件跑 `prettier --write`**：仓库真实风格无分号、`<script>` 顶格，而 `.prettierrc.json` 要求 `semi: true` + `vueIndentScriptAndStyle: true`，全量格式化产生整文件噪声。`src/constants/*` 是带分号风格且符合 prettier。
- `BlankLayout` 只有 `<slot />`；导航靠 `App.vue` 全局挂的 GlobalControls，页面不需要返回按钮。
- 主页卡片按最近访问重排，新菜单默认排最后；卡片渲染窗口是当前索引 ±5 张，菜单超 11 个时新条目不会立刻进 DOM。
- 图片名含中文，`git status` 显示转义八进制属正常。
- `docs` 的 id 与 `heading` 必须与 `src/assets/md/` 文件名 / `.md` 标题行文字**逐字一致**（不含扩展名与 `#`）。写错不报错，只表现为搜索行变灰、`extractMarkdownSection` 返回空串、`MdViewer` 显示空态 —— 排查先比对 `ls src/assets/md/`。
