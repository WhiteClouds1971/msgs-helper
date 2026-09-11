---
name: add-menu
description: 在面杀辅助工具 (msgs-helper) 中新增一个菜单/工具卡片：转换并重命名图片资源（卡片封面、页面内容图）、在 menus.js 注册表追加条目、创建页面（含 ImageGallery 图片页模板）、选择布局与教学导览、升级版本号，并在浏览器中验证。Use when adding, registering, or creating a new menu, tool entry, or home card in this project.
whenToUse: 用户说「添加一个菜单 / 新增工具 / 加一张卡片 / 让某个武将或玩法出现在主页」时；或需要调整已有菜单的注册表字段（标题、路由、分类、布局、封面）时。
---

# 新增菜单（msgs-helper）

菜单 = 主页卡片 + 路由 + 页面，由 `src/constants/menus.js` 单一事实源驱动。
路由、卡片、页面入口全部自动生成，**通常只需改 menus.js + 新增页面文件**。

## 0. 先定这 7 件事

| 项 | 注册表字段 | 默认 / 取法 |
|---|---|---|
| 标题 | `name` | 用户给定的中文名，如 `夏侯渊 神速` |
| 签题分类 | `packageName` | 卡片上「签」与「题」之间的标签；现有 `工具/OL/十周年/M/大旗`，无合适项就在 `PackageName` 枚举里加一条 |
| 代号 | `code` | 标题转拼音 kebab-case，如 `xia-hou-yuan-shen-su`；全局唯一 |
| 路由 | `route` | `/<包前缀>/<code>`，包前缀与 packageName 对应（如 大旗 → `/da-qi/`） |
| 页面目录 | `component` | `@/pages/<包前缀>/<PascalCase>/Index.vue`，与路由同构 |
| 布局 | `layout` | 默认 `MenuLayout.BACKGROUND`；纯内容页/无装饰页用 `MenuLayout.BLANK` |
| 封面图 | `image` | 用户给的图片路径；命名与 focal 见第 1 步 |

另需问清（决定第 2、3 步的写法）：
- **要不要教程**：要 → 加 `tourKey`（并在 `tourKeys.js`/`tourSteps.js` 注册）；不要 → **不写该字段**，控制台「教学导览」会自动提示「本页面暂无教学导览」。
- **要不要持久化数据**：要 → 页面里用 `useLocalStorage`；不要 → 页面不引入该 store，控制台「清除本页数据」会自动提示「本页面暂无持久化数据」（`clearPage` 返回 false）。
- **页面主内容是什么形态**：图片为主 → 用现成的 `@/ui/ImageGallery`（第 3 步有模板）；内容待开发 → 空壳骨架；有交互 → 按需写。

主题色 `themeColor` 从 `ThemeColor` 枚举里挑一个贴合封面主色调的；`orientation` 现有条目统一为 `'vertical'`。

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
  // 无教程：不写 tourKey
  layout: MenuLayout.BLANK,
  orientation: 'vertical',
},
```

枚举都在同文件顶部（`PackageName` / `MenuLayout` / `ThemeColor`），缺项就在枚举里补一条，不要在条目里写字面量。注意该文件是**带分号**风格。

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

- **页面主内容是图片**（牌面 / 流程板 / 长图说明）时，**用现成的 `@/ui/ImageGallery`，不要手写 img + flex**：
  它负责完整展示（只等比缩放、永不裁切），逐张铺满容器宽度、纵向排列 —— 一屏放不下就纵向滚动，
  放得下则整组居中；自身无内边距 / 边框 / 圆角，**默认只放图、不加任何叠加物**。

```vue
<script setup>
import { usePageReady } from '@/composables/usePageReady'
import ImageGallery from '@/ui/ImageGallery/Index.vue'
import bannerUrl from '@/assets/images/<包前缀>/<文件名>.webp'

usePageReady()

// 只放图；多图就继续往数组里加 { src, alt }（逐张铺满宽度、纵向滑动）
const images = [{ src: bannerUrl, alt: '<描述>' }]
</script>

<template>
  <div class="page">
    <ImageGallery :images="images" />
  </div>
</template>

<style scoped lang="less">
.page {
  height: 100%;
  overflow: hidden;   /* 排布与滚动都在 ImageGallery 内完成；要让图片四周留白就自己加 padding */
}
</style>
```

  常用 props：`gap`（图间距，CSS 长度，默认 `var(--space-2)`）；完整契约见
  `src/ui/ImageGallery/Index.vue` 顶部注释与同目录 `Index.test.js`。

  图片页的页面根元素写 `height: 100%; overflow: hidden` 即可 —— 排布与滚动都在组件内完成，页面不要再套一层滚动容器。

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

## 5. 验证（都要做）

1. `npx eslint <改动文件>` — 无新增问题即可。仓库存量 2 个 `no-empty` 报错来自 `useTheme.js` / `localStorage.js`，与本次无关。
2. `npm test`（vitest）— 改动 `src/ui/ImageGallery` 时必跑。
3. `npm run build` — 确认新图片作为产物 webp 生成、动态 import 路径可解析。
4. 浏览器实测（dev server 端口 9456，用户通常在跑）：见 [references/browser-verify.md](references/browser-verify.md)，
   含两段可直跑的程序 —— 主页卡片（合成 touch 事件滑到新卡片 → 读标签与封面 → 点击跳转）与
   图片页（不裁切 / 铺满宽度 / 框内零空白 / 滚动条已隐藏 / 零报错）。

## 6. 陷阱

- **别对 `src/pages`、`src/components` 下的文件跑 `prettier --write`**：仓库真实风格是无分号、`<script>` 顶格，而 `.prettierrc.json` 要求 `semi: true` + `vueIndentScriptAndStyle: true`，全量格式化会产生整文件噪声。`src/constants/*` 是带分号风格且符合 prettier。
- `BlankLayout` 只有 `<slot />`，无背景无装饰；导航依赖 `App.vue` 全局挂载的悬浮控件（GlobalControls），页面本身不需要返回按钮。
- 主页卡片按「最近访问」重排（`localStorage['/']`），新菜单默认排在最后一张，验证时要先滑过去。
- 卡片渲染窗口是当前索引 ±5 张，菜单超过 11 个时新条目不会立刻出现在 DOM 里。
- 图片文件名含中文，`git status` 会显示为转义八进制，属正常。
