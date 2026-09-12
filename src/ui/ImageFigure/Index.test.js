import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ImageFigure from './Index.vue'

const SRC = '/images/a.webp'

describe('ImageFigure', () => {
  it('渲染单张图片：src 与 alt 落到 <img> 上', () => {
    const wrapper = mount(ImageFigure, { props: { src: SRC, alt: '奸雄' } })

    const img = wrapper.find('.image-figure__img')
    expect(img.attributes('src')).toBe(SRC)
    expect(img.attributes('alt')).toBe('奸雄')
  })

  it('不写内联尺寸：铺满宽度、等比缩放由 CSS 负责', () => {
    const wrapper = mount(ImageFigure, { props: { src: SRC } })

    expect(wrapper.find('.image-figure__img').attributes('style')).toBeUndefined()
    expect(wrapper.classes()).toEqual(['image-figure'])
  })

  it('caption 渲染成说明区域', () => {
    const wrapper = mount(ImageFigure, { props: { src: SRC, caption: '出牌阶段使用' } })

    expect(wrapper.find('.image-figure__caption').text()).toBe('出牌阶段使用')
  })

  it('说明是可选的：没 caption 也没插槽就不渲染说明区域', () => {
    const wrapper = mount(ImageFigure, { props: { src: SRC, caption: '   ' } })

    expect(wrapper.find('.image-figure__caption').exists()).toBe(false)
  })

  it('默认插槽优先于 caption 文本，且能塞任意内容', () => {
    const wrapper = mount(ImageFigure, {
      props: { src: SRC, caption: '纯文本说明' },
      slots: { default: '<p class="rich">规则正文</p>' },
    })

    const caption = wrapper.find('.image-figure__caption')
    expect(caption.find('.rich').text()).toBe('规则正文')
    expect(caption.text()).not.toContain('纯文本说明')
  })

  it('只有插槽、没有 caption 时同样渲染说明区域', () => {
    const wrapper = mount(ImageFigure, {
      props: { src: SRC },
      slots: { default: '<p class="rich">规则正文</p>' },
    })

    expect(wrapper.find('.image-figure__caption').exists()).toBe(true)
  })

  it('加载失败：撤下 <img>，原地留占位', async () => {
    const wrapper = mount(ImageFigure, { props: { src: SRC, alt: '奸雄' } })

    await wrapper.find('.image-figure__img').trigger('error')

    expect(wrapper.find('.image-figure__img').exists()).toBe(false)
    expect(wrapper.find('.image-figure__broken').text()).toBe('图片加载失败')
  })

  it('换图后失败态复位，图片重新显示', async () => {
    const wrapper = mount(ImageFigure, { props: { src: SRC } })

    await wrapper.find('.image-figure__img').trigger('error')
    await wrapper.setProps({ src: '/images/b.webp' })

    expect(wrapper.find('.image-figure__broken').exists()).toBe(false)
    expect(wrapper.find('.image-figure__img').attributes('src')).toBe('/images/b.webp')
  })

  it('外部传入的 class 会落到根元素上，便于页面挂排布样式', () => {
    const wrapper = mount(ImageFigure, {
      props: { src: SRC },
      attrs: { class: 'guo-jia__figure' },
    })

    expect(wrapper.classes()).toContain('guo-jia__figure')
  })
})
