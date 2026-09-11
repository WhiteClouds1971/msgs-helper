<script setup>
import InkWashBackground from '@/components/InkWashBackground/Index.vue'
</script>

<template>
  <div class="layout">
    <!-- 背景层 -->
    <div class="layout__bg">
      <InkWashBackground />
    </div>

    <!-- 页面内容 -->
    <div class="layout__body">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="less">
.layout {
  position: relative;
  min-height: 100vh;
}

/* ── 背景层（固定视口，不随滚动）── */
.layout__bg {
  position: fixed;
  inset: 0;
  z-index: 0;
}

/* ── 内容层 ── */
.layout__body {
  position: relative;
  z-index: 1;
}
</style>
