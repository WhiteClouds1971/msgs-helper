import { describe, expect, it } from 'vitest'
import {
  createSearchIndex,
  escapeHtml,
  getHighlightWords,
  highlightSnippet,
  searchItemsByKeyword,
} from './search.js'

const items = [
  { id: 'a', keyword: '村规', pinyin: 'cungui', acronym: 'cg' },
  { id: 'b', keyword: '夏侯渊 神速', pinyin: 'xiahouyuanshensu', acronym: 'xhys' },
]

describe('searchItemsByKeyword', () => {
  const fuse = createSearchIndex(items)

  it('空关键词返回空结果', () => {
    expect(searchItemsByKeyword('   ', fuse)).toEqual([])
  })

  it('汉字 / 拼音 / 首字母都能命中', () => {
    expect(searchItemsByKeyword('村规', fuse).map(item => item.id)).toEqual(['a'])
    expect(searchItemsByKeyword('cungui', fuse).map(item => item.id)).toEqual(['a'])
    expect(searchItemsByKeyword('xhys', fuse).map(item => item.id)).toEqual(['b'])
  })

  it('结果保持数据原始顺序，而非相关度顺序', () => {
    const list = [
      { id: '1', keyword: '判定阶段', pinyin: 'panduanjieduan', acronym: 'pdjd' },
      { id: '2', keyword: '判定顺序', pinyin: 'panduanshunxu', acronym: 'pdsx' },
    ]
    const ordered = searchItemsByKeyword('判定', createSearchIndex(list))
    expect(ordered.map(item => item.id)).toEqual(['1', '2'])
  })
})

describe('escapeHtml', () => {
  it('转义 v-html 注入前必须处理的字符', () => {
    expect(escapeHtml('<b>&"\'')).toBe('&lt;b&gt;&amp;&quot;&#39;')
  })
})

describe('getHighlightWords', () => {
  it('汉字关键词原样返回', () => {
    expect(getHighlightWords('判定', '判定阶段由玩家执行')).toEqual(['判定'])
  })

  it('拼音关键词回溯出对应汉字', () => {
    expect(getHighlightWords('cungui', '村规')).toEqual(['村规'])
  })
})

describe('highlightSnippet', () => {
  it('只给命中词包 <mark>，其余原文照旧', () => {
    const html = highlightSnippet('开局前先过一遍，有异议当场提出。', '有异议')
    expect(html).toBe('开局前先过一遍，<mark>有异议</mark>当场提出。')
  })

  it('长文本围绕命中词截窗并补省略号', () => {
    const text = '甲'.repeat(200) + '判定' + '乙'.repeat(50)
    const html = highlightSnippet(text, '判定', { maxLength: 40, radius: 10 })
    expect(html.startsWith('…')).toBe(true)
    expect(html.endsWith('…')).toBe(true)
    expect(html).toContain('<mark>判定</mark>')
  })

  it('未命中时退回开头一截且不注入标签', () => {
    expect(highlightSnippet('甲乙丙丁', 'zzz')).toBe('甲乙丙丁')
  })

  it('原文里的 HTML 会被转义', () => {
    const html = highlightSnippet('判定：<script>alert(1)</script>', '判定')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })
})
