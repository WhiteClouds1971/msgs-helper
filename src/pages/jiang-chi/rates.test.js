import { describe, expect, it } from 'vitest';

import { formatRate, roleHints } from './rates.js';

/**
 * 一份后端汇总（口径见 server 的 JiangChiRoleStatService）：
 * 斗地主 12 局 —— 地主 7 胜 5 负；一局两个农民，故农民一栏合计 10 胜 14 负。
 * 每个身份各用各的场数当分母，所以农民算的是 10 / 24。
 * 团战那个位置一场没打（0 场），胜率给的是 null。
 */
const STATS = [
  {
    mode: 'dou-di-zhu',
    role: 'landlord',
    win: 7,
    lose: 5,
    games: 12,
    rate: 58.33,
  },
  {
    mode: 'dou-di-zhu',
    role: 'farmer',
    win: 10,
    lose: 14,
    games: 24,
    rate: 41.67,
  },
  { mode: 'jun-zheng', role: 'lord', win: 4, lose: 6, games: 10, rate: 40 },
  {
    mode: 'jun-zheng',
    role: 'loyalist',
    win: 5,
    lose: 3,
    games: 8,
    rate: 62.5,
  },
  { mode: 'tuan-zhan', role: '1', win: 0, lose: 0, games: 0, rate: null },
];

describe('roleHints', () => {
  it('只取当前模式的身份，键就是选项的 value', () => {
    expect(roleHints(STATS, 'dou-di-zhu')).toEqual({
      landlord: '58.33%',
      farmer: '41.67%',
    });
  });

  it('农民用自己那 24 场当分母，不借地主的 12 局', () => {
    // 后端给 41.67（10 / 24）—— 每个身份各算各的，谁也不拿别人的场数除
    expect(roleHints(STATS, 'dou-di-zhu').farmer).toBe('41.67%');
  });

  it('团战的位置 value 是 "1" 这样的字符串，照样对得上', () => {
    expect(
      roleHints(
        [{ ...STATS[0], mode: 'tuan-zhan', role: '1', rate: 75 }],
        'tuan-zhan'
      )
    ).toEqual({ 1: '75.00%' });
  });

  it('一场没打过的身份（rate 为 null）不进对照：选项上不画那一行', () => {
    expect(roleHints(STATS, 'tuan-zhan')).toEqual({});
  });

  it('没选模式、或汇总还没回来时是空对照', () => {
    for (const empty of ['', undefined, null]) {
      expect(roleHints(STATS, empty)).toEqual({});
    }
    for (const empty of [[], null, undefined]) {
      expect(roleHints(empty, 'dou-di-zhu')).toEqual({});
    }
  });
});

describe('formatRate', () => {
  it('精确到小数点后两位，整数也写全两位', () => {
    expect(formatRate(50)).toBe('50.00%');
    expect(formatRate(58.33)).toBe('58.33%');
    expect(formatRate(83.33)).toBe('83.33%');
    expect(formatRate(33.3)).toBe('33.30%');
    expect(formatRate(0)).toBe('0.00%');
    expect(formatRate(100)).toBe('100.00%');
    // 后端本来就是两位小数，前端不再自己收位：多出来的位数四舍五入到分位
    expect(formatRate(66.666)).toBe('66.67%');
  });

  it('值不可用时给空串，让调用方知道没得画', () => {
    expect(formatRate(null)).toBe('');
    expect(formatRate(undefined)).toBe('');
    expect(formatRate('')).toBe('');
    expect(formatRate('abc')).toBe('');
  });
});
