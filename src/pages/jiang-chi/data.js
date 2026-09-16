/**
 * 武将候选数据 —— 名单来自后端（记录表里出现过的武将），本地缓存 + 建索引后离线搜
 *
 * 四条约定：
 *   · 名单只有一份事实源：后端 GET /api/jiang-chi/heroes。没有写死的基础名单 ——
 *     表里有什么就是什么，记一局就自然多一个武将。
 *   · 拉成功一次就不再打网络（失败会退避重试，后端中途起来也能自己好），
 *     拉回来就把拼音索引建好（3000 条约 32ms，只付一次）。
 *     之后每次按键都只是在这个数组上做三路 includes（实测 0.1ms），不再打网络。
 *   · 搜不到不等于没得选：@/ui/SearchSelect 的 allowCustom 默认开着，
 *     新武将直接手填即可，记下第一局后它就进名单了（见 addHeroToCache）。
 *
 * 本缓存只服务本页，与 @/components/GlobalSearch 是两套互不相干的数据：
 *   · 那边索引的是 menus.js 注册的工具 + src/assets/md 下的正文，搜不到武将；
 *   · 这边只认后端名单，也搜不到那边的东西。
 * 唯一共用的是 @/utils/pinyin 这个无状态函数（连带 pinyin-pro 库本身 —— 打包时
 * 抽成公共 chunk 只是不把 300KB 的库下两遍，里面不含任何业务数据）。
 * 别把这份缓存接到全局搜索上，反之亦然。
 *
 * 组件侧（@/ui/SearchSelect）不用改一行：对外只有下面这三个函数。
 */
import { listHeroes } from '@/api/jiang-chi';
import { convertChineseToPinyin } from '@/utils/pinyin';

/**
 * 一次最多返回多少条候选
 *
 * @/ui/SearchSelect 的候选面板是 v-for 平铺、没有虚拟滚动，
 * 而它在聚焦时会拿全量候选 —— 几千条一次性挂上 DOM 会明显卡，
 * 人也翻不动。截断到 50 条，靠继续输入收窄。
 */
const MAX_RESULTS = 50;

/** 拼音索引：[{ name, pinyin, acronym }]；最近用过的排前面（与接口顺序一致） */
let heroIndex = [];

/** 进行中的那一次拉取 —— 并发调用共用它，免得同时打好几个请求 */
let pending = null;

/** 是否已经成功拉到过名单 */
let loaded = false;

/** 上次尝试拉取的时刻（0 = 还没试过）——失败后靠它算冷却时间 */
let attemptedAt = 0;

/** 失败后隔多久才允许重试（ms） */
const RETRY_DELAY = 5000;

/**
 * 拉名单并建索引；成功一次之后就不再打网络
 *
 * 失败会退避重试 —— 后端中途才起来的话，不用刷新页面也能自己好过来。
 * 之所以要冷却而不是立刻重试：搜索框每次聚焦、每次输入都会走到这里，
 * 后端一直挂着的话，立刻重试就变成每敲一个字打一次网络。
 *
 * @returns {Promise<Array<{ name: string, pinyin: string, acronym: string }>>}
 */
export function loadHeroes() {
  if (loaded) return Promise.resolve(heroIndex);
  if (pending) return pending;

  const isRetry = attemptedAt !== 0;
  if (isRetry && Date.now() - attemptedAt < RETRY_DELAY) {
    return Promise.resolve(heroIndex);
  }

  pending = (async () => {
    attemptedAt = Date.now();
    try {
      // 首次失败由 @/utils/request 的拦截器弹提示（后端没通这件事该让用户知道）；
      // 之后的重试一律静默，否则后端一直挂着就会每次输入弹一下
      heroIndex = buildIndex(await listHeroes(isRetry ? { silent: true } : {}));
      loaded = true;
    } catch {
      // 什么都不做：attemptedAt 已经记下，等冷却过去再试
    } finally {
      pending = null;
    }
    return heroIndex;
  })();
  return pending;
}

/**
 * 搜索武将 —— 汉字 / 全拼 / 首字母三路都能搜
 *
 * @param {string} keyword 关键词；空串表示「取热门」（组件刚聚焦时就是这么调的），
 *                         此时返回最近用过的前 MAX_RESULTS 个
 * @returns {Promise<Array<{ label: string, value: string }>>}
 */
export async function searchHeroes(keyword) {
  const index = await loadHeroes();
  const key = String(keyword ?? '')
    .trim()
    .toLowerCase();
  const hit = key
    ? index.filter(
        entry =>
          entry.name.includes(key) ||
          entry.pinyin.includes(key) ||
          entry.acronym.includes(key)
      )
    : index;

  return hit
    .slice(0, MAX_RESULTS)
    .map(entry => ({ label: entry.name, value: entry.name }));
}

/**
 * 把刚记下的武将并入缓存 —— 新武将插到最前
 *
 * 已有的挪到最前，与接口「最近用过的排前面」保持同一套顺序，
 * 这样不刷新页面也能立刻在候选顶部看到它。
 *
 * @param {string} name 武将名
 */
export function addHeroToCache(name) {
  const clean = String(name ?? '').trim();
  if (!clean) return;
  heroIndex = [toEntry(clean), ...heroIndex.filter(e => e.name !== clean)];
}

/** 后端已经去重过，前端再兜一道：脏数据 / 重复名不该变成两条候选 */
function buildIndex(names) {
  const seen = new Set();
  const list = [];
  for (const raw of names ?? []) {
    const name = String(raw ?? '').trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    list.push(toEntry(name));
  }
  return list;
}

/** 一条候选：名字 + 预计算好的全拼与首字母（搜的时候不再现算） */
function toEntry(name) {
  const { pinyin, acronym } = convertChineseToPinyin(name);
  return { name, pinyin, acronym };
}
