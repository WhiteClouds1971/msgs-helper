/**
 * ImageGallery 排布算法 —— 纯函数，无 DOM 依赖，可单测
 *
 * 两条硬约束（按优先级）：
 *   ① 图片完整展示 —— 只做等比缩放，永不裁切、永不拉伸
 *   ② 图片铺满组件宽度 —— 不为了「塞进一屏」而把图缩小、四周留白
 *
 * 排布策略：
 *   · 单图 —— 尽量一屏展示完：等比缩放到完整放进容器（contain），居中；
 *     只有当这样缩下去会小到看不清（低于 minScale）时，才改为铺满宽度、纵向滚动。
 *   · 多图 —— 逐张铺满宽度、纵向滚动查看（多图缩小挤进一屏会看不清，
 *     所以宁可滑动）；若所有图恰好一屏放得下，自然就不需要滚动，此时居中显示。
 *   · 一行内的图片「等高铺满」：行高 = (容器宽 − 行内间距) / 该行宽高比之和，
 *     每张图宽度按自身宽高比分配 —— 行内既没有横向空白，也没有裁切。
 *     设 maxPerRow > 1 可排成网格，每行依然横向铺满。
 */

/** 宽高比下限，低于此值视为无效（退化成长条会把布局算崩） */
const MIN_ASPECT = 0.05

/** 宽高比兜底：非法值回退到 fallback */
export function normalizeAspect(value, fallback = 1) {
  const aspect = Number(value)
  return Number.isFinite(aspect) && aspect > MIN_ASPECT ? aspect : fallback
}

/** 按 maxPerRow 切分：多图默认一行一张（铺满宽度） */
export function splitRows(count, maxPerRow = 1) {
  const cap = Math.min(Math.max(1, Math.floor(maxPerRow) || 1), count)
  const split = []
  let rest = count
  while (rest > 0) {
    const take = Math.min(cap, rest)
    split.push(take)
    rest -= take
  }
  return split
}

/** 按切分方案算出外接框（未缩放） */
function buildRows(split, items, width, gap) {
  const rows = []
  let cursor = 0

  for (const count of split) {
    const rowItems = items.slice(cursor, cursor + count)
    cursor += count
    const aspectSum = rowItems.reduce((sum, item) => sum + item.aspect, 0)
    // 行内铺满：Σ(宽高比 × 行高) + 行内间距 = 容器宽 → 行高 = (宽 − 间距) / Σ宽高比
    const rowWidth = Math.max(width * 0.1, width - gap * (count - 1))
    rows.push({ items: rowItems, height: rowWidth / aspectSum })
  }

  const total =
    rows.reduce((sum, row) => sum + row.height, 0) + gap * Math.max(0, rows.length - 1)

  return { rows, total }
}

/** 缩放后把尺寸落到每一张图上 */
function materialize(rows, scale, gap, width, mode) {
  const planWidth = width * scale

  return {
    mode,
    scale,
    gap: gap * scale,
    width: planWidth,
    height: (rows.reduce((sum, row) => sum + row.height, 0) + gap * Math.max(0, rows.length - 1)) * scale,
    rows: rows.map(row => ({
      height: row.height * scale,
      items: row.items.map(item => ({
        image: item.image,
        index: item.index,
        aspect: item.aspect,
        // 行内每张图按自身宽高比分行高，横向铺满且互不挤压
        width: item.aspect * row.height * scale,
        height: row.height * scale,
      })),
    })),
  }
}

/** 未测量（首帧）时的降级方案：单列铺开，保证 <img> 先挂进 DOM 开始加载 */
function fallbackPlan(items, gap) {
  return {
    mode: 'fit',
    scale: 1,
    gap,
    width: 0,
    height: 0,
    rows: items.map(item => ({
      height: null,
      items: [{ image: item.image, index: item.index, aspect: item.aspect, width: null, height: null }],
    })),
  }
}

/**
 * @param {object}   options
 * @param {Array}    options.images     [{ src, alt?, caption?, aspect? }]
 * @param {number}   options.width      可用宽度（px，已扣除外框 padding）
 * @param {number}   options.height     可用高度（px）
 * @param {number}   options.gap        图间距（px）
 * @param {number}   options.maxPerRow  每行最多几张；默认 1 = 逐张铺满宽度
 * @param {number}   options.minScale   单图 contain 的最小缩放比，低于则改为滚动
 */
export function planGallery({
  images = [],
  width = 0,
  height = 0,
  gap = 8,
  maxPerRow = 1,
  minScale = 0.62,
} = {}) {
  const list = Array.isArray(images) ? images : []
  const items = list.map((image, index) => ({
    image,
    index,
    aspect: normalizeAspect(image && image.aspect, 1),
  }))

  if (items.length === 0) {
    return { mode: 'fit', scale: 1, gap, width: 0, height: 0, rows: [] }
  }

  if (!(width > 0) || !(height > 0)) return fallbackPlan(items, gap)

  const { rows, total } = buildRows(splitRows(items.length, maxPerRow), items, width, gap)

  // 单图：先试着完整放进一屏（contain）；缩得比 minScale 还小就改为滚动看大图
  if (items.length === 1) {
    const scale = Math.min(1, height / total)
    if (scale >= minScale) return materialize(rows, scale, gap, width, 'fit')
    return materialize(rows, 1, gap, width, 'scroll')
  }

  // 多图：铺满宽度纵向滚动；恰好一屏放得下就不滚（居中显示）
  return materialize(rows, 1, gap, width, total <= height ? 'fit' : 'scroll')
}

export default planGallery
