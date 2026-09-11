/**
 * 通用搜索工具库 —— Fuse 模糊检索 + 命中片段高亮
 *
 * 检索文本由调用方组装（汉字 + 拼音 + 首字母三路 keys），
 * 本模块只负责「怎么搜」「怎么高亮」。
 */
import Fuse from 'fuse.js'
import { pinyin } from 'pinyin-pro'

/**
 * Fuse 默认配置：容错阈值 0.3，兼顾错拼与误召回
 *
 * ignoreLocation —— 关掉 Fuse 默认的「命中位置越靠后、扣分越多」规则：
 * 检索文本是「名称 + 分类 + 全部 tags」拼起来的一长串（拼音串同理），
 * 位置惩罚会让排在后面的 tag（如「神速」的全拼 shensu）永远搜不到。
 * 关掉后得分只与错拼数有关，等价于「整串里找近似子串」。
 */
export const DEFAULT_FUSE_OPTIONS = {
  keys: ['keyword', 'pinyin', 'acronym'],
  threshold: 0.3,
  includeScore: true,
  useExtendedSearch: false,
  ignoreLocation: true,
}

/** 建索引（条目需自带 keyword / pinyin / acronym 字段） */
export function createSearchIndex(items, options = {}) {
  return new Fuse(items, { ...DEFAULT_FUSE_OPTIONS, ...options })
}

/**
 * 按关键词检索，并保证结果顺序与原始数据一致
 *
 * Fuse 默认按相关度排序，对「菜单在前、文档在后」这类人工顺序是干扰，
 * 因此这里按 refIndex 还原数据顺序。
 */
export function searchItemsByKeyword(keyword, fuse) {
  const normalized = String(keyword ?? '').trim()
  if (!normalized || !fuse) return []
  return fuse
    .search(normalized)
    .map(result => ({ item: result.item, refIndex: result.refIndex }))
    .sort((a, b) => a.refIndex - b.refIndex)
    .map(entry => entry.item)
}

/** 转义 HTML —— 片段经 v-html 注入前必须先过这一道 */
export function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** 转义正则元字符 */
export function escapeRegExp(text) {
  return String(text ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 找出文本中「被关键词命中」的汉字片段
 *
 * 关键词是汉字时直接返回；是拼音/首字母时，回溯出对应的汉字串，
 * 这样「cungui」也能在结果里高亮出「村规」。
 */
export function getHighlightWords(keyword, text) {
  const kw = String(keyword ?? '').trim().toLowerCase()
  const source = String(text ?? '')
  if (!kw) return []

  // 汉字关键词：原文里能直接找到就按原文高亮
  if (/[\u4e00-\u9fa5]/.test(kw)) {
    return source.toLowerCase().includes(kw) ? [kw] : []
  }

  // 纯拼音关键词：先从原文里直接找，再退回逐子串比对
  if (source.toLowerCase().includes(kw)) return [kw]

  // 逐子串算拼音开销大，长文本直接放弃（结果串不标红，仍展示上下文）
  if (source.length >= 20) return []

  for (let i = 0; i < source.length; i++) {
    for (let j = i + 1; j <= source.length; j++) {
      const sub = source.slice(i, j)
      if (!/[\u4e00-\u9fa5]/.test(sub)) continue

      const full = pinyin(sub, { toneType: 'none', type: 'array' }).join('').toLowerCase()
      const acronym = pinyin(sub, {
        toneType: 'none',
        pattern: 'first',
        type: 'array',
      })
        .join('')
        .toLowerCase()

      if (full.startsWith(kw) || acronym.startsWith(kw)) return [sub]
    }
  }

  return []
}

/** 在已转义的文本里把命中词包上 <mark> */
function markWords(text, words) {
  let html = escapeHtml(text)
  for (const word of words) {
    if (!word) continue
    const re = new RegExp(`(${escapeRegExp(escapeHtml(word))})`, 'gi')
    html = html.replace(re, '<mark>$1</mark>')
  }
  return html
}

/**
 * 生成结果行的命中片段（已含 <mark>，可直接 v-html）
 *
 * 以第一个命中词为中心截取窗口，命中未知时退回开头一截。
 */
export function highlightSnippet(text, keyword, options = {}) {
  const { maxLength = 72, radius = 18 } = options
  const source = String(text ?? '').trim()
  if (!source) return ''

  const words = getHighlightWords(keyword, source)

  let hit = null
  for (const word of words) {
    const index = source.toLowerCase().indexOf(String(word).toLowerCase())
    if (index >= 0) {
      hit = { index, length: String(word).length }
      break
    }
  }

  let start = hit ? Math.max(0, hit.index - radius) : 0
  let end = Math.min(source.length, start + maxLength)
  if (hit && hit.index + hit.length > end) {
    end = Math.min(source.length, hit.index + hit.length + radius)
    start = Math.max(0, end - maxLength)
  }

  const body = markWords(source.slice(start, end), words)
  return `${start > 0 ? '…' : ''}${body}${end < source.length ? '…' : ''}`
}
