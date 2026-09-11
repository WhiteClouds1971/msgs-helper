<script setup>
import { ref } from 'vue'
import { usePageReady } from '@/composables/usePageReady'
import { useKeywordHighlight } from '@/composables/useKeywordHighlight'
import ImageGallery from '@/ui/ImageGallery/Index.vue'
import MdViewer from '@/ui/MdViewer/Index.vue'
import shenSuUrl from '@/assets/images/jsrg/神速.webp'
import dongZhuXianJiUrl from '@/assets/images/jsrg/洞烛先机.webp'
// 规则正文随包发布：?raw 静态导入，无需请求、离线可用、改文件即热更
import dongZhuXianJiMd from '@/assets/md/dong-zhu-xian-ji.md?raw'

// 空白布局页面：无装饰、无教学导览、无持久化数据
usePageReady()

// 合并自原「夏侯渊 神速」与「洞烛先机」两个菜单：先立绘、后牌面
const images = [
  { src: shenSuUrl, alt: '神速' },
  { src: dongZhuXianJiUrl, alt: '洞烛先机' },
]

// 全局搜索跳转落地：按 URL 上的 keyword 在正文里滚动并高亮
const pageRef = ref(null)
useKeywordHighlight(pageRef)
</script>

<template>
  <div
    ref="pageRef"
    class="guo-jia"
  >
    <ImageGallery
      class="guo-jia__gallery"
      :images="images"
    />

    <MdViewer
      class="guo-jia__doc"
      :content="dongZhuXianJiMd"
    />
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

/* ImageGallery 自带滚动视口（.gallery 为 height: 100%），本页改为整页统一滚动，
   故把它降级成普通块 —— 否则它先占满一屏并自成滚动区，正文被顶到视口之外。
   选择器缀上 .guo-jia 以压过组件内 .gallery 的同等权重 */
.guo-jia .guo-jia__gallery {
  height: auto;
  overflow: visible;
}

/* 正文与图组之间的区块间距 —— MdViewer 把首元素的上边距归零，间距由页面给 */
.guo-jia__doc {
  margin-top: var(--space-8);
}
</style>
