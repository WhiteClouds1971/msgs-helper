/**
 * 模式说明 —— 每个模式自己的那一块规则（如按胜率调整专属技能），单一事实源
 *
 * <b>只认模式、不认身份</b>：选到哪个模式就画哪一份，同一模式下四个身份看到的是同一份
 * （见 ./Index.vue 表下那一小块说明）。没有规则的模式（团战）压根不在表里 —— 取不到内容，
 * 那几行整个不画，而不是塞一份空文案占着地方。
 *
 * 一条规则拆成两段，页面上落成「条件 → 结论」一行：
 *   · condition —— 触发条件（如「地主胜率 > 60%」），画成行首那一截
 *   · effect    —— 条件成立时做什么，纯文本照原样画（技能名的【】留在文案里）
 *
 * 键就是 MODE_OPTIONS 的 value（@/pages/sheng-lv-tong-ji/modes.js），新增规则时对着那份值域写。
 */

/** 规则表 —— 冻结：这些是常量，被哪个页面顺手 push 一下就好玩了 */
export const MODE_NOTES = Object.freeze({
  'dou-di-zhu': Object.freeze([
    Object.freeze({
      condition: '若地主胜率 > 60%',
      effect: '移除地主专属技能【强易】',
    }),
    Object.freeze({
      condition: '若地主胜率 < 40%',
      effect: '新增地主专属技能【殷富】',
    }),
  ]),
  'jun-zheng': Object.freeze([
    Object.freeze({
      condition: '若主公胜率 < 40%',
      effect:
        '主公从【飞扬】【跋扈】【强易】【殷富】中随机获得一个专属技能；主公专属技能不受武将技能影响',
    }),
  ]),
});

/** 空表的共用常量：没有规则的模式返回它，调用方不用每次拿一个新的 [] 引出来 */
const NO_NOTES = Object.freeze([]);

/**
 * 某个模式的说明规则
 *
 * @param {string} mode 模式；没选（空串）、不认识、或本就没有规则（团战）时给空数组 ——
 *   调用方据此一行不画（空数组没有长度，天然不占位）
 * @returns {ReadonlyArray<{ condition: string, effect: string }>}
 */
export function modeNotesOf(mode) {
  return MODE_NOTES[mode] ?? NO_NOTES;
}
