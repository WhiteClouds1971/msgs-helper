/**
 * 武将候选数据 —— 现阶段全部写死在前端
 *
 * TODO(backend): 后端搜索接口就绪后，本文件是唯一的接线口 ——
 *   · 把 HEROES 换成接口返回（或删掉，只留 searchHeroes）
 *   · searchHeroes 内部改成打后端，**签名保持不变**：
 *       async (keyword: string) => Promise<[{ label, value }]>
 *     keyword 为空串表示「取全部 / 热门」（组件刚聚焦时就是这么调的）
 *   · 组件侧（@/ui/SearchSelect）不用改一行
 *
 * 将池不走这里：它现在是页面里写死的 8 个占位选项（见 Index.vue 的 POOLS），
 * 等真实划分定下来再决定是本地列表还是后端搜索。
 */

/** 武将 —— 按势力分组的样例数据，等后端接上就换成接口结果 */
export const HEROES = Object.freeze([
  // 魏
  '曹操',
  '曹丕',
  '司马懿',
  '夏侯惇',
  '张辽',
  '许褚',
  '郭嘉',
  '甄姬',
  '曹仁',
  '张郃',
  '徐晃',
  '邓艾',
  '钟会',
  '荀彧',
  // 蜀
  '刘备',
  '关羽',
  '张飞',
  '赵云',
  '马超',
  '黄忠',
  '诸葛亮',
  '黄月英',
  '魏延',
  '庞统',
  '法正',
  '姜维',
  '关平',
  // 吴
  '孙权',
  '孙策',
  '孙坚',
  '周瑜',
  '陆逊',
  '吕蒙',
  '甘宁',
  '黄盖',
  '太史慈',
  '孙尚香',
  '大乔',
  '小乔',
  '鲁肃',
  // 群
  '吕布',
  '貂蝉',
  '华佗',
  '董卓',
  '袁绍',
  '张角',
  '左慈',
  '于吉',
]);

/**
 * 搜索武将 —— 现在是本地过滤，将来是后端请求
 * @param {string} keyword 关键词；空串表示取全部
 * @returns {Promise<Array<{ label: string, value: string }>>}
 */
export async function searchHeroes(keyword) {
  // TODO(backend): return request.get('/api/jiang-chi/heroes', { keyword })
  const key = String(keyword ?? '')
    .trim()
    .toLowerCase();
  const hit = key
    ? HEROES.filter(name => name.toLowerCase().includes(key))
    : HEROES;
  return hit.map(name => ({ label: name, value: name }));
}
