<script setup>
import { watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import SplashScreen from '@/ui/SplashScreen/Index.vue'
import GlobalControls from '@/components/GlobalControls/Index.vue'
import BackgroundLayout from '@/layout/BackgroundLayout.vue'
import BlankLayout from '@/layout/BlankLayout.vue'
import { useAppShell } from '@/composables/useAppShell'

const route = useRoute()
const { isReady, resetReady } = useAppShell()

const layoutMap = { BackgroundLayout, BlankLayout }

const layout = computed(() => layoutMap[route.meta?.layout] || null)

// 路由切换 → 拉起 SplashScreen，由目标页面负责解除
watch(
  () => route.fullPath,
  () => {
    resetReady()
  },
)
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
  <component :is="layout">
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
  </component>

  <!-- 全局控件：玉玺、控制台等，权限统一管理 -->
  <GlobalControls />
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
