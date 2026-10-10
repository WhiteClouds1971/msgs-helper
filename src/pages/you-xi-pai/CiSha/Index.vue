<script setup>
import { ref } from 'vue'
import { usePageReady } from '@/composables/usePageReady'
import { useKeywordHighlight } from '@/composables/useKeywordHighlight'
import { extractMarkdownSection } from '@/utils/markdown'
import ImageFigure from '@/ui/ImageFigure/Index.vue'
import MdViewer from '@/ui/MdViewer/Index.vue'
import ciShaUrl from '@/assets/images/you-xi-pai/CiSha/游戏牌-刺杀-.webp'
// 规则正文随包发布：?raw 静态导入，无需请求、离线可用、改文件即热更
import youXiPaiMd from '@/assets/md/you-xi-pai.md?raw'

// 游戏牌说明合并成一篇，本页只取自己那一节（别的牌归别的页面）
const ciShaMd = extractMarkdownSection(youXiPaiMd, '刺杀')

// 空白布局页面：无装饰、无教学导览、无持久化数据
usePageReady()

// 全局搜索跳转落地：按 URL 上的 keyword 在正文里滚动并高亮
const pageRef = ref(null)
useKeywordHighlight(pageRef)
</script>

<template>
  <div
    ref="pageRef"
    class="ci-sha"
  >
    <!-- 牌面自带说明区域：刺杀的规则正文就挂在这张图下 -->
    <ImageFigure
      class="ci-sha__figure"
      :src="ciShaUrl"
      alt="刺杀"
    >
      <MdViewer :content="ciShaMd" />
    </ImageFigure>
  </div>
</template>

<style scoped lang="less">
.ci-sha {
  /* 单图独自成页：放得下就整屏居中 —— margin: auto 在内容溢出时自动归零，
     不像 justify-content: center 那样把图的顶部裁掉；放不下就整页滚 */
  display: flex;
  flex-direction: column;
  /* #app 为固定高度壳：滚动容器建在页面根元素上 */
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

.ci-sha__figure {
  margin: auto;
}
</style>
