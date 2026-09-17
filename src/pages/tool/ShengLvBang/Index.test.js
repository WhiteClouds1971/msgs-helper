import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * 胜率榜页 —— 两个接口按各自的口径被问到没有、结果有没有画对地方
 *
 * 接口全部 mock（页面只该管「什么时候问、拿回来的东西画在哪」，口径在后端算）。
 * 模式 / 将池是从页面数据（localStorage，key = 路由 fullPath）恢复的，
 * 所以用例直接往 localStorage 里塞一份，等价于「上次来选过」。
 */
const api = vi.hoisted(() => ({
  listHeroStats: vi.fn(),
  listRoleStats: vi.fn(),
}));

vi.mock('@/api/jiang-chi', () => ({
  listHeroStats: api.listHeroStats,
  listRoleStats: api.listRoleStats,
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({ fullPath: '/tool/sheng-lv-bang' }),
}));

import Index from './Index.vue';

const PAGE_PATH = '/tool/sheng-lv-bang';

/** 一份后端汇总（口径见 server 的 JiangChiRoleStatService） */
const ROLE_STATS = [
  { mode: 'dou-di-zhu', role: 'landlord', win: 3, lose: 2, games: 5, rate: 60 },
  { mode: 'dou-di-zhu', role: 'farmer', win: 1, lose: 1, games: 2, rate: 50 },
  { mode: 'jun-zheng', role: 'lord', win: 1, lose: 1, games: 2, rate: 50 },
  { mode: 'jun-zheng', role: 'loyalist', win: 0, lose: 0, games: 0, rate: null },
];

/** 一份榜单（后端已按胜率排好） */
const HERO_STATS = [
  { hero: '将马岱', win: 3, lose: 1, games: 4, rate: 75 },
  { hero: '界周瑜', win: 0, lose: 1, games: 1, rate: 0 },
];

/** 塞一份页面数据，等价于上次来选过了 */
function presetPageData(data) {
  localStorage.setItem(PAGE_PATH, JSON.stringify(data));
}

function mountPage() {
  return mount(Index);
}

describe('胜率榜页', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
    api.listHeroStats.mockReset().mockResolvedValue(HERO_STATS);
    api.listRoleStats.mockReset().mockResolvedValue(ROLE_STATS);
  });

  it('没挑模式 / 将池：不画页签条，也不打任何一个接口', async () => {
    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.find('.tabs__list').exists()).toBe(false);
    expect(wrapper.find('.sheng-lv-bang__placeholder').text()).toContain(
      '请先选择模式与将池'
    );
    expect(api.listRoleStats).not.toHaveBeenCalled();
    expect(api.listHeroStats).not.toHaveBeenCalled();
  });

  it('选了口径：页签是该模式的全部身份，默认停在第一枚', async () => {
    presetPageData({ mode: 'dou-di-zhu', pool: 'jiang-chi-1' });
    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.findAll('.tabs__tab').map(tab => tab.text())).toEqual([
      '地主',
      '农民',
    ]);
    expect(
      wrapper.findAll('.tabs__tab')[0].attributes('data-state')
    ).toBe('active');

    // 历史胜率按将池问一次；武将战绩按 (将池, 模式, 身份) 问，不带 limit（要全部）
    expect(api.listRoleStats).toHaveBeenCalledWith('jiang-chi-1');
    expect(api.listHeroStats).toHaveBeenCalledWith({
      pool: 'jiang-chi-1',
      mode: 'dou-di-zhu',
      role: 'landlord',
    });
  });

  it('面板先交代这个身份的历史胜率（口径与记录页一致）', async () => {
    presetPageData({ mode: 'dou-di-zhu', pool: 'jiang-chi-1' });
    const wrapper = mountPage();
    await flushPromises();

    const rate = wrapper.find('.sheng-lv-bang__rate').text().replace(/\s+/g, '');
    // 将池名 / 模式 / 身份 / 胜率 / 原始战绩都在这一句里
    expect(rate).toContain('将池1');
    expect(rate).toContain('斗地主');
    expect(rate).toContain('地主');
    expect(rate).toContain('60.00%');
    expect(rate).toContain('3胜2负，共5场');
    // 历史口径：这个数把已离开该将池的武将也算在内（与表内只列在池武将不同），界面上写明
    expect(rate).toContain('含已离开该将池的武将');
  });

  it('表下脚注把「只列在池武将」限定在这张表上，不牵连上面那行历史胜率', async () => {
    presetPageData({ mode: 'dou-di-zhu', pool: 'jiang-chi-1' });
    const wrapper = mountPage();
    await flushPromises();

    const note = wrapper.find('.sheng-lv-bang__note').text().replace(/\s+/g, '');
    expect(note).toContain('表内只列目前仍在将池中的武将');
    expect(note).toContain('总场数=该武将在该身份下的胜场+败场');
  });

  it('该身份一场没打过时直说没有历史胜率，不画一个假的 0%', async () => {
    presetPageData({ mode: 'jun-zheng', pool: 'jiang-chi-3' });
    const wrapper = mountPage();
    await flushPromises();

    // 军争的忠臣那档只有 rate: null（默认停在主公，先切到忠臣）
    await wrapper.findAll('.tabs__tab')[1].trigger('mousedown');
    await wrapper.findAll('.tabs__tab')[1].trigger('click');
    await flushPromises();

    const rate = wrapper.find('.sheng-lv-bang__rate').text();
    expect(rate).toContain('还没有战绩');
    expect(rate).not.toContain('0.00%');
  });

  it('表格画武将 / 总场数 / 胜率三列，列名与数据一律左对齐', async () => {
    presetPageData({ mode: 'dou-di-zhu', pool: 'jiang-chi-1' });
    const wrapper = mountPage();
    await flushPromises();

    const head = wrapper.findAll('.table__head .table__cell');
    expect(head.map(cell => cell.text())).toEqual(['武将', '总场数', '胜率']);
    expect(head.map(cell => cell.classes())).toEqual([
      ['table__cell', 'table__cell--left'],
      ['table__cell', 'table__cell--left'],
      ['table__cell', 'table__cell--left'],
    ]);

    const rows = wrapper.findAll('tbody .table__row');
    expect(rows).toHaveLength(2);
    expect(rows[0].findAll('.table__cell').map(cell => cell.text())).toEqual([
      '将马岱',
      '4',
      '75.00%',
    ]);
    // 0% 也要写全两位（后端给 0 是「打了全输」，不是「没打过」）
    expect(rows[1].findAll('.table__cell').map(cell => cell.text())).toEqual([
      '界周瑜',
      '1',
      '0.00%',
    ]);
  });

  it('该身份下的武将全都画出来，不截断（后端不传 limit）', async () => {
    presetPageData({ mode: 'dou-di-zhu', pool: 'jiang-chi-1' });
    api.listHeroStats.mockResolvedValue(
      Array.from({ length: 42 }, (_, index) => ({
        hero: `武将${index + 1}`,
        win: 1,
        lose: index,
        games: index + 1,
        rate: 100 / (index + 1),
      }))
    );

    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.findAll('tbody .table__row')).toHaveLength(42);
    expect(api.listHeroStats).toHaveBeenCalledWith({
      pool: 'jiang-chi-1',
      mode: 'dou-di-zhu',
      role: 'landlord',
    });
  });

  it('页签下只有历史胜率那一行说明，不再点名武将', async () => {
    presetPageData({ mode: 'dou-di-zhu', pool: 'jiang-chi-1' });
    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.find('.sheng-lv-bang__rank').exists()).toBe(false);
    expect(wrapper.find('.sheng-lv-bang__panel').text()).not.toContain('前 30');
  });

  it('切页签换身份：重新按新身份问一次榜单', async () => {
    presetPageData({ mode: 'dou-di-zhu', pool: 'jiang-chi-1' });
    const wrapper = mountPage();
    await flushPromises();

    api.listHeroStats.mockClear();
    await wrapper.findAll('.tabs__tab')[1].trigger('mousedown');
    await wrapper.findAll('.tabs__tab')[1].trigger('click');
    await flushPromises();

    expect(api.listHeroStats).toHaveBeenCalledTimes(1);
    expect(api.listHeroStats).toHaveBeenCalledWith({
      pool: 'jiang-chi-1',
      mode: 'dou-di-zhu',
      role: 'farmer',
    });
  });

  it('换模式换一整套身份，旧身份不带过去', async () => {
    presetPageData({ mode: 'dou-di-zhu', pool: 'jiang-chi-1' });
    const wrapper = mountPage();
    await flushPromises();

    // 页面数据里的模式变了（等价于用户在「模式」下拉里换了军争）
    localStorage.setItem(
      PAGE_PATH,
      JSON.stringify({ mode: 'jun-zheng', pool: 'jiang-chi-1' })
    );
    wrapper.vm.mode = 'jun-zheng';
    await flushPromises();

    expect(wrapper.findAll('.tabs__tab').map(tab => tab.text())).toEqual([
      '主公',
      '忠臣',
      '反贼',
      '内奸',
    ]);
    expect(api.listHeroStats).toHaveBeenLastCalledWith({
      pool: 'jiang-chi-1',
      mode: 'jun-zheng',
      role: 'lord',
    });
  });

  it('榜单为空时说清楚是空，而不是留一张没有内容的表', async () => {
    presetPageData({ mode: 'dou-di-zhu', pool: 'jiang-chi-1' });
    api.listHeroStats.mockResolvedValue([]);

    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.find('.table__empty').text()).toBe('该身份下还没有武将战绩');
    expect(wrapper.findAll('tbody .table__row')).toHaveLength(1);
  });
});
