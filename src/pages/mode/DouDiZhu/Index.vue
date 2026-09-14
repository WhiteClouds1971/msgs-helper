<script setup>
import { usePageReady } from '@/composables/usePageReady'

// 空白布局页面：无装饰、无教学导览、无持久化数据
// 内容待补（斗地主模式）
usePageReady()
</script>

<template>
  <div class="mode-dou-di-zhu" />
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
</style>