<script setup>
import { useConsole } from '@/composables/useConsole'
import Drawer from '@/components/ui/Drawer/Index.vue'

const { isOpen, close } = useConsole()
</script>

<template>
  <Drawer
    :open="isOpen"
    title="尚书台"
    description="经纬天下 · 纲纪四方"
    height="50dvh"
    @update:open="close"
  >
    <!-- TODO: 控制台具体内容，后续实现 -->
    <div class="console-placeholder">
      <p class="console-placeholder__text">
        控制台内容即将上线…
      </p>
    </div>
  </Drawer>
</template>

<style scoped lang="less">
/* ================================================================
   Console Placeholder — 占位提示
   后续填充具体功能模块
   ================================================================ */
.console-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  padding: var(--space-6) 0;
}

.console-placeholder__text {
  margin: 0;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  line-height: var(--leading-normal);
}
</style>
