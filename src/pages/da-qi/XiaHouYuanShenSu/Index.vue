<script setup>
import { usePageReady } from '@/composables/usePageReady'
import ImageGallery from '@/ui/ImageGallery/Index.vue'
import bannerUrl from '@/assets/images/da-qi/神速大旗.webp'

// 空白布局页面：无装饰、无教学导览、无持久化数据
usePageReady()

const images = [{ src: bannerUrl, alt: '神速大旗' }]
</script>

<template>
  <div class="xia-hou-yuan-shen-su">
    <ImageGallery :images="images" />
  </div>
</template>

<style scoped lang="less">
.xia-hou-yuan-shen-su {
  /* #app 为固定高度壳，页面自建滚动容器（组件内部已处理排布与滚动） */
  height: 100%;
  padding: var(--space-3);
  overflow: hidden;
}
</style>
