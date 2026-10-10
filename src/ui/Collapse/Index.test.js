import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { describe, expect, it } from 'vitest'
import Collapse from './Index.vue'

const ITEMS = [
  { value: 'pai', title: '游戏牌', hint: '44 张' },
  { value: 'ji', title: '记牌' },
]

/** 正文里塞一个探针：收起的那一条到底挂没挂，看它在不在就够了 */
const probeSlot = {
  default: ({ item }) => h('p', { class: 'probe' }, item.value),
}

/** 受控用法：v-model 绑一个 ref，模拟页面里的真实接法 */
function mountHost(type, initial) {
  const Host = defineComponent({
    setup() {
      const open = ref(initial)
      return () =>
        h(
          Collapse,
          {
            items: ITEMS,
            type,
            modelValue: open.value,
            'onUpdate:modelValue': value => {
              open.value = value
            },
          },
          probeSlot,
        )
    },
  })
  return mount(Host)
}

describe('Collapse', () => {
  it('每条一个标题行，带补充说明的照给，没给的不留空位', () => {
    const wrapper = mount(Collapse, { props: { items: ITEMS, modelValue: [] } })

    const triggers = wrapper.findAll('.collapse__trigger')
    expect(triggers).toHaveLength(2)
    expect(triggers[0].find('.collapse__title').text()).toBe('游戏牌')
    expect(triggers[0].find('.collapse__hint').text()).toBe('44 张')
    expect(triggers[1].find('.collapse__hint').exists()).toBe(false)
  })

  it('标题行是按钮，展开状态透在 aria-expanded 上，箭头跟着它走', () => {
    const wrapper = mount(Collapse, {
      props: { items: ITEMS, type: 'multiple', modelValue: ['pai'] },
    })

    const triggers = wrapper.findAll('.collapse__trigger')
    expect(triggers[0].element.tagName).toBe('BUTTON')
    expect(triggers[0].attributes('aria-expanded')).toBe('true')
    expect(triggers[1].attributes('aria-expanded')).toBe('false')
    // 箭头一直画着（指上还是指下由 data-state 的样式决定），它只是个装饰
    expect(wrapper.findAll('.collapse__chevron')).toHaveLength(2)
  })

  it('收起的那一条正文不挂载，展开的那一条才挂载', () => {
    const wrapper = mountHost('multiple', ['pai'])

    expect(wrapper.findAll('.probe')).toHaveLength(1)
    expect(wrapper.find('.probe').text()).toBe('pai')
  })

  it('点标题行：多选下展开第二条，两条的正文同时在', async () => {
    const wrapper = mountHost('multiple', ['pai'])

    await wrapper.findAll('.collapse__trigger')[1].trigger('click')

    expect(wrapper.findAll('.probe').map(node => node.text())).toEqual(['pai', 'ji'])
  })

  it('点已展开的那一条：多选下把它收回去', async () => {
    const wrapper = mountHost('multiple', ['pai'])

    await wrapper.findAll('.collapse__trigger')[0].trigger('click')

    expect(wrapper.findAll('.probe')).toHaveLength(0)
  })

  it('单选：展开另一条时，上一条自己收起来', async () => {
    const wrapper = mountHost('single', 'pai')

    await wrapper.findAll('.collapse__trigger')[1].trigger('click')

    expect(wrapper.findAll('.probe').map(node => node.text())).toEqual(['ji'])
  })

  it('单选 + collapsible：再点一下能整组收回去', async () => {
    const wrapper = mount(Collapse, {
      props: { items: ITEMS, modelValue: 'pai', collapsible: true },
    })

    await wrapper.find('.collapse__trigger').trigger('click')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([undefined])
  })

  it('单选默认不可收回：再点一下不抛事件（reka-ui 的 collapsible 默认关）', async () => {
    const wrapper = mount(Collapse, {
      props: { items: ITEMS, modelValue: 'pai', collapsible: false },
    })

    await wrapper.find('.collapse__trigger').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('禁用那一条点不动', async () => {
    const wrapper = mount(Collapse, {
      props: {
        items: [{ value: 'pai', title: '游戏牌', disabled: true }],
        modelValue: [],
      },
    })

    await wrapper.find('.collapse__trigger').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.find('.collapse__trigger').attributes('data-disabled')).toBeDefined()
  })
})
