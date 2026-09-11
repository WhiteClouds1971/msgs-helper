<script setup>
import { usePageReady } from '@/composables/usePageReady'

// 空白布局页面：无装饰、无教学导览、无持久化数据 —— 内容待开发
usePageReady()
</script>

<template>
  <div class="cun-gui" />
</template>

<style scoped lang="less">
.cun-gui {
  /* #app 是 overflow: hidden 的固定高度壳，内容超一屏时自建滚动容器 */
  height: 100%;
  padding:
    calc(var(--safe-area-top) + var(--space-4))
    var(--content-padding)
    calc(var(--safe-area-bottom) + var(--space-4));
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}
</style>
