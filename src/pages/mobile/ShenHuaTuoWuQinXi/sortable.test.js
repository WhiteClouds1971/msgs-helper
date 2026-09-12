import { describe, expect, it } from 'vitest'
import { measureGap, moveItem, resolveInsertIndex, shiftFor } from './sortable.js'

/** 三项等高（80）+ 间距 12 的原始布局 */
const RECTS = [
  { top: 0, height: 80 },
  { top: 92, height: 80 },
  { top: 184, height: 80 },
]

describe('moveItem', () => {
  it('向后搬与向前搬都只改顺序', () => {
    const list = ['a', 'b', 'c', 'd']
    expect(moveItem(list, 0, 2)).toEqual(['b', 'c', 'a', 'd'])
    expect(moveItem(list, 3, 1)).toEqual(['a', 'd', 'b', 'c'])
  })

  it('越界与原地不动返回等值新数组，且不改入参', () => {
    const list = ['a', 'b', 'c']
    expect(moveItem(list, 1, 1)).toEqual(list)
    expect(moveItem(list, 0, 9)).toEqual(list)
    expect(moveItem(list, -1, 1)).toEqual(list)
    expect(moveItem(list, 0, 2)).not.toBe(list)
    expect(list).toEqual(['a', 'b', 'c'])
  })
})

describe('measureGap', () => {
  it('取首两项之间的空隙', () => {
    expect(measureGap(RECTS)).toBe(12)
  })

  it('不足两项时没有间距可言', () => {
    expect(measureGap([])).toBe(0)
    expect(measureGap([RECTS[0]])).toBe(0)
  })
})

describe('resolveInsertIndex', () => {
  it('中心越过多少个其余项的中心，就插到第几位', () => {
    // 被拖项是第 0 项：中心压到第 2 项中心（224）之前 → 落位 1
    expect(resolveInsertIndex(RECTS, 0, 200)).toBe(1)
    // 中心还没越过第 1 项中心（132）→ 回到首位
    expect(resolveInsertIndex(RECTS, 0, 100)).toBe(0)
    // 中心越过全部 → 落到末尾
    expect(resolveInsertIndex(RECTS, 0, 400)).toBe(2)
  })

  it('向上拖时同样成立', () => {
    expect(resolveInsertIndex(RECTS, 2, 10)).toBe(0)
    expect(resolveInsertIndex(RECTS, 2, 60)).toBe(1)
    expect(resolveInsertIndex(RECTS, 1, 300)).toBe(2)
  })

  it('落位值就是该元素在完整数组里的最终下标', () => {
    const list = ['a', 'b', 'c']
    expect(moveItem(list, 0, resolveInsertIndex(RECTS, 0, 200))).toEqual(['b', 'a', 'c'])
    expect(moveItem(list, 2, resolveInsertIndex(RECTS, 2, 10))).toEqual(['c', 'a', 'b'])
  })
})

describe('shiftFor', () => {
  it('下拖时中间项整体上移一个「自身高度 + 间距」', () => {
    expect(shiftFor(1, 0, 2, 92)).toBe(-92)
    expect(shiftFor(2, 0, 2, 92)).toBe(-92)
    expect(shiftFor(0, 0, 2, 92)).toBe(0)
  })

  it('上拖时中间项整体下移', () => {
    expect(shiftFor(1, 2, 0, 92)).toBe(92)
    expect(shiftFor(0, 2, 0, 92)).toBe(92)
    expect(shiftFor(2, 2, 0, 92)).toBe(0)
  })

  it('落位没变则谁也不动', () => {
    expect(shiftFor(0, 1, 1, 92)).toBe(0)
    expect(shiftFor(2, 1, 1, 92)).toBe(0)
  })
})
