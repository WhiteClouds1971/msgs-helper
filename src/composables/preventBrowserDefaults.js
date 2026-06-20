/**
 * 禁用浏览器内置默认行为
 *
 * 针对移动端 Web 场景，全局禁用以下浏览器行为：
 * - 双指缩放 & 下拉回弹（iOS Safari CSS/meta 均无法完全阻止）
 * - 长按上下文菜单（contextmenu）
 * - 文本选择（selectstart）
 *
 * 应在应用入口（main.js）中调用一次，全局生效。
 */
export function preventBrowserDefaults() {
  // 禁止双指缩放 & 下拉回弹
  document.addEventListener('touchmove', (e) => { e.preventDefault() }, { passive: false })

  // 禁止长按菜单
  document.addEventListener('contextmenu', (e) => { e.preventDefault() })

  // 禁止文本选择
  document.addEventListener('selectstart', (e) => { e.preventDefault() })
}
