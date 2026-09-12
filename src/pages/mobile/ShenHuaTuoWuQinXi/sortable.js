/**
 * 技能牌排序的纯几何计算 —— 神华佗页面的拖拽交互专用
 *
 * 与 DOM 无关，便于单独测试。拖拽只回答两个问题：
 *   1. 被拖项的中心落到「其余项」中的哪个插入位置（resolveInsertIndex）
 *   2. 其余项各要让出多少像素（shiftFor）
 * 让位量与提交后的真实布局一致，故松手清掉 transform 不会跳版。
 */

/** 把 from 处的元素搬到 to 处，返回新数组（不改入参） */
export function moveItem(list, from, to) {
  const next = list.slice()
  const size = next.length
  if (from < 0 || from >= size || to < 0 || to >= size || from === to) return next
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

/** 相邻两项之间的间距（列表外边距统一，用首两项推算） */
export function measureGap(rects) {
  if (rects.length < 2) return 0
  return Math.max(0, rects[1].top - (rects[0].top + rects[0].height))
}

/**
 * 插入位置：被拖项中心越过了其余项中多少个的中心
 *
 * @param {{top:number,height:number}[]} rects 拖拽开始时的各原生布局（不含 transform）
 * @param {number} from 被拖项下标
 * @param {number} centerY 被拖项当前视觉中心（视口坐标）
 * @returns {number} 目标下标 —— 因被拖项已从原位摘下，该值同时就是它在完整数组里的最终下标
 */
export function resolveInsertIndex(rects, from, centerY) {
  let insert = 0
  for (let i = 0; i < rects.length; i++) {
    if (i === from) continue
    const rect = rects[i]
    if (centerY > rect.top + rect.height / 2) insert += 1
  }
  return insert
}

/**
 * 让位平移量：被拖项摘下腾出的空间 = 自身高度 + 一个间距
 * 落在 (from, to] 的项上移，落在 [to, from) 的项下移，其余不动。
 */
export function shiftFor(index, from, to, step) {
  if (index === from) return 0
  if (index > from && index <= to) return -step
  if (index < from && index >= to) return step
  return 0
}
