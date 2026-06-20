<script setup>
import SplashScreen from '@/components/ui/SplashScreen.vue'
import QingGangJian from '@/components/QingGangJian/Index.vue'
import { useAppShell } from '@/composables/useAppShell'

// 默认浅色主题
if (!document.documentElement.dataset.theme) {
  document.documentElement.dataset.theme = 'light'
}

const { isReady } = useAppShell()
</script>

<template>
  <!-- ================================================================
      首屏加载：全屏 SplashScreen 覆盖，白底无干扰
      ================================================================ -->
  <Transition name="splash-fade">
    <div
      v-if="!isReady"
      class="app-splash"
    >
      <SplashScreen
        subtitle="受命于天 既寿永昌"
        :show-line="true"
      />
    </div>
  </Transition>

  <!-- ================================================================
      应用主体
      ================================================================ -->
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

  <!-- 青釭剑悬浮球：全路由可见，splash 结束后显示 -->
  <!-- <QingGangJian v-if="isReady" /> -->
</template>

<style>
/* ================================================================
   首屏 Splash → 应用 过渡
   ================================================================ */
.app-splash {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
}

.splash-fade-leave-active {
  transition: opacity var(--duration-slow) var(--ease-ink);
}
.splash-fade-leave-to {
  opacity: 0;
}

/* ================================================================
   页面过渡
   ================================================================ */
.page-fade-enter-active {
  transition:
    opacity var(--duration-slow) var(--ease-enter),
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
  .splash-fade-leave-active,
  .page-fade-enter-active,
  .page-fade-leave-active {
    transition: none;
  }
}
</style>
