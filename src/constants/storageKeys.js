/**
 * localStorage Key 注册表 — 单一事实源
 *
 * 命名规范：msgs-<domain>
 *   新增 key 时在此文件追加，禁止在别处写字面量字符串。
 */
export const StorageKeys = Object.freeze({
  THEME: 'msgs-theme',

  /** 教学导览 — 对象，key 对应 TourKeys，值为 { count, data } */
  TOUR: 'msgs-tour',

  /** 页面进入次数 — 对象，key 为路由 path，值为累计进入次数（页面级自动教学的调度依据） */
  PAGE_VISITS: 'msgs-page-visits',

  /** 应用版本号 */
  APP_VERSION: 'msgs-app-version',

  /** 将池战绩的记录历史 — 对象 { entries: [] }，最近记的几局（可撤回），最多 50 条 */
  JIANG_CHI_HISTORY: 'msgs-jiang-chi-history',
})
