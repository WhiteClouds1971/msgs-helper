/**
 * 禁用浏览器内置默认行为
 *
 * 针对移动端 Web 场景，全局禁用以下浏览器行为：
 * - 双指缩放（iOS Safari 忽略 viewport 的 user-scalable=no）
 * - 长按上下文菜单（contextmenu）
 * - 文本选择（selectstart）
 *
 * 注意：单指滚动必须放行，否则页面内的滚动容器（自建 overflow 滚动区）无法用
 * 手指滚动。下拉回弹/下拉刷新由 CSS 兜底：html/body/#app 的 overflow:hidden
 * 加 overscroll-behavior:none，滚动容器自身再加 overscroll-behavior:contain。
 *
 * 应在应用入口（main.js）中调用一次，全局生效。
 */
export function preventBrowserDefaults() {
  // 禁止双指缩放（多指才拦截，单指滚动放行）
  document.addEventListener(
    'touchmove',
    (e) => {
      if (e.touches.length > 1) e.preventDefault()
    },
    { passive: false },
  )

  // 禁止长按菜单
  document.addEventListener('contextmenu', (e) => { e.preventDefault() })

  // 禁止文本选择
  document.addEventListener('selectstart', (e) => { e.preventDefault() })
}
