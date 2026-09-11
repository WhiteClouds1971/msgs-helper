import { describe, expect, it } from 'vitest'
import {
  anchorCandidates,
  parseMarkdownChunks,
  pickAnchor,
  splitInline,
  stripInline,
} from './markdown.js'

describe('stripInline / splitInline', () => {
  it('剥掉行内标记只留纯文本', () => {
    expect(stripInline('每人初始手牌 **4 张**')).toBe('每人初始手牌 4 张')
    expect(stripInline('[村规](/rules) 见 `附则`')).toBe('村规 见 附则')
    expect(stripInline('~~作废~~ 与 <b>标签</b>')).toBe('作废 与 标签')
  })

  it('按行内标记切成连续纯文本块（与 DOM 文本节点对应）', () => {
    expect(splitInline('每人初始手牌 **4 张**')).toEqual(['每人初始手牌', '4 张'])
    expect(splitInline('见 [村规](/rules)。')).toEqual(['见', '村规', '。'])
  })
})

describe('parseMarkdownChunks', () => {
  const raw = [
    '# 村规',
    '',
    '- 每人初始手牌 **4 张**',
    '> 约定优于规则',
    '',
    '| 阶段 | 处理 |',
    '| --- | --- |',
    '| 判定阶段 | 由上至下结算 |',
    '',
    '```text',
    '判定牌 = 牌堆顶第一张',
    '```',
    '',
    '---',
  ].join('\n')

  const chunks = parseMarkdownChunks(raw)
  const texts = chunks.map(chunk => chunk.text)

  it('标题 / 列表 / 引用 / 表格 / 代码逐行成段', () => {
    expect(texts).toContain('村规')
    expect(texts).toContain('每人初始手牌 4 张')
    expect(texts).toContain('约定优于规则')
    expect(texts).toContain('判定阶段 由上至下结算')
    expect(texts).toContain('判定牌 = 牌堆顶第一张')
  })

  it('分隔线与表格对齐行不算内容', () => {
    expect(texts.some(text => text.includes('---'))).toBe(false)
  })

  it('片段记住自己所属章节', () => {
    const list = chunks.find(chunk => chunk.text === '每人初始手牌 4 张')
    expect(list.heading).toBe('村规')
    expect(list.kind).toBe('list')
    expect(list.segments).toEqual(['每人初始手牌', '4 张'])
  })
})

describe('anchorCandidates / pickAnchor', () => {
  it('优先给出命中关键词的句子', () => {
    const [chunk] = parseMarkdownChunks(
      '开局前先逐条过一遍本规，**有异议当场提出**，开牌后不再追溯。约定优于规则。',
    )
    expect(pickAnchor(chunk, '有异议')).toBe('有异议当场提出')
  })

  it('未命中时退回整行，再退回前缀', () => {
    const text = '这是一段很长很长的说明文字，用来验证前缀兜底策略是否生效。'
    const [chunk] = parseMarkdownChunks(text)
    const candidates = anchorCandidates(chunk, '不存在的词')
    expect(candidates[0]).toBe(text)
    // 整行与句读都命不中时，最终靠前缀兜底
    expect(candidates).toContain(text.slice(0, 16))
  })

  it('候选去重且不超过 8 条', () => {
    const [chunk] = parseMarkdownChunks('甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥。')
    const candidates = anchorCandidates(chunk, '甲乙')
    expect(candidates.length).toBeLessThanOrEqual(8)
    expect(new Set(candidates).size).toBe(candidates.length)
  })
})
