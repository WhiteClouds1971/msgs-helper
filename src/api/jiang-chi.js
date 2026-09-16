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
