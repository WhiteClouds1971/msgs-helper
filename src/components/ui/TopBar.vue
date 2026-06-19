<script setup>
import { useRoute } from 'vue-router'
import ThemeToggle from './ThemeToggle.vue'

defineProps({
  title: { type: String, default: '' },
})

const route = useRoute()
</script>

<template>
  <header class="top-bar">
    <router-link
      to="/"
      class="top-bar__back"
      aria-label="返回首页"
    >
      ←
    </router-link>
    <span class="top-bar__title">{{ title || route.meta?.title || '' }}</span>
    <div class="top-bar__actions">
      <slot>
        <ThemeToggle />
      </slot>
    </div>
  </header>
</template>

<style scoped lang="less">
.top-bar {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 var(--space-4);
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
}

.top-bar__back {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  font-size: var(--text-lg);
  color: var(--text-secondary);
  text-decoration: none;
  user-select: none;
}

.top-bar__title {
  flex: 1;
  text-align: center;
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 var(--space-2);
}

.top-bar__actions {
  display: flex;
  align-items: center;
  min-width: 44px;
  justify-content: flex-end;
}
</style>
