import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import { useKeywordHighlight } from './useKeywordHighlight'

/**
 * mark.js 在本项目的测试环境（happy-dom）里标不动：它靠 TreeWalker 遍历文本节点，
 * 而 happy-dom 的 TreeWalker 一个节点都不吐（实测 0 个）。所以这里换一个只做
 * 「按 DOM 顺序把每处命中包成 <mark class=...>」的替身 —— 本文件要测的正是
 * 我们自己在这些 mark 里挑哪一处（选块 + 数序号），不是 mark.js 本身。
 */
vi.mock('mark.js', () => {
  function textNodesOf(node, out = []) {
    for (const child of node.childNodes) {
      if (child.nodeType === 3) out.push(child)
      else if (child.nodeType === 1 && child.tagName !== 'MARK') textNodesOf(child, out)
    }
    return out
  }

  class StandInMark {
    constructor(root) {
      this.root = root
      this.made = []
    }

    mark(terms, { className = 'mark', done } = {}) {
      for (const node of textNodesOf(this.root)) {
        const text = node.textContent
        const term = terms.find(value => text.toLowerCase().includes(String(value).toLowerCase()))
        if (!term) continue

        const at = text.toLowerCase().indexOf(String(term).toLowerCase())
        const doc = node.ownerDocument
        const mark = doc.createElement('mark')
        mark.className = className
        mark.textContent = text.slice(at, at + String(term).length)

        const fragment = doc.createDocumentFragment()
        fragment.append(
          doc.createTextNode(text.slice(0, at)),
          mark,
          doc.createTextNode(text.slice(at + String(term).length)),
        )
        node.replaceWith(fragment)
        this.made.push(mark)
      }
      done?.()
    }

    unmark({ done } = {}) {
      for (const mark of this.made) {
        mark.replaceWith(mark.ownerDocument.createTextNode(mark.textContent))
      }
      this.made = []
      done?.()
    }
  }

  return { default: StandInMark }
})

/** 承吕布页的真实形态：两张牌各占一个正文块，块内同一句话一模一样 */
const TWO_CARDS = `
  <article class="md-viewer__body">
    <h2>推心置腹</h2>
    <ul><li>使用时机：出牌阶段。</li></ul>
  </article>
  <article class="md-viewer__body">
    <h2>趁火打劫</h2>
    <ul><li>使用时机：出牌阶段。</li></ul>
  </article>
`

/** 一份文档里同一句话说了两遍（整篇认领，块标题取文档标题） */
const REPEATED = `
  <article class="md-viewer__body">
    <h2>村规</h2>
    <p>出局玩家翻开身份牌。</p>
    <p>出局玩家翻开身份牌。</p>
  </article>
`

/** 落地页的最小形态：一个滚动容器 + 一段渲染好的正文 */
const LandingPage = defineComponent({
  props: { html: { type: String, required: true } },
  setup(props) {
    const pageRef = ref(null)
    useKeywordHighlight(pageRef)
    return () => h('div', { ref: pageRef, class: 'page-host', innerHTML: props.html })
  },
})

/** 挂上带 query 的落地页，等到标完 */
async function land({ path = '/jsrg/cheng-lv-bu-qing-jiao', html = TWO_CARDS, query }) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path, component: LandingPage }],
  })
  router.push({ path, query })
  await router.isReady()

  const wrapper = mount(LandingPage, {
    props: { html },
    global: { plugins: [router] },
  })
  await flushPromises()

  return wrapper
}

/** 落点所在的正文块（滚动 + 闪烁的那一处） */
function activeBlock(wrapper) {
  const mark = wrapper.element.querySelector('mark.md-hit--active')
  return mark ? mark.closest('article').querySelector('h2').textContent : null
}

describe('useKeywordHighlight — 按落点身份认人', () => {
  it('点「趁火打劫」那条就落在趁火打劫那一块，不再跳到页面上第一处', async () => {
    const wrapper = await land({
      query: { keyword: '使用时机：出牌阶段。', q: '出牌阶段', section: '趁火打劫' },
    })

    expect(activeBlock(wrapper)).toBe('趁火打劫')
  })

  it('点「推心置腹」那条落在推心置腹那一块', async () => {
    const wrapper = await land({
      query: { keyword: '使用时机：出牌阶段。', q: '出牌阶段', section: '推心置腹' },
    })

    expect(activeBlock(wrapper)).toBe('推心置腹')
  })

  it('没带落点身份（老链接 / 整篇认领的文档）时退回「整页第一处」', async () => {
    const wrapper = await land({ query: { keyword: '使用时机：出牌阶段。', q: '出牌阶段' } })

    expect(activeBlock(wrapper)).toBe('推心置腹')
  })

  it('块标题在页面上找不到时退回整页，不空手而归', async () => {
    const wrapper = await land({
      query: { keyword: '使用时机：出牌阶段。', q: '出牌阶段', section: '无此牌' },
    })

    expect(activeBlock(wrapper)).toBe('推心置腹')
  })
})

describe('useKeywordHighlight — 块内第几处', () => {
  const at = (wrapper, index) => wrapper.element.querySelectorAll('p')[index]

  it('hit:1 落在同句的第二处', async () => {
    const wrapper = await land({
      path: '/tool/cun-gui',
      html: REPEATED,
      query: { keyword: '出局玩家翻开身份牌。', q: '身份牌', section: '村规', hit: '1' },
    })

    const mark = wrapper.element.querySelector('mark.md-hit--active')
    expect(mark.textContent).toBe('出局玩家翻开身份牌。')
    expect(mark.closest('p')).toBe(at(wrapper, 1))
  })

  it('不带 hit 时落在第一处', async () => {
    const wrapper = await land({
      path: '/tool/cun-gui',
      html: REPEATED,
      query: { keyword: '出局玩家翻开身份牌。', q: '身份牌', section: '村规' },
    })

    expect(wrapper.element.querySelector('mark.md-hit--active').closest('p')).toBe(at(wrapper, 0))
  })
})
