<script setup>
import { watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import SplashScreen from '@/ui/SplashScreen/Index.vue'
import GlobalControls from '@/components/GlobalControls/Index.vue'
import Message from '@/ui/Message/Index.vue'
import BackgroundLayout from '@/layout/BackgroundLayout.vue'
import BlankLayout from '@/layout/BlankLayout.vue'
import { useAppShell } from '@/composables/useAppShell'
import { useLocalStorage } from '@/stores/localStorage'
import { useMenuOrder } from '@/stores/menuOrder'

const route = useRoute()
const { isReady, resetReady } = useAppShell()
const ls = useLocalStorage()
const menuOrder = useMenuOrder()

const layoutMap = { BackgroundLayout, BlankLayout }

const layout = computed(() => layoutMap[route.meta?.layout] || null)

// 页面 key：路由 path + 数据修订号。清除本页持久化数据后修订号递增，
// 页面重挂载 → setup 重新 load 默认值（Splash 由代际机制保持不变）
const pageKey = computed(() => `${route.path}#${ls.pageRevision}`)

// 路由切换 → 拉起 SplashScreen，由目标页面负责解除
// 只看 path：pageKey 也是 path 口径，仅 query 变化时页面不会重挂载，
// 若此时复位 Splash，就再也没有页面会来解除它（例如全局搜索就地换锚点）。
watch(
  () => route.path,
  () => {
    resetReady()
  },
)

// 访问即置顶：任何入口进入菜单页（主页卡片、全局搜索、直链/刷新）都把该菜单
// 记到主页卡片堆的最前 —— 记录只此一处，页面各自 push 时不用管顺序
watch(
  () => route.meta?.code,
  code => {
    if (code) menuOrder.record(code)
  },
  { immediate: true },
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
    <router-view v-slot="{ Component }">
      <Transition
        name="page-fade"
        mode="out-in"
      >
        <component
          :is="Component"
          :key="pageKey"
        />
      </Transition>
    </router-view>
  </component>

  <!-- 全局控件：玉玺、控制台等，权限统一管理 -->
  <GlobalControls />

  <!-- 全局轻提示宿主：message.success() 等命令式 API 的渲染出口 -->
  <Message />
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
