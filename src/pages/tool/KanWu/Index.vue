<script setup>
import { ref } from 'vue'
import { usePageReady } from '@/composables/usePageReady'
import { useKeywordHighlight } from '@/composables/useKeywordHighlight'
import { extractMarkdownSection } from '@/utils/markdown'
import ImageFigure from '@/ui/ImageFigure/Index.vue'
import MdViewer from '@/ui/MdViewer/Index.vue'
// 勘误正文随包发布：?raw 静态导入，无需请求、离线可用、改文件即热更
import kanWuMd from '@/assets/md/kan-wu.md?raw'
import xuShiUrl from '@/assets/images/tool/将星-徐氏-节义双全.webp'
import jieXuShengUrl from '@/assets/images/tool/手杀-界徐盛.webp'
import shenLuSuUrl from '@/assets/images/tool/手杀-神鲁肃.webp'

/**
 * 勘误条目 —— 一处错处一条：图是被订正的那张牌，图下那行字取正文里自己那一节。
 *
 * 版式与游戏牌各页一致：一张图挂自己那一节的正文（一节一条）。
 * 新增一条：图按约定转成 webp 放进 src/assets/images/tool/，在 kan-wu.md 里加一节，
 * 再往下面某个分类的数组里追加一条，并同步在 menus.js 的 docs 里认领这一节 ——
 * 漏认领则搜得到、点不进。
 */
const wuJiangErrata = [
  {
    src: xuShiUrl,
    alt: '将星 徐氏',
    info: extractMarkdownSection(kanWuMd, '将星徐氏'),
  },
  // 原斗地主页「模式专属武将技能」里的替换武将，整体并入本类
  {
    src: jieXuShengUrl,
    alt: '界徐盛',
    info: extractMarkdownSection(kanWuMd, '界徐盛'),
  },
  {
    src: shenLuSuUrl,
    alt: '神鲁肃',
    info: extractMarkdownSection(kanWuMd, '神鲁肃'),
  },
]

/** 游戏牌勘误 —— 记法与武将一致 */
const youXiPaiErrata = []

/** 两类固定这个次序 */
const sections = [
  { title: '武将', items: wuJiangErrata },
  { title: '游戏牌', items: youXiPaiErrata },
]

// 空白布局页面：无装饰、无教学导览、无持久化数据
usePageReady()

// 全局搜索跳转落地：按 URL 上的 keyword 在正文里滚动并高亮
const pageRef = ref(null)
useKeywordHighlight(pageRef)
</script>

<template>
  <div
    ref="pageRef"
    class="kan-wu"
  >
    <h1 class="kan-wu__title">
      勘误
    </h1>

    <section
      v-for="section in sections"
      :key="section.title"
      class="kan-wu__section"
    >
      <h2 class="kan-wu__section-title">
        {{ section.title }}
      </h2>

      <template v-if="section.items.length">
        <ImageFigure
          v-for="item in section.items"
          :key="item.alt"
          class="kan-wu__figure"
          :src="item.src"
          :alt="item.alt"
        >
          <MdViewer :content="item.info" />
        </ImageFigure>
      </template>

      <p
        v-else
        class="kan-wu__empty"
      >
        暂无
      </p>
    </section>
  </div>
</template>

<style scoped lang="less">
.kan-wu {
  /* #app 是 overflow: hidden 的固定高度壳，内容超一屏时自建滚动容器 */
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

/* 抬头沿用正文一级标题的排面（毛笔字 + 居中 + 编绳金线） */
.kan-wu__title {
  max-width: 34em;
  margin: 0 auto var(--space-6);
  font-family: var(--font-display);
  /* Ma Shan Zheng 只有 400，加粗只会得到伪粗体 */
  font-weight: var(--font-normal);
  font-size: var(--text-3xl);
  line-height: var(--leading-tight);
  text-align: center;
  text-wrap: var(--text-wrap-heading);
}

.kan-wu__title::after {
  content: '';
  display: block;
  width: 60%;
  height: var(--border-medium);
  margin: var(--space-4) auto 0;
  background: var(--decorative-line);
}

/* 每一类各成一块，与抬头同栏宽 */
.kan-wu__section {
  max-width: 34em;
  margin: var(--space-8) auto 0;
}

/* 分类标题：毛笔字 + 左侧编绳金线，比抬头低一级 */
.kan-wu__section-title {
  margin: 0 0 var(--space-4);
  padding-left: var(--space-3);
  border-left: var(--border-medium) solid var(--accent-gold);
  font-family: var(--font-display);
  font-weight: var(--font-normal);
  font-size: var(--text-2xl);
  line-height: var(--leading-tight);
  text-wrap: var(--text-wrap-heading);
}

/* 该类还没有勘误条目时的占位，不抢眼 */
.kan-wu__empty {
  margin: 0;
  color: var(--text-secondary);
}

/* 一条一块：间距由页面给（ImageFigure 只管一张图） */
.kan-wu__figure + .kan-wu__figure {
  margin-top: var(--space-6);
}
</style>
