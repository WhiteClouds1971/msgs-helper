/**
 * 菜单访问顺序 — 主页卡片堆的展示顺序（单一事实源）
 *
 * 策略（见 docs/superpowers/specs/2026-06-19-v2-layout-redesign-design.md 2.4）：
 * 首次按 menus.js 注册顺序，之后最近访问的排在最前。
 *
 * 顺序随「主页的页面数据」一起持久化（key = 主页路由 path），所以控制台在主页上
 * 「清除本页数据」删掉的就是它，重挂载即回默认顺序。
 *
 * 记录入口只有一个 —— App.vue 监听 meta.code：主页卡片点击、全局搜索、直链/刷新
 * 一视同仁，页面各自 push 时不用管顺序。
 */
import { computed } from 'vue';
import { defineStore } from 'pinia';
import menus from '@/constants/menus';
import { useLocalStorage } from '@/stores/localStorage';

/** 主页路由 path —— 顺序数据的存放位置（即主页页面数据的 key） */
export const HOME_PATH = '/';

/** 默认顺序码：menus.js 的注册顺序 */
export function defaultOrder() {
  return menus.map(menu => menu.code);
}

/**
 * 把 code 提到最前 — 纯函数，返回新数组
 *
 * 已在首位、或不在表内（未知 code）时**原样返回同一个数组**，不凭空插入，
 * 调用方据此跳过无意义的写入。
 */
export function promote(codes, code) {
  const idx = codes.indexOf(code);
  if (idx <= 0) return codes;
  return [code, ...codes.slice(0, idx), ...codes.slice(idx + 1)];
}

/** 顺序码 → 菜单对象：不在注册表里的 code（菜单已下线）丢弃 */
export function resolveMenus(codes) {
  const map = new Map(menus.map(menu => [menu.code, menu]));
  return codes.map(code => map.get(code)).filter(Boolean);
}

export const useMenuOrder = defineStore('menuOrder', () => {
  const ls = useLocalStorage();

  /**
   * 确保顺序数据已就绪 — 幂等（已载入则跳过）
   *
   * 主页重挂载时会再调一次：清除本页数据删掉的是缓存里的条目，
   * 那时只有重新 load 才能补回默认顺序。
   */
  function loadOrder() {
    ls.load(HOME_PATH, { order: defaultOrder() });
  }
  loadOrder();

  /**
   * 顺序码（响应式：任何一处改动都驱动主页重排）
   *
   * 缓存里没有条目时退回默认顺序 —— 清除本页数据会把它删掉，而主页要在那一刻
   * 立刻有卡片可画（否则过渡期间会闪一下空卡堆）。
   */
  const codes = computed(() => ls.cache[HOME_PATH]?.order ?? defaultOrder());

  /** 主页卡片顺序 */
  const ordered = computed(() => resolveMenus(codes.value));

  /** 记一次访问：把该菜单提到最前（已是第一或未知 code 则不动） */
  function record(code) {
    loadOrder();
    const data = ls.cache[HOME_PATH];
    data.order = promote(data.order, code);
  }

  return { codes, ordered, loadOrder, record };
});
