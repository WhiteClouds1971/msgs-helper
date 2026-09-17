import request from '@/utils/request';

/**
 * 将池战绩接口
 *
 * 后端见 server/src/main/java/com/msgshelper/server/controller/JiangChiRecordController.java
 * 实际地址 = APP_SERVER_URL + APP_BASE_API + 下面的路径（见 .env.*）
 */

/**
 * 记一局，或只登记武将所属将池
 *
 * @param {object} payload
 * @param {string} payload.mode   模式：dou-di-zhu / jun-zheng / tuan-zhan
 * @param {string} payload.pool   将池
 * @param {string} payload.hero   武将
 * @param {string} [payload.role]   身份（斗地主 / 军争）或位置（团战）
 * @param {string} [payload.result] 对局结果：win / lose
 *
 * role 与 result 要么都给、要么都不给：
 *   都给   → 对应身份（位置）的胜场或败场 +1
 *   都不给 → 只登记并刷新 (将池, 武将) 这条的更新日期，胜败场不动
 *
 * @returns {Promise<object>} 这条记录的最新全貌（各胜败场 + 创建 / 更新日期）；
 *   失败由 request 拦截器统一弹提示并 reject，这里不用再判 code
 */
export function createRecord(payload) {
  return request.post('/jiang-chi/records', payload);
}

/**
 * 全量武将名单 —— 记录表里出现过的武将名去重
 *
 * 名单没有单独的主数据表：记一局就自然多一个武将。
 * 顺序是「最近用过的排前面」，方便前端截断后留下的都是常用武将。
 *
 * @param {object} [options] 透传给 axios 的配置；{ silent: true } 表示失败不弹提示
 * @returns {Promise<string[]>}
 */
export function listHeroes(options = {}) {
  return request.get('/jiang-chi/heroes', options);
}

/**
 * 某个将池下，各身份（位置）的胜率 —— 前端「身份 / 位置」每个选项后面那个百分比（如「58.33%」）
 *
 * 统计范围就是传进来的这个将池，且不分武将：同一将池下各武将的战绩合在一起看，
 * 于是选项上那个数是「这个将池里这个身份打得怎么样」。三个模式一次全给
 * （条数是死的：模式 × 身份），切模式不用再请求，切将池才要。
 *
 * <b>这是历史口径</b>：该将池下记过的对局全都算 —— 换过将池的武将留在这里的战绩也照样计入，
 * <b>不</b>按 `in_pool` 过滤（与 `listHeroStats` 的范围不同，两者数字对不上是正常的）。
 * 胜率在后端算好（该身份的胜场 ÷ 该身份自己的场数，各身份各算各的，见 JiangChiRoleStatService），
 * 前端只管把 rate 画出来。
 *
 * @param {string} pool 将池，取页面 POOLS 的 value —— 必传：没选将池就没有口径可言
 * @param {object} [options] 透传给 axios 的配置；{ silent: true } 表示失败不弹提示
 * @returns {Promise<Array<{ mode: string, role: string, win: number, lose: number,
 *   games: number, rate: number|null }>>} rate 是 0~100 的胜率；games 是该身份自己的场数
 *   （胜 + 负），该身份在这个将池下一场没打过时为 0，rate 随之是 null
 */
export function listRoleStats(pool, options = {}) {
  return request.get('/jiang-chi/role-stats', { ...options, params: { pool } });
}

/**
 * 某个将池 + 某个模式 + 某个身份（位置）下的武将胜率 —— 胜率榜页那张表
 *
 * 口径与 `listRoleStats` 是同一套的两个方向：那个是「这个将池里这个身份打得怎么样」（跨武将汇总），
 * 这个是「这个身份下某个武将打得怎么样」—— 胜率 = 该武将在<b>这个身份</b>下的胜场 ÷
 * 它自己在这个身份下的场数（胜 + 败），各武将各算各的，不借别人的场数当分母。
 * 三样都给才问得出数：换将池换一套数据，换模式换一套身份，换身份换一套分子分母。
 *
 * 范围内<b>只留现在还待在这个将池里的武将</b>（后端按 `in_pool` 过滤）：换过池子的武将
 * 在旧池子留下的是历史战绩，不该拿来和新池子的现任比 —— 那些场次只进 `listRoleStats`
 * 那行历史胜率（那个接口不过滤，见上）。
 *
 * 排序与截断都在后端（胜率高的在前、场数多的次之），前端拿到即是排好的序；
 * 一场没打的武将不在结果里（0 场没有胜率可言）。
 *
 * @param {object} query
 * @param {string} query.pool  将池，取页面 POOLS 的 value —— 必传
 * @param {string} query.mode  模式：dou-di-zhu / jun-zheng / tuan-zhan —— 必传
 * @param {string} query.role  身份（斗地主、军争）或位置（团战）—— 必传
 * @param {number} [query.limit] 最多要几条；不传就是<b>全部</b>（口径已被将池与身份框住，条数本来就少）
 * @param {object} [options] 透传给 axios 的配置；{ silent: true } 表示失败不弹提示
 * @returns {Promise<Array<{ hero: string, win: number, lose: number, games: number,
 *   rate: number|null }>>} games 是该武将在该身份下的总场数（胜 + 败），也是 rate 的分母
 */
export function listHeroStats({ pool, mode, role, limit } = {}, options = {}) {
  return request.get('/jiang-chi/hero-stats', {
    ...options,
    params: { pool, mode, role, limit },
  });
}

/**
 * 导出武将胜率统计 Excel —— 后端把记录表全量填进模板，把文件流直接回给我们
 *
 * 走 responseType: 'blob'：这条回的是二进制附件，不是统一响应体，
 * @/utils/request 的拦截器见响应体里没有 code 就原样交出，所以这里拿到的就是 Blob。
 * 失败时后端回的仍是统一响应体（HTTP 5xx + JSON），拦截器照常弹提示、并 reject。
 *
 * @returns {Promise<Blob>} xlsx 的内容；文件名得调用方自己起 ——
 *   按 blob 取不到响应头里的 Content-Disposition（见 @/utils/request 的拆包规则）
 */
export function exportRecords() {
  return request.get('/jiang-chi/export', { responseType: 'blob' });
}
