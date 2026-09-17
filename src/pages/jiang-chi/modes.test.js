import { describe, expect, it } from 'vitest';

import {
  MODE_OPTIONS,
  MODE_ROLES,
  POOL_OPTIONS,
  labelOf,
  roleLabelOf,
  rolesOf,
} from './modes.js';

describe('modes.js — 公共值域', () => {
  it('每个模式都有自己的身份（位置）值域，一个都不缺', () => {
    for (const mode of MODE_OPTIONS) {
      const roles = rolesOf(mode.value);
      expect(roles.length).toBeGreaterThan(0);
      expect(roles.every(role => role.label && role.value)).toBe(true);
    }
  });

  it('三套身份（位置）的 value 互不重复 —— (模式, 身份) 才能唯一定到记录表里那一对列', () => {
    const all = Object.values(MODE_ROLES).flat().map(role => role.value);
    expect(new Set(all).size).toBe(all.length);
  });

  it('没选模式 / 不认识的模式给空数组，不炸也不画出半条页签', () => {
    for (const empty of ['', undefined, null, 'mei-you-zhe-ge-mo-shi']) {
      expect(rolesOf(empty)).toEqual([]);
    }
  });

  it('将池是八个占位名，value 与后端 PoolCatalog 一致', () => {
    expect(POOL_OPTIONS).toHaveLength(8);
    expect(POOL_OPTIONS.map(pool => pool.value)).toEqual([
      'jiang-chi-1',
      'jiang-chi-2',
      'jiang-chi-3',
      'jiang-chi-4',
      'jiang-chi-5',
      'jiang-chi-6',
      'jiang-chi-7',
      'jiang-chi-8',
    ]);
  });

  it('labelOf / roleLabelOf 取值的中文名，对不上号时给空串', () => {
    expect(labelOf(MODE_OPTIONS, 'jun-zheng')).toBe('军争');
    expect(labelOf(MODE_OPTIONS, 'mei-you')).toBe('');
    expect(roleLabelOf('tuan-zhan', '3')).toBe('三号位');
    // 军争里没有「地主」：模式与身份对不上号同样给空串
    expect(roleLabelOf('jun-zheng', 'landlord')).toBe('');
  });

  it('常量是冻住的 —— 页面顺手 push 一下不会污染别处', () => {
    expect(Object.isFrozen(MODE_OPTIONS)).toBe(true);
    expect(Object.isFrozen(POOL_OPTIONS)).toBe(true);
    expect(Object.isFrozen(MODE_ROLES['dou-di-zhu'])).toBe(true);
  });
});
