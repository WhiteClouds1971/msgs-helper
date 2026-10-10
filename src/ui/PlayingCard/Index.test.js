import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PlayingCard from './Index.vue'

const SPADE = { key: 'hei-tao', label: '黑桃', pip: '♠︎', tone: 'ink' }
const HEART = { key: 'hong-tao', label: '红桃', pip: '♥︎', tone: 'red' }

describe('PlayingCard', () => {
  it('只给牌名就是一枚名签：不画角标', () => {
    const wrapper = mount(PlayingCard, { props: { name: '火杀' } })

    expect(wrapper.find('.playing-card__name').text()).toBe('火杀')
    expect(wrapper.find('.playing-card__mark').exists()).toBe(false)
  })

  it('花色与点数同排在角标里，花色字形带上读法', () => {
    const wrapper = mount(PlayingCard, {
      props: { name: '火杀', suit: SPADE, rank: 'A' },
    })

    const mark = wrapper.find('.playing-card__mark')
    expect(mark.classes()).toContain('is-ink')
    expect(mark.find('.playing-card__pip').text()).toBe('♠︎')
    expect(mark.find('.playing-card__rank').text()).toBe('A')
    // 字形本身读不出来，读屏念的是花色名
    expect(mark.find('.playing-card__pip').attributes('aria-label')).toBe('黑桃')
  })

  it('红桃走朱砂那一档牌色', () => {
    const wrapper = mount(PlayingCard, { props: { name: '桃', suit: HEART } })

    expect(wrapper.find('.playing-card__mark').classes()).toContain('is-red')
  })

  it('只给点数也画角标，只给花色也画', () => {
    expect(
      mount(PlayingCard, { props: { name: '杀', rank: '10' } }).find('.playing-card__rank').text(),
    ).toBe('10')
    expect(
      mount(PlayingCard, { props: { name: '杀', suit: SPADE } }).find('.playing-card__pip').text(),
    ).toBe('♠︎')
  })

  it('点数给数字照样显示', () => {
    const wrapper = mount(PlayingCard, { props: { name: '杀', rank: 10 } })

    expect(wrapper.find('.playing-card__rank').text()).toBe('10')
  })

  it('盖牌：牌名与角标原地藏着（尺寸不变），另加一行居中的提示', () => {
    const wrapper = mount(PlayingCard, {
      props: { name: '火杀', suit: SPADE, rank: 'A', hidden: true },
    })

    expect(wrapper.classes()).toContain('is-hidden')
    // 还在 DOM 里、只是 visibility: hidden —— 一排牌签里盖住一枚，
    // 整排的宽窄不动（藏起来就少一截，同伴会跟着挪）
    expect(wrapper.find('.playing-card__name').exists()).toBe(true)
    expect(wrapper.find('.playing-card__mark').exists()).toBe(true)
    expect(wrapper.find('.playing-card__veil').text()).toBe('已隐藏')
  })

  it('没盖牌就不画那行提示', () => {
    const wrapper = mount(PlayingCard, { props: { name: '火杀' } })

    expect(wrapper.find('.playing-card__veil').exists()).toBe(false)
  })

  it('版式与选中态都落在根元素的类上', () => {
    const wrapper = mount(PlayingCard, {
      props: { name: '火杀', variant: 'row', selected: true },
    })

    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(['playing-card', 'playing-card--row', 'is-selected']),
    )
  })

  it('as 换标签：塞进按钮里就用 span（按钮只允许短语内容）', () => {
    const wrapper = mount(PlayingCard, { props: { name: '火杀', as: 'span' } })

    expect(wrapper.element.tagName).toBe('SPAN')
  })

  it('不自带交互：指针事件不改变类与内联样式', async () => {
    const wrapper = mount(PlayingCard, { props: { name: '火杀', suit: SPADE, rank: 'A' } })

    await wrapper.trigger('pointerdown')
    await wrapper.trigger('pointerup')
    await wrapper.trigger('click')

    expect(wrapper.classes()).toEqual(['playing-card', 'playing-card--tile'])
    expect(wrapper.attributes('style')).toBeUndefined()
  })
})
