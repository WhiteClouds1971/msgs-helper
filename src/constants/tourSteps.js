/**
 * 教学导览步骤注册表 — 单一事实源
 *
 * 每个导览是一个 { steps, ...hooks } 对象（向下兼容纯 steps[] 数组）。
 *
 * Step 字段：
 *   element  — CSS 选择器（目标元素）
 *   popover  — { title, description, side?, align? }
 *   onEnter  — 进入步骤时执行的脚本（可选）
 *   onLeave  — 离开步骤时执行的脚本（可选）
 *
 * Tour 级钩子（均可选）：
 *   onBeforeStart   — 教学开始前执行一次
 *   onBoundaryArrow — 点击首步 ◀ 或末步 ▶（已是边界无法翻页）时执行，参数 ('left'|'right')
 *
 * 添加教程：下面和 tourKeys.js 同步追加 key，组件中 start(TourKeys.XXX) 即可。
 */
export const tourSteps = Object.freeze({
  home: Object.freeze({
    steps: Object.freeze([
      {
        element: '#card-stack',
        popover: {
          title: '操作指引',
          description: '左右拖动切换菜单，点击前置卡片进入详情。',
        },
      },
    ]),
  }),
});
