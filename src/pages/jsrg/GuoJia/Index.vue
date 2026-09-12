<script setup>
import { ref } from 'vue'
import { usePageReady } from '@/composables/usePageReady'
import { useKeywordHighlight } from '@/composables/useKeywordHighlight'
import ImageFigure from '@/ui/ImageFigure/Index.vue'
import MdViewer from '@/ui/MdViewer/Index.vue'
import shenSuUrl from '@/assets/images/jsrg/神速.webp'
import dongZhuXianJiUrl from '@/assets/images/jsrg/洞烛先机.webp'
// 规则正文随包发布：?raw 静态导入，无需请求、离线可用、改文件即热更
import dongZhuXianJiMd from '@/assets/md/dong-zhu-xian-ji.md?raw'

// 空白布局页面：无装饰、无教学导览、无持久化数据
usePageReady()

// 全局搜索跳转落地：按 URL 上的 keyword 在正文里滚动并高亮
const pageRef = ref(null)
useKeywordHighlight(pageRef)
</script>

<template>
  <div
    ref="pageRef"
    class="guo-jia"
  >
    <!-- 合并自原「夏侯渊 神速」与「洞烛先机」两个菜单：先立绘、后牌面 -->
    <ImageFigure
      class="guo-jia__figure"
      :src="shenSuUrl"
      alt="神速"
    />

    <!-- 牌面自带说明区域：洞烛先机的规则正文就挂在这张图下 -->
    <ImageFigure
      class="guo-jia__figure"
      :src="dongZhuXianJiUrl"
      alt="洞烛先机"
    >
      <MdViewer :content="dongZhuXianJiMd" />
    </ImageFigure>
  </div>
</template>

<style scoped lang="less">
.guo-jia {
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

/* 两张图之间的间距 —— 多图排布归页面管，间距也由页面给。
   立绘与牌面是两张独立的图，各自带留白，间距按设计系统的标准块间距给就够了 */
.guo-jia__figure + .guo-jia__figure {
  margin-top: var(--space-4);
}
</style>
