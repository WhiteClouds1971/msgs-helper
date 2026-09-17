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
 * 某个将池下，各身份（位置）的胜率 —— 前端「身份 / 位置」每个选项后面那个百分比（如「58.3%」）
 *
 * 统计范围就是传进来的这个将池，且不分武将：同一将池下各武将的战绩合在一起看，
 * 于是选项上那个数是「这个将池里这个身份打得怎么样」。三个模式一次全给
 * （条数是死的：模式 × 身份），切模式不用再请求，切将池才要。
 * 分母的口径在后端（斗地主的农民不拿自己的总场当分母等，见 JiangChiRoleStatService），
 * 前端只管把 rate 画出来 —— 自己拿 win 除会算错。
 *
 * @param {string} pool 将池，取页面 POOLS 的 value —— 必传：没选将池就没有口径可言
 * @param {object} [options] 透传给 axios 的配置；{ silent: true } 表示失败不弹提示
 * @returns {Promise<Array<{ mode: string, role: string, win: number, lose: number,
 *   games: number, rate: number|null }>>} rate 是 0~100 的胜率，
 *   该将池该模式一局都没打过时为 null
 */
export function listRoleStats(pool, options = {}) {
  return request.get('/jiang-chi/role-stats', { ...options, params: { pool } });
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
