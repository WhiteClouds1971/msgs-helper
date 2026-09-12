/**
 * 教学导览 Key 注册表 — 单一事实源
 *
 * 每个 key 对应一个教学导览，值包含：
 *   key   — tourSteps.js 中的步骤 key
 *   count — 基数教学次数（auto 模式下，已教学 ≥ 此次数则不再触发）
 *
 * 新增 tour 时在此追加，禁止在别处写字符串字面量。
 */
export const TourKeys = Object.freeze({
  HOME: Object.freeze({ key: 'home', count: 1 }),

  /** 玉玺手势 — 首次进入非主页菜单时自动教学（单击搜索 / 长按控制台） */
  MENU_SEAL: Object.freeze({ key: 'menu-seal', count: 1 }),

  /** 神华佗 五禽戏 — 技能区手势（长按拖动排序 / 左滑移除 / 重置还原） */
  SHEN_HUA_TUO_WU_QIN_XI: Object.freeze({ key: 'shen-hua-tuo-wu-qin-xi', count: 1 }),
});
