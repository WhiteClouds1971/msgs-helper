<script setup>
import { computed, provide } from 'vue'
import { useRoute } from 'vue-router'
import menus from '@/menus.js'
import QingGangJian from '@/components/ui/QingGangJian.vue'

const route = useRoute()

const currentMenu = computed(() => {
  return menus.find(m => m.route === route.path) || null
})

provide('currentMenu', currentMenu)
</script>

<template>
  <div class="tool-shell texture-rice-paper">
    <div class="tool-content">
      <router-view />
    </div>
    <QingGangJian />
  </div>
</template>

<style scoped lang="less">
.tool-shell {
  background: var(--bg);
  position: relative;
  min-height: 100vh;
  overflow: hidden;

  /* 墨洇效果：径向渐变 + 模糊 + 暖黑遮罩（与 HomePage 一致） */
  &::before {
    content: '';
    position: fixed;
    inset: 0;
    background: radial-gradient(
      ellipse at center,
      transparent 40%,
      var(--ink-wash-overlay) 100%
    );
    backdrop-filter: blur(12px) brightness(0.6);
    z-index: 0;
    pointer-events: none;
  }
}

.tool-content {
  position: relative;
  z-index: 1;
  isolation: isolate;
  width: 100%;
  min-height: 100vh;
}

/* ── Reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  .tool-shell::before {
    backdrop-filter: none;
  }
}
</style>
