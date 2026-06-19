/**
 * 图片预加载 composable
 * 渲染可见 6 张 + 后台预加载后续 8 张
 */
import { reactive } from 'vue'

export function useImagePreload(urls = []) {
  const loadState = reactive(new Map())

  const init = () => {
    for (const url of urls) {
      if (!url) continue
      loadState.set(url, 'pending')
    }
  }

  const preloadNext = (count = 1) => {
    let loaded = 0
    for (const url of urls) {
      if (!url) continue
      if (loaded >= count) break
      if (loadState.get(url) === 'pending') {
        loadState.set(url, 'loading')
        const img = new Image()
        img.onload = () => {
          loadState.set(url, 'loaded')
        }
        img.onerror = () => {
          loadState.set(url, 'error')
        }
        img.src = url
        loaded++
      }
    }
  }

  init()
  return { loadState, preloadNext }
}
