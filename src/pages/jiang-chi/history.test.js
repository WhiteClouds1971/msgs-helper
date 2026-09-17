import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { StorageKeys } from '@/constants/storageKeys';
import {
  HISTORY_LIMIT,
  appendEntry,
  canUndo,
  createEntry,
  entryPoolLabel,
  entrySummary,
  formatRecordedTime,
  removeEntry,
  useRecordHistory,
} from './history.js';

/** 一条能撤回的记录（身份 + 对局结果齐全的那条路） */
const PAYLOAD = {
  mode: 'dou-di-zhu',
  pool: 'jiang-chi-3',
  hero: '关羽',
  role: 'landlord',
  result: 'win',
};

const entryAt = (at, over = {}) => createEntry({ ...PAYLOAD, ...over }, at);

describe('canUndo', () => {
  it('身份与对局结果都填了才算动过计数，才谈得上撤回', () => {
    expect(canUndo(PAYLOAD)).toBe(true);
  });

  it('只登记将池归属的那条不算 —— 它一个数都没加', () => {
    expect(canUndo({ ...PAYLOAD, role: '', result: '' })).toBe(false);
    expect(canUndo({ ...PAYLOAD, result: '' })).toBe(false);
    expect(canUndo({ ...PAYLOAD, role: '' })).toBe(false);
  });

  it('什么都没给也不炸', () => {
    expect(canUndo()).toBe(false);
    expect(canUndo(null)).toBe(false);
  });
});

describe('createEntry', () => {
  it('带上记录时刻与这条记录的五个字段', () => {
    expect(entryAt(1700000000000)).toMatchObject({
      at: 1700000000000,
      mode: 'dou-di-zhu',
      pool: 'jiang-chi-3',
      hero: '关羽',
      role: 'landlord',
      result: 'win',
    });
  });

  it('同一毫秒里的两条也不会撞 id（撞了撤回会连坐删错条）', () => {
    const ids = new Set(
      Array.from({ length: 50 }, () => entryAt(1700000000000).id)
    );

    expect(ids.size).toBeGreaterThan(1);
  });
});

describe('appendEntry', () => {
  it('新的排最前', () => {
    const first = entryAt(1);
    const second = entryAt(2);

    expect(appendEntry(appendEntry([], first), second)).toEqual([
      second,
      first,
    ]);
  });

  it(`最多留 ${HISTORY_LIMIT} 条，多的从最旧的开始掉`, () => {
    let entries = [];
    for (let i = 0; i < HISTORY_LIMIT + 10; i++) {
      entries = appendEntry(entries, entryAt(i, { hero: `武将${i}` }));
    }

    expect(entries).toHaveLength(HISTORY_LIMIT);
    // 最新那条在最前，最早那 10 条已经被挤出去
    expect(entries[0].hero).toBe(`武将${HISTORY_LIMIT + 9}`);
    expect(entries.some(entry => entry.hero === '武将0')).toBe(false);
  });

  it('不改原数组（响应式靠新数组察觉变化）', () => {
    const entries = [];

    appendEntry(entries, entryAt(1));

    expect(entries).toEqual([]);
  });

  it('空值当空表', () => {
    expect(appendEntry(null, entryAt(1))).toHaveLength(1);
  });
});

describe('removeEntry', () => {
  it('按 id 抹掉那一条，其余不动', () => {
    const keep = entryAt(1);
    const drop = entryAt(2);

    expect(removeEntry([drop, keep], drop.id)).toEqual([keep]);
  });

  it('id 对不上时原样留全（撤回一半失败也不该误删）', () => {
    const entries = [entryAt(1), entryAt(2)];

    expect(removeEntry(entries, '没有这个 id')).toEqual(entries);
  });
});

describe('formatRecordedTime', () => {
  it('一律按 UTC+8 画，不跟浏览器时区走', () => {
    // 13:30 UTC = 21:30（UTC+8）
    expect(formatRecordedTime(Date.UTC(2026, 7, 14, 13, 30))).toBe(
      '08-14 21:30'
    );
  });

  it('跨日按 UTC+8 算：16:00 UTC 已是第二天零点', () => {
    expect(formatRecordedTime(Date.UTC(2026, 0, 1, 16, 0))).toBe('01-02 00:00');
    expect(formatRecordedTime(Date.UTC(2026, 0, 1, 15, 59))).toBe(
      '01-01 23:59'
    );
  });

  it('时间不可用时给空串', () => {
    expect(formatRecordedTime('abc')).toBe('');
    expect(formatRecordedTime(undefined)).toBe('');
  });
});

describe('entrySummary / entryPoolLabel', () => {
  it('模式 · 身份 · 对局结果，认得的都写出来', () => {
    expect(entrySummary(entryAt(1))).toBe('斗地主 · 地主 · 赢');
    expect(
      entrySummary(entryAt(1, { result: 'lose', mode: 'tuan-zhan', role: '2' }))
    ).toBe('团战 · 二号位 · 输');
  });

  it('将池画中文名', () => {
    expect(entryPoolLabel(entryAt(1))).toBe('将池3');
    expect(entryPoolLabel(entryAt(1, { pool: '没有这个池' }))).toBe('');
  });
});

describe('useRecordHistory', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('记一局就进历史，最新的在最前', () => {
    const { entries, remember } = useRecordHistory();

    remember(PAYLOAD);
    remember({ ...PAYLOAD, hero: '张飞' });

    expect(entries.value.map(entry => entry.hero)).toEqual(['张飞', '关羽']);
  });

  it('不能撤回的那条不记（只改了将池，没有撤回可言）', () => {
    const { entries, remember } = useRecordHistory();

    remember({ ...PAYLOAD, role: '', result: '' });

    expect(entries.value).toEqual([]);
  });

  it('撤回成功后抹掉那一条', () => {
    const { entries, remember, forget } = useRecordHistory();

    remember(PAYLOAD);
    remember({ ...PAYLOAD, hero: '张飞' });
    forget(entries.value[0].id);

    expect(entries.value.map(entry => entry.hero)).toEqual(['关羽']);
  });

  it('落在 localStorage 里（Key 注册在 @/constants/storageKeys）', async () => {
    const { remember } = useRecordHistory();

    remember(PAYLOAD);
    // store 的持久化是 deep watch，等一轮刷新
    await new Promise(resolve => setTimeout(resolve, 0));

    const saved = JSON.parse(
      localStorage.getItem(StorageKeys.JIANG_CHI_HISTORY)
    );
    expect(saved.entries).toHaveLength(1);
    expect(saved.entries[0].hero).toBe('关羽');
  });
});
