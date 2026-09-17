/**
 * 模式 / 将池 / 身份（位置）—— 将池战绩这一摊的公共值域，单一事实源
 *
 * 三份数据都是<b>给前端看的那一半</b>，另一半在后端，改一处要连后端一起改：
 *   · MODE_OPTIONS —— 模式，value 与后端 RoleCounter 的 mode 一致（库里存的也是它）
 *   · POOL_OPTIONS —— 将池，value 与后端 PoolCatalog 一致（中文名两边各有一份对照，见那边的注释）
 *   · MODE_ROLES   —— 每个模式的身份（位置），value 与 RoleCounter 的 role 一致
 *
 * 谁在用：记录页（../Index.vue 的两个下拉 + components/ 下各模式表单）、
 * 胜率榜页（@/pages/tool/ShengLvBang 的两个下拉 + 身份页签）。
 *
 * value 一律是稳定标识（改 label 不影响已存数据），label 才是给人看的；
 * 顺序即下拉 / 页签的展示顺序 —— 与后端 RoleCounter 的枚举顺序保持一致，
 * 并列取舍（如导出报表里的「胜率最高身份」）认的就是那个顺序。
 *
 * 全部 Object.freeze：这些是常量，被哪个页面顺手 push 一下就好玩了。
 */

/** 模式 —— 顺序即下拉顺序 */
export const MODE_OPTIONS = Object.freeze([
  Object.freeze({ label: '斗地主', value: 'dou-di-zhu' }),
  Object.freeze({ label: '军争', value: 'jun-zheng' }),
  Object.freeze({ label: '团战', value: 'tuan-zhan' }),
]);

/**
 * 将池 —— 暂时是占位名（将池1 ~ 将池8），等真实划分定下来再替换
 *
 * 与 MODE_OPTIONS 同一套规矩：以后换成「标准 / 风 / 火…」时只改 label，
 * 已存数据里的 value 不受影响，后端 PoolCatalog 那份对照改一处即可。
 */
export const POOL_OPTIONS = Object.freeze(
  Array.from({ length: 8 }, (_, index) =>
    Object.freeze({
      label: `将池${index + 1}`,
      value: `jiang-chi-${index + 1}`,
    })
  )
);

/**
 * 每个模式的身份（斗地主 / 军争）或位置（团战）—— 键就是 MODE_OPTIONS 的 value
 *
 * 三套值域互不重复，所以 (mode, role) 能唯一定到记录表里的那一对胜败场列
 * （见后端 RoleCounter）—— 新增身份时这里与那个枚举要同时加。
 */
export const MODE_ROLES = Object.freeze({
  'dou-di-zhu': Object.freeze([
    Object.freeze({ label: '地主', value: 'landlord' }),
    Object.freeze({ label: '农民', value: 'farmer' }),
  ]),
  'jun-zheng': Object.freeze([
    Object.freeze({ label: '主公', value: 'lord' }),
    Object.freeze({ label: '忠臣', value: 'loyalist' }),
    Object.freeze({ label: '反贼', value: 'rebel' }),
    Object.freeze({ label: '内奸', value: 'traitor' }),
  ]),
  'tuan-zhan': Object.freeze([
    Object.freeze({ label: '一号位', value: '1' }),
    Object.freeze({ label: '二号位', value: '2' }),
    Object.freeze({ label: '三号位', value: '3' }),
    Object.freeze({ label: '四号位', value: '4' }),
  ]),
});

/** 空值域的共用常量：没选模式时返回它，调用方不用每次拿一个新的 [] 引出来 */
const NO_ROLES = Object.freeze([]);

/**
 * 某个模式的身份（位置）列表
 *
 * @param {string} mode 模式；没选（空串）或不认识时给空数组 —— 调用方据此不画那一块
 * @returns {ReadonlyArray<{ label: string, value: string }>}
 */
export function rolesOf(mode) {
  return MODE_ROLES[mode] ?? NO_ROLES;
}

/**
 * 选项列表里某个值的中文名
 *
 * @param {Array<{ label: string, value: string }>} options 如 MODE_OPTIONS
 * @param {string} value 稳定标识
 * @returns {string} 对不上号时给空串（调用方据此不画那一段）
 */
export function labelOf(options, value) {
  return options.find(option => option.value === value)?.label ?? '';
}

/**
 * 某个模式里某个身份（位置）的中文名
 *
 * @param {string} mode 模式
 * @param {string} role 身份（位置）
 * @returns {string} 对不上号时给空串
 */
export function roleLabelOf(mode, role) {
  return labelOf(rolesOf(mode), role);
}
