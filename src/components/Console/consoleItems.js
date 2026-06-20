import { defineAsyncComponent } from 'vue'

/** 控制台区域标识 — 决定条目渲染到哪个布局区块 */
export const Zone = Object.freeze({
  APPEARANCE: 'appearance',
})

/**
 * 控制台条目注册表 — 单一事实源
 *
 * 扩展只需在此数组追加条目：
 *   { id, zone: Zone.XXX, component: () => import('...') }
 *
 * Index.vue 自动按 zone 分组渲染，无需改动模板。
 */
export const consoleItems = [
  {
    id: 'theme-toggle',
    zone: Zone.APPEARANCE,
    component: defineAsyncComponent(() => import('./components/ThemeToggle.vue')),
  },
]
