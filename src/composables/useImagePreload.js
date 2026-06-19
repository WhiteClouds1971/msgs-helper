/**
 * 图片预加载 composable
 *
 * 策略：渲染当前可见 N 张 + 后台预加载后续 M 张
 *
 * @param {string[]} urls        — 全部图片 URL 列表（按优先级排序）
 * @param {number}   visibleCount — 可见卡片数（默认 3）
 * @param {number}   bufferCount  — 预加载缓冲数（默认 8）
 *
 * 用法：
 *   const { getState, preloadWindow } = useImagePreload(urls, 6, 8)
 *   preloadWindow(currentIndex) // 切卡片时调用
 *   getState(url)               // → 'pending' | 'loading' | 'loaded' | 'error'
 */
import { reactive } from 'vue'

export function useImagePreload(urls = [], visibleCount = 3, bufferCount = 8) {
  /** @type {Map<string, 'pending'|'loading'|'loaded'|'error'>} */
  const loadState = reactive(new Map())

  // 初始化状态
  for (const url of urls) {
    if (url && !loadState.has(url)) {
      loadState.set(url, 'pending')
    }
  }

  /** 预加载一批 URL */
  function preloadBatch(batch, highPriority = false) {
    for (const url of batch) {
      if (!url) continue
      if (loadState.get(url) !== 'pending') continue

      loadState.set(url, 'loading')
      const img = new Image()

      if (highPriority) {
        // fetchPriority 尚在实验阶段，用 <link> 预加载补充
        const link = document.createElement('link')
        link.rel = 'preload'
        link.as = 'image'
        link.href = url
        document.head.appendChild(link)
      }

      img.onload = () => {
        loadState.set(url, 'loaded')
      }
      img.onerror = () => {
        loadState.set(url, 'error')
      }
      img.src = url
    }
  }

  /**
   * 根据当前索引打开预加载窗口
   * 优先加载可见区，再加载缓冲区
   */
  function preloadWindow(currentIndex) {
    const total = urls.length
    if (total === 0) return

    const start = Math.max(0, currentIndex)
    const end = Math.min(total, currentIndex + visibleCount + bufferCount)

    // 可见区高优先级
    const visible = urls.slice(start, start + visibleCount)
    preloadBatch(visible, true)

    // 缓冲区内未加载的继续加载
    const pending = []
    for (let i = start; i < end; i++) {
      if (loadState.get(urls[i]) === 'pending') {
        pending.push(urls[i])
      }
    }
    preloadBatch(pending, false)
  }

  /** 获取某 URL 的加载状态 */
  function getState(url) {
    return loadState.get(url) || 'pending'
  }

  /* ---- 初始预加载前 visibleCount 张 ---- */
  if (urls.length > 0) {
    preloadBatch(urls.slice(0, visibleCount), true)
  }

  return { getState, preloadWindow }
}
