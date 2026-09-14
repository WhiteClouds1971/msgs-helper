<script setup>
import { usePageReady } from '@/composables/usePageReady'
import ImageFigure from '@/ui/ImageFigure/Index.vue'
import bannerUrl from '@/assets/images/yjcm/父魂.webp'

// 空白布局页面：无装饰、无教学导览、无持久化数据
usePageReady()
</script>

<template>
  <div class="guan-xing-zhang-bao-fu-hun">
    <ImageFigure
      class="guan-xing-zhang-bao-fu-hun__figure"
      :src="bannerUrl"
      alt="父魂"
    />
  </div>
</template>

<style scoped lang="less">
.guan-xing-zhang-bao-fu-hun {
  /* #app 是 overflow: hidden 的固定高度壳：滚动改由本页承担 */
  display: flex;
  flex-direction: column;
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

/* 一张图独自成页：放得下就整屏居中 —— margin: auto 在内容溢出时自动归零，
   不像 justify-content: center 那样把图的顶部裁掉；放不下就整页滚 */
.guan-xing-zhang-bao-fu-hun__figure {
  margin: auto;
}
</style>
