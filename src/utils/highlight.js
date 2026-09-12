/**
 * 落地定位工具库 —— 搜索点到的那一行，落地页据此在 DOM 里把「同一行」认出来
 *
 * 光有锚点文字不够：同一句话在一页里可能出现多次（承吕布页两张牌都写着
 * 「使用时机：出牌阶段。」），mark.js 标完全部命中后取「第一个」，必然指错人 ——
 * 点哪一条都跳到第一处，就是这么来的。
 *
 * 所以结果行除了锚点文字，还带一份**落点身份**（引擎算好，见 GlobalSearch/engine.js）：
 *   · section —— 它所在的正文块：那一节的标题（整篇渲染的文档取文档标题）
 *   · hit     —— 它在块内是同一句锚点的第几处（0 起，按文档顺序 = 块内 DOM 顺序）
 * 本模块把这份身份翻译成 DOM：先按标题找出正文块，再在块内取第 hit 处命中。
 */

/** 标题元素选择器（1–6 级都算，块标题按渲染后的文字比对） */
const HEADING_SELECTOR = 'h1,h2,h3,h4,h5,h6'

/**
 * 找正文块 —— 页面上标题为 section 的那一块
 *
 * MdViewer 把一节 Markdown 画进一个容器（标题是它的直接子元素），故取标题的父元素：
 * 块内的小标题（### 附：结算细则）自然还算在本块里。
 *
 * @param {Element|null} root - 页面根元素（搜索落地的定位范围）
 * @param {string} section - 落点身份里的块标题
 * @returns {Element|null} 找不到返回 null（页面还没渲染完 / 这份文档没写标题）
 */
export function findSectionBlock(root, section) {
  const wanted = String(section ?? '').trim()
  if (!root || !wanted) return null

  for (const heading of root.querySelectorAll(HEADING_SELECTOR)) {
    if (heading.textContent.trim() === wanted) return heading.parentElement
  }

  return null
}

/**
 * 取块内第 hit 处命中（mark.js 注入的 mark 按 DOM 顺序排列）
 *
 * 越界时退到块内最后一处：序号是照文档数的，真越界说明 DOM 与文档对不上，
 * 此时「落在正确的块里」仍比「一处都不落」有用。
 *
 * @param {Element|null} scope - 正文块（或整页）
 * @param {number} hit - 块内第几处（0 起）
 * @param {string} className - 命中标记的类名
 * @returns {Element|null} 块内没有命中返回 null（调用方换下一个候选锚点）
 */
export function pickHit(scope, hit, className) {
  if (!scope) return null

  const marks = scope.querySelectorAll(`mark.${className}`)
  if (!marks.length) return null

  const index = Number.isFinite(Number(hit)) ? Math.min(Math.max(Math.trunc(Number(hit)), 0), marks.length - 1) : 0
  return marks[index]
}

/**
 * 落地点 —— 这次高亮在哪个范围里找、算第几处
 *
 * section 找不到对应的块时（页面还没渲染完、或这份文档没标题）**不能**拿块内序号去套整页：
 * 序号失去参照物，只能退回「整页第一处」—— 即没有落点身份时的老行为。
 *
 * @param {Element|null} root - 页面根元素
 * @param {{ section?: string, hit?: number|string }} identity - URL 上带过来的落点身份
 * @returns {{ scope: Element|null, hit: number }}
 */
export function resolveLanding(root, { section = '', hit = 0 } = {}) {
  const block = findSectionBlock(root, section)
  if (block) return { scope: block, hit }

  return String(section ?? '').trim() ? { scope: root, hit: 0 } : { scope: root, hit }
}
