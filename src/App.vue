<script setup>
// 默认浅色主题
if (!document.documentElement.dataset.theme) {
  document.documentElement.dataset.theme = 'light'
}
</script>

<template>
  <router-view v-slot="{ Component, route }">
    <Transition
      name="page-fade"
      mode="out-in"
    >
      <component
        :is="Component"
        :key="route.path"
      />
    </Transition>
  </router-view>
</template>

<style>
/* 页面过渡 */
.page-fade-enter-active {
  transition: opacity var(--duration-slow) var(--ease-enter),
              transform var(--duration-slow) var(--ease-enter);
}
.page-fade-leave-active {
  transition: opacity var(--duration-fast) var(--ease-enter);
}
.page-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .page-fade-enter-active,
  .page-fade-leave-active {
    transition: none;
  }
}
</style>
