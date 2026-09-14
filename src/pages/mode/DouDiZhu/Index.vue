<script setup>
import { ref } from 'vue'
import MdViewer from '@/ui/MdViewer/Index.vue'
import ImageFigure from '@/ui/ImageFigure/Index.vue'
import { usePageReady } from '@/composables/usePageReady'
import { useKeywordHighlight } from '@/composables/useKeywordHighlight'
import { extractMarkdownSection } from '@/utils/markdown'
// 正文随包发布：?raw 静态导入，无需请求、离线可用、改文件即热更
import douDiZhuMd from '@/assets/md/dou-di-zhu.md?raw'
import wuJiangMd from '@/assets/md/dou-di-zhu-wu-jiang.md?raw'
import jieXuShengUrl from '@/assets/images/mode/手杀-界徐盛.webp'

/**
 * 模式专属武将技能 —— 本模式下须改用专属技能的武将，逐张列在正文之后。
 * 版式与游戏牌各页一致：图下挂自己那一节正文（一节一张卡）。
 * 新增一张：图按约定转成 webp 放进 src/assets/images/mode/，
 * 在 dou-di-zhu-wu-jiang.md 里加一节，再往本数组追加一条，
 * 并同步在 menus.js 的 docs 里认领这一节 —— 漏认领则搜得到、点不进。
 */
const exclusiveSkills = [
  {
    alt: '界徐盛',
    src: jieXuShengUrl,
    info: extractMarkdownSection(wuJiangMd, '界徐盛'),
  },
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
    class="mode-dou-di-zhu"
  >
    <MdViewer
      class="mode-dou-di-zhu__doc"
      :content="douDiZhuMd"
    />

    <section class="mode-dou-di-zhu__section">
      <h2 class="mode-dou-di-zhu__section-title">
        模式专属武将技能
      </h2>

      <ImageFigure
        v-for="skill in exclusiveSkills"
        :key="skill.alt"
        class="mode-dou-di-zhu__figure"
        :src="skill.src"
        :alt="skill.alt"
      >
        <MdViewer :content="skill.info" />
      </ImageFigure>
    </section>
  </div>
</template>

<style scoped lang="less">
.mode-dou-di-zhu {
  /* #app 是 overflow: hidden 的固定高度壳：滚动改由本页承担 */
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

/* 正文限宽：桌面端不让汉字行宽过长（移动端本就窄，不生效） */
.mode-dou-di-zhu__doc {
  max-width: 34em;
  margin: 0 auto;
}

/* 模式专属武将技能：正文之后另起一块，与正文同一栏宽，居中不跑偏 */
.mode-dou-di-zhu__section {
  max-width: 34em;
  margin: var(--space-12) auto 0;
}

/* 模块标题沿用正文一级标题的排面（毛笔字 + 居中 + 编绳金线）：
   它与顶部的「斗地主」同级，其下的武将名走二级标题，主次分明 */
.mode-dou-di-zhu__section-title {
  margin: 0 0 var(--space-6);
  font-family: var(--font-display);
  /* Ma Shan Zheng 只有 400，加粗只会得到伪粗体 */
  font-weight: var(--font-normal);
  font-size: var(--text-3xl);
  line-height: var(--leading-tight);
  text-align: center;
  text-wrap: var(--text-wrap-heading);
}

.mode-dou-di-zhu__section-title::after {
  content: '';
  display: block;
  width: 60%;
  height: var(--border-medium);
  margin: var(--space-4) auto 0;
  background: var(--decorative-line);
}

/* 每张卡各成一块：间距由页面给（ImageFigure 只管一张图） */
.mode-dou-di-zhu__figure + .mode-dou-di-zhu__figure {
  margin-top: var(--space-6);
}
</style>
