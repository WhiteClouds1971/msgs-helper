/**
 * 模式 / 将池 / 身份（位置）—— 胜率统计这一摊的公共值域，单一事实源
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
 * 将池 —— 按玩法分三个系列，各四个：斗地主1 ~ 4、身份1 ~ 4、排位1 ~ 4
 *
 * 与 MODE_OPTIONS 同一套规矩：改 label 不影响已存数据（库里存的是 value），
 * 后端 PoolCatalog 那份对照跟着改一处即可。
 *
 * value 取「系列拼音 + 序号」（dou-di-zhu-N / shen-fen-N / pai-wei-N）——
 * 序号式的标识只在这一套划分里认得出自己是哪个池子。换划分时别再沿用：
 * 上一版那八个占位池（jiang-chi-1 ~ 8）就是这么作废的，库里可能还留着
 * 挂在这些 value 上的旧战绩（不再登记，也不再出现在下拉里）。
 *
 * 顺序即下拉的展示顺序：三个系列各占一段，新池往自己那一系列后面追加。
 */
export const POOL_OPTIONS = Object.freeze([
  /** 斗地主 —— 玩法专属将池 */
  Object.freeze({ label: '斗地主1', value: 'dou-di-zhu-1' }),
  Object.freeze({ label: '斗地主2', value: 'dou-di-zhu-2' }),
  Object.freeze({ label: '斗地主3', value: 'dou-di-zhu-3' }),
  Object.freeze({ label: '斗地主4', value: 'dou-di-zhu-4' }),

  /** 身份 —— 玩法专属将池 */
  Object.freeze({ label: '身份1', value: 'shen-fen-1' }),
  Object.freeze({ label: '身份2', value: 'shen-fen-2' }),
  Object.freeze({ label: '身份3', value: 'shen-fen-3' }),
  Object.freeze({ label: '身份4', value: 'shen-fen-4' }),

  /** 排位 —— 玩法专属将池 */
  Object.freeze({ label: '排位1', value: 'pai-wei-1' }),
  Object.freeze({ label: '排位2', value: 'pai-wei-2' }),
  Object.freeze({ label: '排位3', value: 'pai-wei-3' }),
  Object.freeze({ label: '排位4', value: 'pai-wei-4' }),
]);

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
