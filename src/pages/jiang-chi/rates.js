/**
 * 身份（位置）胜率 —— 把后端汇总的胜率整理成「身份选项后面那句话」
 *
 * 数据只有一份事实源：后端 GET /api/jiang-chi/role-stats（见 @/api/jiang-chi 的 listRoleStats）
 * 按<b>将池</b>问，一次把该将池下三个模式的汇总都回过来 —— 条数是死的（模式 × 身份），
 * 切模式不用再请求，切将池才要（页面按池拉取见 ../Index.vue 的 refreshRoleStats）。
 * 这里只做两件事：挑出当前模式的、把数字写成给人看的百分比文字。
 *
 * **分母一律由后端算**（rate 字段），前端不自己拿 win + lose 除 ——
 * 斗地主的农民、军争的其余身份、团战的其余位置，分母都是该将池、该模式里「每局必然出现、
 * 且只出现一次」那个身份的局长（地主 / 主公 / 一号位）。前端自己算，农民的胜率会少一半。
 */

/**
 * 胜率文字：一位小数（58.3%）
 *
 * 后端给的是 0~100 的两位小数，显示收成一位 —— 窄栏里一行最多排四枚按钮，
 * 「58.33%」比「58.3%」宽出一个字符；整数不拖那个 .0（50% 比 50.0% 短一截）。
 *
 * @param {number} rate 0~100 的胜率
 * @returns {string} 如 '58.3%'；值不可用时给空串（调用方据此不画那一行）
 */
export function formatRate(rate) {
  // null / undefined / 空串都当「没有这个数」——直接喂 Number() 会得到 0，画出一个假的 0%
  if (rate === null || rate === undefined || rate === '') return '';

  const value = Number(rate);
  if (!Number.isFinite(value)) return '';
  return `${Number.isInteger(value) ? value : value.toFixed(1)}%`;
}

/**
 * 当前模式的「身份（位置）→ 胜率文字」对照，喂给各模式表单的选项
 *
 * @param {Array<{ mode: string, role: string, rate: number|null }>} stats 后端回的汇总
 * @param {string} mode 当前模式；没选模式时是空串
 * @returns {Record<string, string>} 如 { landlord: '58.3%', farmer: '83.3%' }；
 *   该模式一局没打过的身份不在里面（rate 为 null）—— 选项上就不画那一行
 */
export function roleHints(stats, mode) {
  const hints = {};
  if (!mode) return hints;

  for (const stat of stats ?? []) {
    if (stat?.mode !== mode || stat.rate == null) continue;
    hints[stat.role] = formatRate(stat.rate);
  }
  return hints;
}
