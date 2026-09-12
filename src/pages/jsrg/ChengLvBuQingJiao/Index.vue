<script setup>
import { ref } from 'vue'
import { usePageReady } from '@/composables/usePageReady'
import { useKeywordHighlight } from '@/composables/useKeywordHighlight'
import { extractMarkdownSection } from '@/utils/markdown'
import ImageFigure from '@/ui/ImageFigure/Index.vue'
import MdViewer from '@/ui/MdViewer/Index.vue'
import tuiXinZhiFuUrl from '@/assets/images/jsrg/推心置腹.webp'
import chenHuoDaJieUrl from '@/assets/images/jsrg/趁火打劫.webp'
// 规则正文随包发布：?raw 静态导入，无需请求、离线可用、改文件即热更
import youXiPaiMd from '@/assets/md/you-xi-pai.md?raw'

// 游戏牌说明合并成一篇，本页取自己这两节（别的牌归别的页面）
const tuiXinZhiFuMd = extractMarkdownSection(youXiPaiMd, '推心置腹')
const chenHuoDaJieMd = extractMarkdownSection(youXiPaiMd, '趁火打劫')

// 空白布局页面：无装饰、无教学导览、无持久化数据
usePageReady()

// 全局搜索跳转落地：按 URL 上的 keyword 在正文里滚动并高亮
const pageRef = ref(null)
useKeywordHighlight(pageRef)
</script>

<template>
  <div
    ref="pageRef"
    class="cheng-lv-bu-qing-jiao"
  >
    <!-- 两张牌面：说明区域各自挂在自己那张图下，先推心置腹、后趁火打劫 -->
    <ImageFigure
      class="cheng-lv-bu-qing-jiao__figure"
      :src="tuiXinZhiFuUrl"
      alt="推心置腹"
    >
      <MdViewer :content="tuiXinZhiFuMd" />
    </ImageFigure>

    <ImageFigure
      class="cheng-lv-bu-qing-jiao__figure"
      :src="chenHuoDaJieUrl"
      alt="趁火打劫"
    >
      <MdViewer :content="chenHuoDaJieMd" />
    </ImageFigure>
  </div>
</template>

<style scoped lang="less">
.cheng-lv-bu-qing-jiao {
  /* #app 为固定高度壳，图片与正文整页一起滚，滚动容器建在页面根元素上 */
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

/* 两张图之间的间距 —— 多图排布归页面管，间距也由页面给 */
.cheng-lv-bu-qing-jiao__figure + .cheng-lv-bu-qing-jiao__figure {
  margin-top: var(--space-4);
}
</style>
