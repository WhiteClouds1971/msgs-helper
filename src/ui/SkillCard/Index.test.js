import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import SkillCard from './Index.vue'

describe('SkillCard', () => {
  it('渲染一个技能的技能名与规则正文', () => {
    const wrapper = mount(SkillCard, {
      props: { skill: { name: '虎', types: ['锁定技'], description: '此伤害+1' } },
    })

    expect(wrapper.find('.skill-card__name').text()).toBe('虎')
    expect(wrapper.find('.skill-card__desc').text().replace(/\s+/g, ' ').trim()).toBe(
      '锁定技 此伤害+1',
    )
  })

  it('标签是正文的第一个子节点，多个标签以空格分隔', () => {
    const wrapper = mount(SkillCard, {
      props: { skill: { name: '鹿', types: ['锁定技', '觉醒技'], description: '回复1点体力' } },
    })

    const desc = wrapper.find('.skill-card__desc')
    expect(desc.element.firstChild.className).toBe('skill-card__types')
    expect(desc.element.firstChild.textContent).toBe('锁定技 觉醒技')
    expect(desc.text().replace(/\s+/g, ' ').trim()).toBe('锁定技 觉醒技 回复1点体力')
  })

  it('技能可以没有标签：不渲染标签节点，正文不带前缀', () => {
    const wrapper = mount(SkillCard, {
      props: { skill: { name: '熊', description: '此伤害-1' } },
    })

    expect(wrapper.find('.skill-card__types').exists()).toBe(false)
    expect(wrapper.find('.skill-card__desc').text().trim()).toBe('此伤害-1')
  })

  it('空标签数组等同没有标签', () => {
    const wrapper = mount(SkillCard, {
      props: { skill: { name: '熊', types: [], description: '此伤害-1' } },
    })

    expect(wrapper.find('.skill-card__types').exists()).toBe(false)
  })

  it('不自带任何交互：指针事件不改变 class 与内联样式', async () => {
    const wrapper = mount(SkillCard, {
      props: { skill: { name: '虎', types: ['锁定技'], description: '此伤害+1' } },
    })

    await wrapper.trigger('pointerdown')
    await wrapper.trigger('pointermove')
    await wrapper.trigger('pointerup')

    expect(wrapper.classes()).toEqual(['skill-card'])
    expect(wrapper.attributes('style')).toBeUndefined()
  })

  it('外部传入的 class 会落到根元素上，便于页面挂交互状态', () => {
    const wrapper = mount(SkillCard, {
      props: { skill: { name: '虎', description: '此伤害+1' } },
      attrs: { class: 'skill-board__card' },
    })

    expect(wrapper.classes()).toContain('skill-board__card')
  })
})
