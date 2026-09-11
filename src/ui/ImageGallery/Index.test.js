import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ImageGallery from './Index.vue'

const images = [
  { src: 'front.webp', alt: '正面' },
  { src: 'back.webp', alt: '背面' },
]

describe('ImageGallery', () => {
  it('逐张渲染，保留顺序与 alt', () => {
    const wrapper = mount(ImageGallery, { props: { images } })
    const imgs = wrapper.findAll('.gallery__img')
    expect(imgs).toHaveLength(2)
    expect(imgs.map(img => img.attributes('src'))).toEqual(['front.webp', 'back.webp'])
    expect(imgs.map(img => img.attributes('alt'))).toEqual(['正面', '背面'])
  })

  it('接受纯 src 字符串数组', () => {
    const wrapper = mount(ImageGallery, { props: { images: ['a.webp'] } })
    expect(wrapper.find('.gallery__img').attributes('src')).toBe('a.webp')
  })

  it('gap 落到图组内联样式（默认用间距 token）', () => {
    expect(mount(ImageGallery, { props: { images } }).find('.gallery__stack').attributes('style')).toContain(
      'gap: var(--space-2)',
    )
    expect(
      mount(ImageGallery, { props: { images, gap: '24px' } }).find('.gallery__stack').attributes('style'),
    ).toContain('gap: 24px')
  })

  it('加载失败的图显示占位文案，换图后重置', async () => {
    const wrapper = mount(ImageGallery, { props: { images } })
    expect(wrapper.find('.gallery__error').exists()).toBe(false)

    await wrapper.findAll('.gallery__img')[1].trigger('error')
    expect(wrapper.findAll('.gallery__error')).toHaveLength(1)

    await wrapper.setProps({ images: [{ src: 'next.webp' }] })
    expect(wrapper.find('.gallery__error').exists()).toBe(false)
  })
})
