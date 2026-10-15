import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * 骆统 勤政页 —— 数到哪一档、摇出哪一张、刷新后还是不是那一张
 *
 * 摇牌用的是真随机（@/utils/random），用例里换成一个「按剧本出货」的假摇：
 * 摇过几次数得清、摇到哪张由用例指定，于是「该摇的时候摇了、不该摇的时候没摇」
 * 才能断言得干脆 —— 这正是本页两处最容易错的地方（刷新重摇、清除不清牌）。
 *
 * 数是从页面数据（localStorage，key = 路由 fullPath）恢复的，所以用例直接往
 * localStorage 里塞一个数，等价于「这一局数到这儿了」。
 */
const random = vi.hoisted(() => ({ queue: [], calls: 0 }));

vi.mock('@/utils/random', () => ({
  weightedPick: pool => {
    random.calls += 1;
    // 点名的那张不在这档的候选里（用例写串了档）就退回这档第一张 ——
    // 免得造出页面里根本不可能出现的结果（比如 5 张档摇出【杀】）
    const named = random.queue.shift();
    const name = pool.some(card => card.name === named) ? named : pool[0].name;
    return [{ name }];
  },
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({ fullPath: '/heroes/luo-tong' }),
}));

import Index from './Index.vue';

const PAGE_PATH = '/heroes/luo-tong';

/** 三档各自的候选牌（与页面里的 TIERS 对齐） */
const TIER_CARDS = [
  ['杀', '闪'],
  ['桃', '酒'],
  ['无中生有', '决斗'],
];

/** 塞一份页面数据，等价于上一局数到了 N 张 */
function presetQty(qty) {
  localStorage.setItem(PAGE_PATH, JSON.stringify({ qty }));
}

/** 读回页面数据（刷新后真正读到的那份） */
const storedPage = () => JSON.parse(localStorage.getItem(PAGE_PATH));

function mountPage() {
  return mount(Index);
}

/** 模拟刷新：换一个干净的 pinia（内存缓存作废），只认 localStorage 里那份数据 */
function remountAsReloaded() {
  setActivePinia(createPinia());
  return mountPage();
}

/** 当前亮着的档位（读那一行左边的「每 N 张」） */
const reachedTiers = wrapper =>
  wrapper
    .findAll('.lt-tier.is-reached')
    .map(row => row.find('.lt-tier__every').text());

/** 每一行两枚牌签的牌名 */
const tierNames = wrapper =>
  wrapper
    .findAll('.lt-tier__cards')
    .map(cards => cards.findAll('.playing-card').map(card => card.text()));

/** 摇中的那一枚（没摇到就一个也没有） */
const gainedNames = wrapper =>
  wrapper.findAll('.playing-card.is-selected').map(card => card.text());

describe('骆统 勤政页', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
    random.queue = [];
    random.calls = 0;
  });

  it('三档各画一行，候选牌就是勤政的那三对', () => {
    const wrapper = mountPage();

    expect(
      wrapper.findAll('.lt-tier').map(row => row.find('.lt-tier__every').text())
    ).toEqual(['每 3 张', '每 5 张', '每 8 张']);
    expect(tierNames(wrapper)).toEqual(TIER_CARDS);
  });

  it('一张牌没出时谁也不亮，也没摇过牌', () => {
    const wrapper = mountPage();

    expect(reachedTiers(wrapper)).toEqual([]);
    expect(gainedNames(wrapper)).toEqual([]);
    expect(random.calls).toBe(0);
  });

  it('数到 3：第一档亮，两枚候选里摇中一枚', () => {
    random.queue = ['闪'];
    presetQty(3);
    const wrapper = mountPage();

    expect(reachedTiers(wrapper)).toEqual(['每 3 张']);
    expect(gainedNames(wrapper)).toEqual(['闪']);
    expect(TIER_CARDS[0]).toContain(gainedNames(wrapper)[0]);
  });

  it('数到 8：只亮第三档，摇的是第三档那一对', () => {
    random.queue = ['无中生有'];
    presetQty(8);
    const wrapper = mountPage();

    expect(reachedTiers(wrapper)).toEqual(['每 8 张']);
    expect(TIER_CARDS[2]).toContain(gainedNames(wrapper)[0]);
  });

  it('没到档就不摇：数到 7 一个亮的都没有，一次也没摇', () => {
    presetQty(7);
    const wrapper = mountPage();

    expect(reachedTiers(wrapper)).toEqual([]);
    expect(gainedNames(wrapper)).toEqual([]);
    expect(random.calls).toBe(0);
  });

  it('120 张是三档的公倍数：三档一起亮，各摇各的', () => {
    presetQty(120);
    const wrapper = mountPage();

    expect(reachedTiers(wrapper)).toEqual(['每 3 张', '每 5 张', '每 8 张']);
    const gained = gainedNames(wrapper);
    expect(gained).toHaveLength(3);
    // 每一档摇中的那张，都得落在本档的两张候选里
    expect(gained.every((name, i) => TIER_CARDS[i].includes(name))).toBe(true);
    expect(random.calls).toBe(3);
  });

  it('刷新不会重新摇：摇到的牌跟数一起存着，读到的是同一张', async () => {
    random.queue = ['闪'];
    presetQty(3);
    const wrapper = mountPage();

    expect(gainedNames(wrapper)).toEqual(['闪']);
    expect(random.calls).toBe(1);

    // 落盘：摇牌记的是「哪一档、数到第几张时摇的、摇到哪张」
    await flushPromises();
    expect(storedPage()).toEqual({
      qty: 3,
      rolls: { 3: { qty: 3, card: '闪' } },
    });

    // 刷新（内存缓存作废，只剩 localStorage 那份）
    wrapper.unmount();
    const reloaded = remountAsReloaded();

    expect(gainedNames(reloaded)).toEqual(['闪']);
    expect(random.calls).toBe(1);
  });

  it('同一次计数里怎么重渲染都不重摇，回退再进同一档也照旧', async () => {
    random.queue = ['桃'];
    presetQty(5);
    const wrapper = mountPage();
    expect(gainedNames(wrapper)).toEqual(['桃']);

    wrapper.vm.$forceUpdate();
    await wrapper.vm.$nextTick();
    wrapper.vm.$forceUpdate();
    await wrapper.vm.$nextTick();
    expect(gainedNames(wrapper)).toEqual(['桃']);

    // 5 → 4 → 5：同一档的同一处，摇过的就是摇过了
    await wrapper.find('.stepper__btn--minus').trigger('click');
    await wrapper.find('.stepper__btn--plus').trigger('click');

    expect(gainedNames(wrapper)).toEqual(['桃']);
    expect(random.calls).toBe(1);
  });

  it('数往前走一档会重摇：3 张摇一次、6 张再摇一次', async () => {
    // 队列按摇的顺序排：3 张档 → 路过 5 张档 → 6 张上再摇 3 张档
    random.queue = ['杀', '桃', '闪'];
    presetQty(3);
    const wrapper = mountPage();
    expect(gainedNames(wrapper)).toEqual(['杀']);

    // 3 → 6：同一个档位上的下一次触发
    for (let i = 0; i < 3; i++) {
      await wrapper.find('.stepper__btn--plus').trigger('click');
    }

    expect(reachedTiers(wrapper)).toEqual(['每 3 张']);
    expect(gainedNames(wrapper)).toEqual(['闪']);
    expect(random.calls).toBe(3);
  });

  it('清除：数与摇过的牌一起清掉（新一局到档重新摇）', async () => {
    random.queue = ['杀', '闪'];
    presetQty(3);
    const wrapper = mountPage();
    expect(gainedNames(wrapper)).toEqual(['杀']);

    await wrapper.find('.luo-tong__actions button').trigger('click');

    expect(storedPage()).toEqual({ qty: 0, rolls: {} });
    expect(reachedTiers(wrapper)).toEqual([]);
    expect(gainedNames(wrapper)).toEqual([]);

    // 新一局数回 3：重新摇（上一局摇到的杀不该跟过来）
    for (let i = 0; i < 3; i++) {
      await wrapper.find('.stepper__btn--plus').trigger('click');
    }

    expect(gainedNames(wrapper)).toEqual(['闪']);
    expect(random.calls).toBe(2);
  });

  it('加一张：数落进页面数据，牌面跟着重算', async () => {
    const wrapper = mountPage();

    await wrapper.find('.stepper__btn--plus').trigger('click');

    expect(storedPage().qty).toBe(1);
  });

  it('数到 3 再往下走一张：第一档收回去，摇过的牌也不再亮着', async () => {
    random.queue = ['杀'];
    presetQty(3);
    const wrapper = mountPage();
    expect(gainedNames(wrapper)).toEqual(['杀']);

    await wrapper.find('.stepper__btn--plus').trigger('click');

    expect(reachedTiers(wrapper)).toEqual([]);
    expect(gainedNames(wrapper)).toEqual([]);
  });

  it('清除后按钮置灰；一张没出时本来就是灰的（没什么可清的）', async () => {
    random.queue = ['杀'];
    presetQty(8);
    const wrapper = mountPage();

    const button = wrapper.find('.luo-tong__actions button');
    expect(button.element.disabled).toBe(false);

    await button.trigger('click');

    expect(storedPage().qty).toBe(0);
    expect(wrapper.find('.luo-tong__actions button').element.disabled).toBe(
      true
    );

    expect(
      mountPage().find('.luo-tong__actions button').element.disabled
    ).toBe(true);
  });
});
