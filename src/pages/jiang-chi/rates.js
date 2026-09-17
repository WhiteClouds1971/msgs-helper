/**
 * 身份（位置）胜率 —— 把后端汇总的胜率整理成「身份选项后面那句话」
 *
 * 数据只有一份事实源：后端 GET /api/jiang-chi/role-stats（见 @/api/jiang-chi 的 listRoleStats）
 * 按<b>将池</b>问，一次把该将池下三个模式的汇总都回过来 —— 条数是死的（模式 × 身份），
 * 切模式不用再请求，切将池才要（页面按池拉取见 ../Index.vue 的 refreshRoleStats）。
 * 这里只做两件事：挑出当前模式的、把数字写成给人看的百分比文字。
 *
 * **胜率一律由后端算**（rate 字段）：该身份的胜场 ÷ 该身份自己的场数（胜 + 负），
 * 各身份各算各的（斗地主的农民不拿地主的场数除）。前端只管显示，不自己拿 win + lose 除 ——
 * 口径散在两地，将来一改就对不上。
 */

/**
 * 胜率文字：精确到小数点后两位（58.33%）
 *
 * 后端算出来的就是两位小数（见 server 的 RoleStat#rate），这里只补一个 %。
 * 两位小数一律写全（100.00% 也一样），不为了短一截就省掉 —— 一排按钮里各枚的
 * 字符数一致，等宽数字下才对得齐，也才看得出 33.33 与 33.30 的差别。
 *
 * @param {number} rate 0~100 的胜率
 * @returns {string} 如 '58.33%'；值不可用时给空串（调用方据此不画那一行）
 */
export function formatRate(rate) {
  // null / undefined / 空串都当「没有这个数」——直接喂 Number() 会得到 0，画出一个假的 0%
  if (rate === null || rate === undefined || rate === '') return '';

  const value = Number(rate);
  if (!Number.isFinite(value)) return '';
  return `${value.toFixed(2)}%`;
}

/**
 * 当前模式的「身份（位置）→ 胜率文字」对照，喂给各模式表单的选项
 *
 * @param {Array<{ mode: string, role: string, rate: number|null }>} stats 后端回的汇总
 * @param {string} mode 当前模式；没选模式时是空串
 * @returns {Record<string, string>} 如 { landlord: '58.33%', farmer: '83.33%' }；
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
