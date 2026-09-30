import { describe, expect, it } from 'vitest';
import { MODE_NOTES, modeNotesOf } from './modeNotes';

/**
 * 模式说明的取数 —— 规则表按模式取值
 *
 * 页面只管画（见 ./Index.test.js），这里盯的是「拿不到内容时给什么」。
 */
describe('模式说明', () => {
  it('值域里的模式才拿得到规则，没规则的模式给空数组', () => {
    expect(modeNotesOf('dou-di-zhu')).toHaveLength(2);
    expect(modeNotesOf('jun-zheng')).toHaveLength(1);
    // 团战没有规则 —— 空数组（不是 undefined），调用方 .length 一判就不画
    expect(modeNotesOf('tuan-zhan')).toEqual([]);
  });

  it('每条规则都有条件与结论，页面上才好落成一行', () => {
    for (const notes of Object.values(MODE_NOTES)) {
      for (const note of notes) {
        expect(note.condition.trim()).not.toBe('');
        expect(note.effect.trim()).not.toBe('');
      }
    }
  });

  it('没选模式 / 不认识的值：一律空数组，且是同一个冻结实例', () => {
    expect(modeNotesOf('')).toEqual([]);
    expect(modeNotesOf(undefined)).toEqual([]);
    expect(modeNotesOf('mei-you-zhe-ge-mo-shi')).toEqual([]);
    // 共用同一个常量：调用方不用每次拿一个新的 [] 引出来
    expect(modeNotesOf('tuan-zhan')).toBe(modeNotesOf(''));
  });

  it('规则表是冻结的：顺手 push 一下不该改得动它', () => {
    expect(Object.isFrozen(MODE_NOTES)).toBe(true);
    expect(Object.isFrozen(MODE_NOTES['dou-di-zhu'])).toBe(true);
    expect(Object.isFrozen(MODE_NOTES['dou-di-zhu'][0])).toBe(true);
  });
});
