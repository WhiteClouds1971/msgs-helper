/**
 * 页面资源就绪检测 — 控制 SplashScreen 解除时机
 *
 * 两种模式：
 *   usePageReady()              自动模式：自动追踪页面内所有 <img> 加载
 *   usePageReady({ auto: false }) 手动模式：页面自行决定何时 markReady()
 *
 * 原理：
 *   1. 路由切换时 App.vue 调用 resetReady()，递增代际、拉起 Splash
 *   2. 页面 setup 时捕获当前代际
 *   3. 资源就绪后 markReady(gen)，仅当 gen 匹配当前代际才解除 Splash
 *   4. 旧页面残留回调因 gen 不匹配自然失效
 */
import { onMounted, onBeforeUnmount, nextTick, getCurrentInstance } from 'vue'
import { useAppShell } from './useAppShell'

const SPLASH_SELECTOR = '.app-splash'

export function usePageReady({ auto = true } = {}) {
  const { markReady: appMarkReady, getGen } = useAppShell()
  const gen = getGen()

  if (!auto) {
    // 手动模式：返回代际绑定的 markReady
    return { markReady: () => appMarkReady(gen) }
  }

  // ================================================================
  //  自动模式：MutationObserver 追踪页面内 <img>
  // ================================================================
  let observer = null
  const pending = new Set()

  function isInSplash(el) {
    return el.closest(SPLASH_SELECTOR) !== null
  }

  function onDone(e) {
    pending.delete(e.target)
    if (pending.size === 0) appMarkReady(gen)
  }

  function track(img) {
    // 跳过更高级别的提示
    if (isInSplash(img)) return
    // 已加载完成（缓存命中），无需追踪
    if (img.complete) return
    if (pending.has(img)) return

    pending.add(img)
    img.addEventListener('load', onDone, { once: true })
    img.addEventListener('error', onDone, { once: true })
  }

  onMounted(() => {
    const instance = getCurrentInstance()

    nextTick(() => {
      const root = instance?.proxy?.$el

      // 追踪页面内已有的 <img>
      if (root?.querySelectorAll) {
        root.querySelectorAll('img').forEach(track)
      }

      // 监听后续动态插入的 <img>
      observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          for (const node of m.addedNodes) {
            if (node.nodeType !== 1) continue
            if (node.tagName === 'IMG') track(node)
            if (node.querySelectorAll) node.querySelectorAll('img').forEach(track)
          }
        }
      })

      observer.observe(root || document.body, { childList: true, subtree: true })

      // 无待追踪图片 → 即刻就绪
      if (pending.size === 0) appMarkReady(gen)
    })
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    for (const img of pending) {
      img.removeEventListener('load', onDone)
      img.removeEventListener('error', onDone)
    }
    pending.clear()
  })

  return { markReady: () => appMarkReady(gen) }
}
