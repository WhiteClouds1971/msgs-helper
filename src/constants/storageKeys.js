/**
 * localStorage Key 注册表 — 单一事实源
 *
 * 命名规范：msgs-<domain>
 *   新增 key 时在此文件追加，禁止在别处写字面量字符串。
 */
export const StorageKeys = Object.freeze({
  THEME:      'msgs-theme',
  MENU_ORDER: 'msgs-menu-order',
  // 后续按需追加...
})
