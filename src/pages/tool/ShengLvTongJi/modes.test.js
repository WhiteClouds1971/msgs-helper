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
    const all = Object.values(MODE_ROLES)
      .flat()
      .map(role => role.value);
    expect(new Set(all).size).toBe(all.length);
  });

  it('没选模式 / 不认识的模式给空数组，不炸也不画出半条页签', () => {
    for (const empty of ['', undefined, null, 'mei-you-zhe-ge-mo-shi']) {
      expect(rolesOf(empty)).toEqual([]);
    }
  });

  it('将池是三个系列各四个（斗地主 / 身份 / 排位），value 与后端 PoolCatalog 一致', () => {
    expect(POOL_OPTIONS).toHaveLength(12);
    expect(POOL_OPTIONS.map(pool => pool.value)).toEqual([
      'dou-di-zhu-1',
      'dou-di-zhu-2',
      'dou-di-zhu-3',
      'dou-di-zhu-4',
      'shen-fen-1',
      'shen-fen-2',
      'shen-fen-3',
      'shen-fen-4',
      'pai-wei-1',
      'pai-wei-2',
      'pai-wei-3',
      'pai-wei-4',
    ]);
    // 中文名两边各有一份对照（后端 PoolCatalog），这边认一下每个系列的头一条
    expect(labelOf(POOL_OPTIONS, 'dou-di-zhu-1')).toBe('斗地主1');
    expect(labelOf(POOL_OPTIONS, 'shen-fen-1')).toBe('身份1');
    expect(labelOf(POOL_OPTIONS, 'pai-wei-4')).toBe('排位4');
    // 作废的占位池：不在值域里了，标签也认不出来
    expect(labelOf(POOL_OPTIONS, 'jiang-chi-1')).toBe('');
  });

  it('将池的 value 互不重复 —— 下拉里两个选项指着同一个池子就没法记录了', () => {
    const values = POOL_OPTIONS.map(pool => pool.value);
    expect(new Set(values).size).toBe(values.length);
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
