import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import MdViewer from './Index.vue'

/** 造一个 fetch 桩：按需返回文本 / 状态码 */
function stubFetch({ text = '', ok = true, status = 200 } = {}) {
  const mock = vi.fn(() =>
    Promise.resolve({ ok, status, text: () => Promise.resolve(text) }),
  )
  vi.stubGlobal('fetch', mock)
  return mock
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('MdViewer', () => {
  it('content 直接渲染 Markdown', () => {
    const wrapper = mount(MdViewer, {
      props: { content: '# 村规\n\n- 甲\n- 乙\n\n> 注记' },
    })
    expect(wrapper.find('.md-viewer__body h1').text()).toBe('村规')
    expect(wrapper.findAll('.md-viewer__body li')).toHaveLength(2)
    expect(wrapper.find('.md-viewer__body blockquote').text()).toBe('注记')
  })

  it('无内容时显示占位文案（可自定义）', () => {
    expect(mount(MdViewer).find('.md-viewer__hint').text()).toBe('暂无内容')
    expect(
      mount(MdViewer, { props: { content: '   ' } }).find('.md-viewer__hint').text(),
    ).toBe('暂无内容')
    expect(
      mount(MdViewer, { props: { emptyText: '未收录' } })
        .find('.md-viewer__hint')
        .text(),
    ).toBe('未收录')
  })

  it('src 模式：先提示加载中，请求成功后渲染', async () => {
    const fetchMock = stubFetch({ text: '## 附则' })
    const wrapper = mount(MdViewer, { props: { src: '/rules.md' } })

    expect(fetchMock).toHaveBeenCalledWith('/rules.md', expect.anything())
    expect(wrapper.find('.md-viewer__hint').text()).toBe('加载中…')

    await flushPromises()
    expect(wrapper.find('.md-viewer__body h2').text()).toBe('附则')
    expect(wrapper.find('.md-viewer__hint').exists()).toBe(false)
  })

  it('src 模式：请求失败显示失败文案', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    stubFetch({ ok: false, status: 404 })

    const wrapper = mount(MdViewer, { props: { src: '/missing.md' } })
    await flushPromises()

    expect(wrapper.find('.md-viewer__hint--error').text()).toBe('内容加载失败')
    expect(wrapper.find('.md-viewer__body').exists()).toBe(false)
  })

  it('content 优先于 src，且不发起请求', () => {
    const fetchMock = stubFetch()
    const wrapper = mount(MdViewer, {
      props: { content: '# 本地', src: '/remote.md' },
    })

    expect(fetchMock).not.toHaveBeenCalled()
    expect(wrapper.find('.md-viewer__body h1').text()).toBe('本地')
  })

  it('切换 src 时丢弃过期响应', async () => {
    let resolveFirst
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => new Promise(resolve => (resolveFirst = resolve)))
      .mockImplementationOnce(() =>
        Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve('# 新') }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(MdViewer, { props: { src: '/a.md' } })
    await wrapper.setProps({ src: '/b.md' })
    await flushPromises()
    expect(wrapper.find('.md-viewer__body h1').text()).toBe('新')

    resolveFirst({ ok: true, status: 200, text: () => Promise.resolve('# 旧') })
    await flushPromises()
    expect(wrapper.find('.md-viewer__body h1').text()).toBe('新')
  })
})
