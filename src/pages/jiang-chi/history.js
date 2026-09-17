/**
 * 记录历史 —— 本页「新增」过的那几局，最多留 50 条（前端本地持久化）
 *
 * 为什么这份清单留在前端：后端那张表只存「一个武将在一个将池下的累计胜败场」，
 * 记一局就是某一列 +1，没有逐局的流水，也就谈不上「撤回哪一局」。
 * 所以「刚记了什么」由页面自己记着 —— 撤回时按这条记录把那一列 -1
 * （接口见 @/api/jiang-chi 的 undoRecord），撤完再把这条从历史里抹掉。
 *
 * 四条约定：
 *   · <b>只记能撤回的</b>：模式 / 将池 / 武将 / 身份 / 对局结果齐全的那几条。
 *     只登记将池归属（不填身份与对局）的那条路不进历史 —— 它没动任何计数，
 *     想改重新登记一次就行，没有「撤回」可言（见 ../Index.vue 的 handleAdd）。
 *   · <b>最多 50 条</b>，新的排最前，多的从尾巴上掉（见 appendEntry）。
 *   · 时间存的是时间戳，<b>显示一律按 UTC+8</b>（formatRecordedTime）——
 *     面杀在哪儿都是这一个口径，不跟着浏览器的时区跑。
 *   · 落库走 @/stores/localStorage（Key 注册在 @/constants/storageKeys），
 *     页面重挂载、刷新、重开浏览器都还在。
 */
import { computed } from 'vue';

import { StorageKeys } from '@/constants/storageKeys';
import { useLocalStorage } from '@/stores/localStorage';

import { MODE_OPTIONS, POOL_OPTIONS, labelOf, roleLabelOf } from './modes.js';

/** 最多保留多少条历史；超出的从最旧的开始丢 */
export const HISTORY_LIMIT = 50;

/** 对局结果的中文名 —— 与各模式表单里的选项同源 */
const RESULT_LABELS = Object.freeze({ win: '赢', lose: '输' });

/** 时间一律按 UTC+8 画（面杀现场就这一个口径，不跟浏览器时区走） */
const TIME_FORMATTER = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/**
 * 这条记录能不能撤回
 *
 * 能撤回 = 它动过某个计数：身份（位置）与对局结果都填了。
 * 只填了武将 + 将池的那条只是登记归属，什么都没加，也就没得减。
 *
 * @param {object} payload 提交给新增接口的那份数据
 * @returns {boolean}
 */
export function canUndo(payload) {
  return Boolean(payload?.role && payload?.result);
}

/**
 * 造一条历史记录
 *
 * @param {object} payload 新增成功时用的那份数据（模式 / 将池 / 武将 / 身份 / 结果）
 * @param {number} [at] 记录时刻（时间戳，ms）；默认此刻，测试里可传定值
 * @returns {{ id: string, at: number, mode: string, pool: string, hero: string,
 *   role: string, result: string }} id 只用来认人（撤回时按它删条），业务上没有意义
 */
export function createEntry(payload, at = Date.now()) {
  return {
    // 同一毫秒里连点两下也不能撞成同一条：时间戳后面缀一段随机
    id: `${at}-${Math.random().toString(36).slice(2, 8)}`,
    at,
    mode: payload.mode,
    pool: payload.pool,
    hero: payload.hero,
    role: payload.role,
    result: payload.result,
  };
}

/**
 * 把一条记录放进历史：新的排最前，超出上限的从尾巴上掉
 *
 * @param {Array<object>} entries 现有历史（可为空 / 空值）
 * @param {object} entry 见 createEntry
 * @returns {Array<object>} 新数组（不改原数组 —— 交给响应式去察觉变化）
 */
export function appendEntry(entries, entry) {
  return [entry, ...(entries ?? [])].slice(0, HISTORY_LIMIT);
}

/**
 * 从历史里抹掉一条（撤回成功后调）
 *
 * @param {Array<object>} entries 现有历史
 * @param {string} id 要抹掉的那条的 id
 * @returns {Array<object>} 新数组；id 对不上时就是原样一份
 */
export function removeEntry(entries, id) {
  return (entries ?? []).filter(entry => entry.id !== id);
}

/**
 * 记录时间 —— 按 UTC+8 画成「08-14 21:30」
 *
 * 不画年份：历史只留最近 50 条，跨年的那几条一眼也知道是哪年。
 *
 * @param {number} at 时间戳（ms）
 * @returns {string} 时间不可用时给空串（调用方据此不画那一段）
 */
export function formatRecordedTime(at) {
  const date = new Date(Number(at));
  if (!Number.isFinite(date.getTime())) return '';
  // zh-CN 给的是 08/14 21:30，换成 08-14 21:30 更省地方
  return TIME_FORMATTER.format(date).replaceAll('/', '-');
}

/**
 * 一条记录的一句话：模式 · 身份（位置）· 对局结果，如「斗地主 · 地主 · 赢」
 *
 * @param {object} entry 见 createEntry
 * @returns {string} 认不出的部分自动省掉，剩下的用 · 连起来
 */
export function entrySummary(entry) {
  return [
    labelOf(MODE_OPTIONS, entry?.mode),
    roleLabelOf(entry?.mode, entry?.role),
    RESULT_LABELS[entry?.result] ?? '',
  ]
    .filter(Boolean)
    .join(' · ');
}

/**
 * 一条记录所在的将池中文名（值域见 ./modes.js）
 *
 * @param {object} entry 见 createEntry
 * @returns {string} 对不上号时给空串
 */
export function entryPoolLabel(entry) {
  return labelOf(POOL_OPTIONS, entry?.pool);
}

/**
 * 记录历史 —— 本页取用的那一份（读写都落到 localStorage）
 *
 * 只有一个页面用，所以不做成 store：状态就寄存在 @/stores/localStorage 的 cache 里
 * （存的是对象 { entries: [] }，与 store 的 load/defaults 合并规则一致）。
 *
 * @returns {{ entries: import('vue').ComputedRef<Array<object>>,
 *   remember: (payload: object) => void, forget: (id: string) => void }}
 *   remember 只认能撤回的那几条（见 canUndo）；不能撤回的静默忽略，
 *   免得调用方还得自己判一次
 */
export function useRecordHistory() {
  const ls = useLocalStorage();
  ls.load(StorageKeys.JIANG_CHI_HISTORY, { entries: [] });

  /** 这一个 key 下的数据；页面数据被清过就补一个空的回来 */
  function bucket() {
    const key = StorageKeys.JIANG_CHI_HISTORY;
    if (!ls.cache[key]) ls.cache[key] = { entries: [] };
    return ls.cache[key];
  }

  const entries = computed(() => bucket().entries ?? []);

  /** 记下这一局（能撤回的才记） */
  function remember(payload) {
    if (!canUndo(payload)) return;
    bucket().entries = appendEntry(entries.value, createEntry(payload));
  }

  /** 抹掉这一条（撤回成功后调） */
  function forget(id) {
    bucket().entries = removeEntry(entries.value, id);
  }

  return { entries, remember, forget };
}
