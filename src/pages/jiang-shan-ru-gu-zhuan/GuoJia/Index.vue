<script setup>
import { usePageReady } from '@/composables/usePageReady'
import ImageGallery from '@/ui/ImageGallery/Index.vue'
import shenSuUrl from '@/assets/images/jiang-shan-ru-gu-zhuan/神速.webp'
import dongZhuXianJiUrl from '@/assets/images/jiang-shan-ru-gu-zhuan/洞烛先机.webp'

// 空白布局页面：无装饰、无教学导览、无持久化数据
usePageReady()

// 合并自原「夏侯渊 神速」与「洞烛先机」两个菜单：先立绘、后牌面
const images = [
  { src: shenSuUrl, alt: '神速' },
  { src: dongZhuXianJiUrl, alt: '洞烛先机' },
]
</script>

<template>
  <div class="guo-jia">
    <ImageGallery :images="images" />
  </div>
</template>

<style scoped lang="less">
.guo-jia {
  /* #app 为固定高度壳，滚动在 ImageGallery 内部完成，故这里只做裁剪 */
  height: 100%;
  /* 页边距：左右 = --content-padding（设计系统页面左右留白）；
     上下 = --space-4（16px，标准 padding）叠加刘海屏 / 底部指示条安全区 */
  padding:
    calc(var(--safe-area-top) + var(--space-4))
    var(--content-padding)
    calc(var(--safe-area-bottom) + var(--space-4));
  overflow: hidden;
}
</style>
