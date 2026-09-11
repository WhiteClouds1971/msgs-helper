<script setup>
import { ref } from 'vue'
import MdViewer from '@/ui/MdViewer/Index.vue'
import { usePageReady } from '@/composables/usePageReady'
import { useKeywordHighlight } from '@/composables/useKeywordHighlight'
// 村规正文随包发布：?raw 静态导入，无需请求、离线可用、改文件即热更
import cunGuiMd from '@/assets/md/cun-gui.md?raw'

// 空白布局页面：无装饰、无教学导览、无持久化数据
usePageReady()

// 全局搜索跳转落地：按 URL 上的 keyword 在正文里滚动并高亮
const pageRef = ref(null)
useKeywordHighlight(pageRef)
</script>

<template>
  <div
    ref="pageRef"
    class="cun-gui"
  >
    <MdViewer
      class="cun-gui__doc"
      :content="cunGuiMd"
    />
  </div>
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

/* 正文限宽：桌面端不让汉字行宽过长（移动端本就窄，不生效） */
.cun-gui__doc {
  max-width: 34em;
  margin: 0 auto;
}
</style>
