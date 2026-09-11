import { describe, expect, it } from 'vitest'
import { normalizeAspect, planGallery, splitRows } from './layout'

/** 竖版牌面（大旗牌面 1200×1677） */
const portrait = (i = 0) => ({ src: `front-${i}.webp`, aspect: 1200 / 1677 })
/** 横版封面（仓库现有菜单封面 1915×1080） */
const landscape = (i = 0) => ({ src: `cover-${i}.webp`, aspect: 1915 / 1080 })
/** 手机竖屏可用区（390 宽去页面留白与裱边） */
const PHONE = { width: 374, height: 826 }

function cells(plan) {
  return plan.rows.flatMap(row => row.items)
}

describe('normalizeAspect', () => {
  it('保留合法宽高比', () => {
    expect(normalizeAspect(0.716)).toBeCloseTo(0.716, 5)
    expect(normalizeAspect('1.5')).toBeCloseTo(1.5, 5)
  })

  it('非法值回退（未知宽高比不能把布局算崩）', () => {
    expect(normalizeAspect(0)).toBe(1)
    expect(normalizeAspect(-2)).toBe(1)
    expect(normalizeAspect(undefined)).toBe(1)
    expect(normalizeAspect(NaN, 0.75)).toBe(0.75)
    expect(normalizeAspect('x', 0.75)).toBe(0.75)
  })
})

describe('splitRows', () => {
  it('默认一行一张（多图逐张铺满宽度）', () => {
    expect(splitRows(3, 1)).toEqual([1, 1, 1])
    expect(splitRows(3)).toEqual([1, 1, 1])
  })

  it('可排成网格，末行允许不满', () => {
    expect(splitRows(5, 2)).toEqual([2, 2, 1])
    expect(splitRows(4, 4)).toEqual([4])
  })
})

describe('planGallery', () => {
  it('空图集不产出行', () => {
    const plan = planGallery({ images: [], ...PHONE })
    expect(plan.rows).toEqual([])
    expect(plan.width).toBe(0)
  })

  it('未测量（首帧）时给出降级方案，且不丢图', () => {
    const plan = planGallery({ images: [portrait(), portrait()], width: 0, height: 0 })
    expect(plan.rows).toHaveLength(2)
    expect(cells(plan).map(c => c.index)).toEqual([0, 1])
  })

  it('约束①：任何图片都不被裁切（渲染尺寸保持自身宽高比）', () => {
    const plan = planGallery({ images: [portrait(0), landscape(), portrait(1)], ...PHONE })
    for (const cell of cells(plan)) {
      expect(cell.width / cell.height).toBeCloseTo(cell.aspect, 3)
    }
  })

  it('单图：一屏放得下 → 铺满宽度且完整可见，无需滚动', () => {
    const plan = planGallery({ images: [portrait()], ...PHONE })
    expect(plan.mode).toBe('fit')
    expect(plan.scale).toBe(1)
    expect(plan.width).toBeCloseTo(PHONE.width, 5)
    expect(plan.height).toBeLessThanOrEqual(PHONE.height)
  })

  it('单图：比容器还高的图等比缩到完整可见（contain，一页展示完）', () => {
    const tall = [{ src: 'tall.webp', aspect: 0.3 }]
    const plan = planGallery({ images: tall, ...PHONE })
    expect(plan.mode).toBe('fit')
    expect(plan.scale).toBeLessThan(1)
    expect(plan.height).toBeCloseTo(PHONE.height, 5)
    expect(plan.width).toBeLessThanOrEqual(PHONE.width + 0.001)
  })

  it('单图：缩下去会小到看不清（低于 minScale）时改为铺满宽度滚动', () => {
    const long = [{ src: 'long.webp', aspect: 0.12 }]
    const plan = planGallery({ images: long, ...PHONE })
    expect(plan.mode).toBe('scroll')
    expect(plan.scale).toBe(1)
    expect(plan.width).toBeCloseTo(PHONE.width, 5)
    expect(plan.height).toBeGreaterThan(PHONE.height)
  })

  it('多图：逐张铺满宽度、纵向滚动（不为了塞进一屏而缩小）', () => {
    const plan = planGallery({ images: [portrait(0), portrait(1)], ...PHONE })
    expect(plan.mode).toBe('scroll')
    expect(plan.scale).toBe(1)
    expect(plan.rows).toHaveLength(2)
    expect(plan.rows.every(row => row.items.length === 1)).toBe(true)
    // 每张图都铺满容器宽度
    for (const cell of cells(plan)) {
      expect(cell.width).toBeCloseTo(PHONE.width, 5)
    }
    expect(plan.height).toBeGreaterThan(PHONE.height)
  })

  it('多图：恰好一屏放得下时居中显示、不滚动', () => {
    const images = [landscape(0), landscape(1), landscape(2)]
    const plan = planGallery({ images, ...PHONE })
    expect(plan.mode).toBe('fit')
    expect(plan.scale).toBe(1)
    expect(plan.height).toBeLessThanOrEqual(PHONE.height)
  })

  it('多图也不裁切：滚动模式下依然保持各自宽高比', () => {
    const plan = planGallery({ images: [portrait(0), landscape(), portrait(1)], ...PHONE })
    expect(plan.mode).toBe('scroll')
    for (const cell of cells(plan)) {
      expect(cell.width / cell.height).toBeCloseTo(cell.aspect, 3)
    }
  })

  it('maxPerRow > 1 时排成网格，且每行横向铺满、行内无空白', () => {
    const images = [portrait(0), portrait(1), portrait(2)]
    const plan = planGallery({ images, ...PHONE, maxPerRow: 2 })
    expect(plan.rows).toHaveLength(2)
    expect(plan.rows[0].items).toHaveLength(2)
    for (const row of plan.rows) {
      const used = row.items.reduce((sum, cell) => sum + cell.width, 0)
      const gaps = plan.gap * (row.items.length - 1)
      expect(used + gaps).toBeCloseTo(plan.width, 1)
    }
  })
})
