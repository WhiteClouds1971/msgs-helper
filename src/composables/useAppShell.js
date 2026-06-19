/**
 * App Shell 状态 — 控制首屏 SplashScreen → 应用的过渡
 */
import { ref } from 'vue'

const isReady = ref(false)

export function useAppShell() {
  function markReady() {
    isReady.value = true
  }

  return { isReady, markReady }
}
