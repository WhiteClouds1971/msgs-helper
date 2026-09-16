import { describe, expect, it, vi } from 'vitest';

// 后端名单的桩：默认成功，个别用例先让它失败一次
const { listHeroes } = vi.hoisted(() => ({ listHeroes: vi.fn() }));
vi.mock('@/api/jiang-chi', () => ({ listHeroes }));

import { addHeroToCache, loadHeroes, searchHeroes } from './data.js';

/** 故意带一条重复，验证前端也兜了去重 */
const HERO_NAMES = ['关羽', '夏侯惇', '张飞', '关羽'];

const names = async keyword => (await searchHeroes(keyword)).map(r => r.value);

describe('武将搜索', () => {
  // 必须放第一个：此时模块状态是干净的（还没成功拉过名单）
  it('拉取失败会退避重试，后端中途起来也不用刷新页面', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    listHeroes
      .mockRejectedValueOnce(new Error('后端没通'))
      .mockResolvedValue(HERO_NAMES);

    expect(await names('')).toEqual([]);
    expect(listHeroes).toHaveBeenCalledTimes(1);

    // 冷却期内：聚焦、输入都会走到 loadHeroes，不能每次都打网络
    expect(await names('')).toEqual([]);
    expect(await names('关')).toEqual([]);
    expect(listHeroes).toHaveBeenCalledTimes(1);

    vi.setSystemTime(Date.now() + 6000);

    expect(await names('')).toEqual(['关羽', '夏侯惇', '张飞']);
    expect(listHeroes).toHaveBeenCalledTimes(2);
    // 重试静默：否则后端一直挂着，每次输入都弹一下提示
    expect(listHeroes).toHaveBeenLastCalledWith({ silent: true });

    vi.useRealTimers();
  });

  it('后端列表去重，且保持「最近用过的排前面」的顺序', async () => {
    await loadHeroes();
    expect(await names('')).toEqual(['关羽', '夏侯惇', '张飞']);
  });

  it('汉字搜索', async () => {
    expect(await names('关')).toEqual(['关羽']);
    expect(await names('飞')).toEqual(['张飞']);
  });

  it('全拼搜索', async () => {
    expect(await names('guan')).toEqual(['关羽']);
    expect(await names('xiahou')).toEqual(['夏侯惇']);
    expect(await names('fei')).toEqual(['张飞']);
  });

  it('首字母搜索', async () => {
    expect(await names('gy')).toEqual(['关羽']);
    expect(await names('xhd')).toEqual(['夏侯惇']);
    expect(await names('zf')).toEqual(['张飞']);
  });

  it('大小写与首尾空格不影响', async () => {
    expect(await names('  XHD  ')).toEqual(['夏侯惇']);
  });

  it('新增的武将插到最前', async () => {
    addHeroToCache('貂蝉');
    expect(await names('')).toEqual(['貂蝉', '关羽', '夏侯惇', '张飞']);
    expect(await names('diaochan')).toEqual(['貂蝉']);
    expect(await names('dc')).toEqual(['貂蝉']);
  });

  it('已有武将不产生重复，只是挪到最前', async () => {
    addHeroToCache('张飞');
    expect(await names('')).toEqual(['张飞', '貂蝉', '关羽', '夏侯惇']);
  });

  it('结果截断到 50 条（面板是平铺渲染，不能把全量丢给它）', async () => {
    for (let i = 0; i < 100; i++) addHeroToCache(`测试武将${i}`);
    expect((await searchHeroes('')).length).toBe(50);
    expect((await names('测试武将0'))[0]).toBe('测试武将0');
  });
});
