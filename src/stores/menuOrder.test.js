import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import menus from '@/constants/menus';
import { useLocalStorage } from '@/stores/localStorage';
import {
  defaultOrder,
  HOME_PATH,
  promote,
  resolveMenus,
  useMenuOrder,
} from '@/stores/menuOrder';

// useLocalStorage 的 setup 要取当前路由；测试里没有组件上下文，给个壳免得 inject() 报警
vi.mock('vue-router', () => ({ useRoute: () => ({ fullPath: HOME_PATH }) }));

describe('defaultOrder', () => {
  it('首次顺序就是 menus.js 的注册顺序', () => {
    expect(defaultOrder()).toEqual(menus.map(menu => menu.code));
  });
});

describe('promote', () => {
  it('把命中的 code 提到最前，其余保持相对顺序', () => {
    expect(promote(['a', 'b', 'c', 'd'], 'c')).toEqual(['c', 'a', 'b', 'd']);
    expect(promote(['a', 'b', 'c', 'd'], 'd')).toEqual(['d', 'a', 'b', 'c']);
  });

  it('已在首位或不在表内都不动，且返回同一个数组（调用方据此跳过写入）', () => {
    const list = ['a', 'b', 'c'];
    expect(promote(list, 'a')).toBe(list);
    expect(promote(list, 'zzz')).toBe(list);
  });

  it('不改入参', () => {
    const list = ['a', 'b', 'c'];
    promote(list, 'c');
    expect(list).toEqual(['a', 'b', 'c']);
  });
});

describe('resolveMenus', () => {
  it('按顺序码取出菜单对象', () => {
    const codes = [menus[2].code, menus[0].code];
    expect(resolveMenus(codes).map(menu => menu.code)).toEqual(codes);
  });

  it('菜单已下线（码表里的陌生 code）时丢弃，不产出空洞', () => {
    const codes = ['cun-gui', 'mei-you-zhe-ge-cai-dan'];
    expect(resolveMenus(codes).map(menu => menu.code)).toEqual(['cun-gui']);
  });
});
describe('useMenuOrder（store）', () => {
  let ls;

  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
    ls = useLocalStorage();
  });

  it('首次读取即按注册顺序，并把顺序落进主页页面数据', () => {
    const store = useMenuOrder();
    expect(store.ordered.map(menu => menu.code)).toEqual(defaultOrder());
    expect(ls.cache[HOME_PATH].order).toEqual(defaultOrder());
  });

  it('record 把访问过的菜单提到最前 —— 从任何页面记都一样', async () => {
    const store = useMenuOrder();
    const target = menus[4].code;

    store.record(target);
    await nextTick();

    expect(store.ordered[0].code).toBe(target);
    expect(store.ordered).toHaveLength(menus.length);
    // 落盘：下次进主页读到的就是新顺序
    expect(JSON.parse(localStorage.getItem(HOME_PATH)).order[0]).toBe(target);
  });

  it('清除本页数据后立刻回默认顺序（过渡期间也不空），重挂载后落回默认数据', () => {
    const store = useMenuOrder();
    store.record(menus[4].code);
    expect(store.ordered[0].code).toBe(menus[4].code);

    ls.clearPage(HOME_PATH);
    expect(store.ordered.map(menu => menu.code)).toEqual(defaultOrder());

    store.loadOrder();
    expect(ls.cache[HOME_PATH].order).toEqual(defaultOrder());
  });
});
