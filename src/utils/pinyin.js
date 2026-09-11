/**
 * 拼音工具 —— 把汉字转成无声调全拼与首字母缩写
 *
 * 用法：全局搜索建索引时对每个条目的检索文本预计算，
 * 于是「夏侯渊」「xiahouyuan」「xhy」都能搜到同一条目。
 */
import { pinyin } from 'pinyin-pro'

/**
 * @param {string} text - 原始文本（可含 HTML 标签，会被剥离）
 * @returns {{ pinyin: string, acronym: string }} 全拼与首字母缩写（均无声调、小写）
 */
export function convertChineseToPinyin(text) {
  const clean = String(text ?? '').replace(/<[^>]*>/g, '')

  const full = pinyin(clean, { toneType: 'none', type: 'array' }).join('')
  const acronym = pinyin(clean, {
    toneType: 'none',
    pattern: 'first',
    type: 'array',
  }).join('')

  return { pinyin: full.toLowerCase(), acronym: acronym.toLowerCase() }
}
