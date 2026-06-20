/**
 * App Shell 状态 — 控制首屏 SplashScreen → 应用的过渡
 *
 * 代际（generation）机制：
 *   - 每次路由切换 resetReady() 递增 gen，isReady → false
 *   - 页面 markReady(gen) 只有 gen 匹配当前代际才生效
 *   - 旧页面残留的回调无法意外解除新页面的 Splash
 */
import { ref } from 'vue'

const isReady = ref(false)
let readyGen = 0

export function useAppShell() {
  /** 标记资源就绪（需传入代际令牌） */
  function markReady(gen) {
    if (gen === undefined || gen === readyGen) {
      isReady.value = true
    }
  }

  /** 复位 Splash，返回新的代际令牌 */
  function resetReady() {
    readyGen++
    isReady.value = false
    return readyGen
  }

  /** 获取当前代际（页面 setup 时捕获） */
  function getGen() {
    return readyGen
  }

  return { isReady, markReady, resetReady, getGen }
}
