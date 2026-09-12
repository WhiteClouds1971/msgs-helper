import { describe, expect, it } from 'vitest'
import { findSectionBlock, pickHit, resolveLanding } from './highlight'

/** 承吕布页的真实形态：两张牌各占一个正文块，块内同一句话一模一样 */
function buildPage() {
  document.body.innerHTML = `
    <div class="page">
      <article class="md-viewer__body">
        <h2>推心置腹</h2>
        <ul><li>使用时机：出牌阶段。</li></ul>
      </article>
      <article class="md-viewer__body">
        <h2>趁火打劫</h2>
        <ul><li>使用时机：出牌阶段。</li></ul>
      </article>
    </div>
  `
  return document.querySelector('.page')
}

/** 在两个块里各标一处命中（模拟 mark.js 标完锚点的结果） */
function markBoth(root) {
  root.querySelectorAll('li').forEach(li => {
    li.innerHTML = li.innerHTML.replace('出牌阶段', '<mark class="md-hit">出牌阶段</mark>')
  })
}

describe('findSectionBlock', () => {
  it('按块标题找出正文块（标题所在的容器）', () => {
    const root = buildPage()

    expect(findSectionBlock(root, '趁火打劫')?.querySelector('h2').textContent).toBe('趁火打劫')
    expect(findSectionBlock(root, '推心置腹')?.querySelector('h2').textContent).toBe('推心置腹')
  })

  it('找不到的标题 / 空标题返回 null —— 调用方据此退回整页', () => {
    const root = buildPage()

    expect(findSectionBlock(root, '无此牌')).toBe(null)
    expect(findSectionBlock(root, '')).toBe(null)
    expect(findSectionBlock(null, '推心置腹')).toBe(null)
  })
})

describe('pickHit', () => {
  it('取块内第 hit 处，两块的命中互不串门', () => {
    const root = buildPage()
    markBoth(root)

    const first = pickHit(findSectionBlock(root, '推心置腹'), 0, 'md-hit')
    const second = pickHit(findSectionBlock(root, '趁火打劫'), 0, 'md-hit')

    expect(first?.closest('article').querySelector('h2').textContent).toBe('推心置腹')
    expect(second?.closest('article').querySelector('h2').textContent).toBe('趁火打劫')
  })

  it('块内没有命中返回 null（调用方换下一个候选锚点）', () => {
    const root = buildPage()

    expect(pickHit(findSectionBlock(root, '趁火打劫'), 0, 'md-hit')).toBe(null)
  })

  it('序号越界退到块内最后一处，不会指到别的块', () => {
    const root = buildPage()
    markBoth(root)

    const hit = pickHit(findSectionBlock(root, '趁火打劫'), 9, 'md-hit')

    expect(hit?.closest('article').querySelector('h2').textContent).toBe('趁火打劫')
  })
})

describe('resolveLanding', () => {
  it('给得出块就落在块里，序号照用', () => {
    const root = buildPage()

    expect(resolveLanding(root, { section: '趁火打劫', hit: 2 }).scope).toBe(
      findSectionBlock(root, '趁火打劫'),
    )
    expect(resolveLanding(root, { section: '趁火打劫', hit: 2 }).hit).toBe(2)
  })

  it('标题没落地（没标题的文档 / 页面还没渲染完）时退回整页，且序号归零', () => {
    const root = buildPage()

    expect(resolveLanding(root, { section: '无此牌', hit: 3 })).toEqual({ scope: root, hit: 0 })
    expect(resolveLanding(root, { section: '', hit: 3 })).toEqual({ scope: root, hit: 3 })
  })
})
