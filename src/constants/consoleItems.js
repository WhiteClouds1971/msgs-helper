import { defineAsyncComponent } from 'vue'

/** 控制台区域标识 — 决定条目渲染到哪个布局区块 */
export const Zone = Object.freeze({
  APPEARANCE: 'appearance',
})

/**
 * 控制台条目注册表 — 单一事实源
 *
 * 字段：
 *   id        — 唯一标识
 *   zone      — 目标布局区块（Zone.XXX）
 *   colSpan   — 宽度占几列（默认 4 = 满行）
 *   rowSpan   — 高度占几个单位方格（默认 1 = 自动高度）
 *   component — 异步组件加载函数
 *
 * Index.vue 自动按 zone 分组 + 网格布局渲染，无需改动模板。
 */
export const consoleItems = [
  {
    id: 'theme-toggle',
    zone: Zone.APPEARANCE,
    colSpan: 2,
    component: defineAsyncComponent(() => import('@/components/Console/components/ThemeToggle.vue')),
  },
]
