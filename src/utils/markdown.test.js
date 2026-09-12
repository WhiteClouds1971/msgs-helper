import { describe, expect, it } from 'vitest'
import { extractMarkdownSection, parseMarkdownChunks, stripInline } from './markdown'

const DOC = [
  '<!-- 合并文档：按节取用 -->',
  '',
  '## 趁火打劫',
  '',
  '- **使用时机**：出牌阶段。',
  '',
  '## 洞烛先机',
  '',
  '### 附：结算细则',
  '',
  '摸两张牌。',
  '',
  '## 推心置腹',
  '',
  '- **作用效果**：你交给目标对应的角色等量的手牌。',
].join('\n')

describe('extractMarkdownSection', () => {
  it('取出整节：含标题行，到下一个同级标题前一行止', () => {
    expect(extractMarkdownSection(DOC, '趁火打劫')).toBe(
      '## 趁火打劫\n\n- **使用时机**：出牌阶段。',
    )
  })

  it('末节取到文末，不留尾部空行', () => {
    expect(extractMarkdownSection(DOC, '推心置腹')).toBe(
      '## 推心置腹\n\n- **作用效果**：你交给目标对应的角色等量的手牌。',
    )
  })

  it('节里的下级标题跟着一起走（只有同级或更高级才截断）', () => {
    expect(extractMarkdownSection(DOC, '洞烛先机')).toBe(
      '## 洞烛先机\n\n### 附：结算细则\n\n摸两张牌。',
    )
  })

  it('标题按纯文本比对：接口传不带 # 号的名字即可', () => {
    expect(extractMarkdownSection(DOC, '## 趁火打劫')).toBe('')
    expect(extractMarkdownSection(DOC, ' 趁火打劫 ')).toBe(extractMarkdownSection(DOC, '趁火打劫'))
  })

  it('未命中 / 空标题返回空串（交给 MdViewer 的 emptyText，而不是画出整篇）', () => {
    expect(extractMarkdownSection(DOC, '无此牌')).toBe('')
    expect(extractMarkdownSection(DOC, '')).toBe('')
    expect(extractMarkdownSection('', '趁火打劫')).toBe('')
    expect(extractMarkdownSection(null, '趁火打劫')).toBe('')
  })

  it('切出来的只有本节：邻节的正文不会跟着串门', () => {
    const chunks = parseMarkdownChunks(extractMarkdownSection(DOC, '洞烛先机'))

    expect(chunks.map(chunk => chunk.text)).toEqual(['洞烛先机', '附：结算细则', '摸两张牌。'])
    expect(chunks.some(chunk => chunk.text.includes('使用时机'))).toBe(false)
    // 索引里节内的下级标题归下级标题（heading 逐行继承），认领靠「认领行 + 行号」兜住
    expect(chunks[0].text).toBe(stripInline('洞烛先机'))
  })
})
