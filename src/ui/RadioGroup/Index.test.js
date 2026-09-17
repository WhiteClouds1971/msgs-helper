import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { describe, expect, it } from 'vitest';
import RadioGroup from './Index.vue';

const OPTIONS = [
  { label: '地主', value: 'landlord' },
  { label: '农民', value: 'farmer' },
  { label: '内奸', value: 'traitor', disabled: true },
];

const mountRadioGroup = (props = {}, options = {}) =>
  mount(RadioGroup, { props: { options: OPTIONS, ...props }, ...options });

describe('RadioGroup', () => {
  it('每个选项都画成「按钮面 + 原生 radio」一对', () => {
    const wrapper = mountRadioGroup();

    expect(wrapper.findAll('.radio-field__option')).toHaveLength(3);
    expect(wrapper.findAll('.radio-field__input')).toHaveLength(3);
    expect(
      wrapper.findAll('.radio-field__text').map(node => node.text())
    ).toEqual(['地主', '农民', '内奸']);

    const inputs = wrapper.findAll('.radio-field__input');
    expect(inputs.map(input => input.attributes('type'))).toEqual([
      'radio',
      'radio',
      'radio',
    ]);
    expect(inputs.map(input => input.element.value)).toEqual([
      'landlord',
      'farmer',
      'traitor',
    ]);
  });

  it('选项可带补充说明（如胜率）：写成「（说明）」跟在选项名后面，整组挂 is-hinted', () => {
    const wrapper = mountRadioGroup({
      options: [
        { label: '地主', value: 'landlord', hint: '58.33%' },
        { label: '农民', value: 'farmer' },
      ],
    });

    // 括号由组件补：调用方只管给内容（58.33%）
    expect(
      wrapper.findAll('.radio-field__hint').map(node => node.text())
    ).toEqual(['（58.33%）']);
    // 说明不混进选项名：两段文字各是一个 span，字号 / 颜色才分得开
    expect(
      wrapper.findAll('.radio-field__text').map(node => node.text())
    ).toEqual(['地主', '农民']);
    // 无障碍：radio 的可读名 = 所在 label 的全部文字，说明也在里面
    expect(
      wrapper.findAll('.radio-field__option')[0].text().replace(/\s+/g, '')
    ).toBe('地主（58.33%）');

    // 标在整组上（样式据此换成两列）—— 一排里有的带说明有的不带，也一起换
    expect(wrapper.find('.radio-field__options').classes()).toContain(
      'is-hinted'
    );
  });

  it('没人带说明的选项组不挂 is-hinted（照旧一行等分）', () => {
    expect(
      mountRadioGroup().find('.radio-field__options').classes()
    ).not.toContain('is-hinted');
  });

  it('值命中的那枚才是选中态，其余不选', () => {
    const wrapper = mountRadioGroup({ modelValue: 'farmer' });
    const options = wrapper.findAll('.radio-field__option');

    expect(options.map(option => option.classes())).toEqual([
      ['radio-field__option'],
      ['radio-field__option', 'is-checked'],
      ['radio-field__option', 'is-disabled'],
    ]);

    const inputs = wrapper.findAll('.radio-field__input');
    expect(inputs.map(input => input.element.checked)).toEqual([
      false,
      true,
      false,
    ]);
  });

  it('空值（未选择）时任何一枚都不算选中', () => {
    for (const empty of ['', undefined, null]) {
      const wrapper = mountRadioGroup({ modelValue: empty });
      expect(wrapper.find('.radio-field__option.is-checked').exists()).toBe(
        false
      );
    }
  });

  it('点选某一枚就派发它的 value（值不在 options 里时同样谁也不选）', async () => {
    const wrapper = mountRadioGroup({ modelValue: 'landlord' });

    await wrapper.findAll('.radio-field__input')[1].setValue(true);

    expect(wrapper.emitted('update:modelValue')).toEqual([['farmer']]);

    const offline = mountRadioGroup({ modelValue: 'not-exist' });
    expect(offline.find('.radio-field__option.is-checked').exists()).toBe(
      false
    );
  });

  it('同组 radio 共用一个 name；不传 name 时两组实例各用各的', () => {
    const named = mountRadioGroup({ name: 'role' });
    expect(
      named
        .findAll('.radio-field__input')
        .map(input => input.attributes('name'))
    ).toEqual(['role', 'role', 'role']);

    // 一页放两组：同一次 mount 里两个实例的 name 必须分得开，各选各的
    const Pair = defineComponent({
      render: () =>
        h('div', [
          h(RadioGroup, { options: OPTIONS, label: '身份' }),
          h(RadioGroup, { options: OPTIONS, label: '对局' }),
        ]),
    });
    const names = mount(Pair)
      .findAll('.radio-field__input')
      .map(input => input.attributes('name'));
    expect(new Set(names).size).toBe(2);
  });

  it('标题与必填星号：不传就不渲染；标题通过 aria-labelledby 关联到选项组', () => {
    const plain = mountRadioGroup();
    expect(plain.find('.radio-field__label').exists()).toBe(false);
    expect(plain.find('.radio-field__required').exists()).toBe(false);
    expect(
      plain.find('.radio-field__options').attributes('aria-labelledby')
    ).toBeUndefined();

    const labeled = mountRadioGroup({ label: '身份', required: true });
    const label = labeled.find('.radio-field__label');
    expect(label.text().replace(/\s+/g, '')).toBe('身份*');
    expect(
      labeled.find('.radio-field__options').attributes('aria-labelledby')
    ).toBe(label.attributes('id'));
  });

  it('必填透出 aria-required，并落成原生 required', () => {
    const wrapper = mountRadioGroup({ required: true });

    expect(
      wrapper.find('.radio-field__options').attributes('aria-required')
    ).toBe('true');
    expect(
      wrapper
        .findAll('.radio-field__input')
        .map(input => input.attributes('required'))
    ).toEqual(['', '', '']);
  });

  it('禁用：整组禁用到每一枚，单枚禁用只禁它自己', () => {
    const all = mountRadioGroup({ disabled: true });
    expect(
      all
        .findAll('.radio-field__input')
        .map(input => input.attributes('disabled'))
    ).toEqual(['', '', '']);
    expect(all.findAll('.radio-field__option.is-disabled')).toHaveLength(3);

    const one = mountRadioGroup();
    expect(
      one.findAll('.radio-field__input').map(input => input.element.disabled)
    ).toEqual([false, false, true]);
    expect(one.findAll('.radio-field__option.is-disabled')).toHaveLength(1);
  });

  it('外部传入的 class 会落到根元素上，便于页面挂布局类', () => {
    const wrapper = mountRadioGroup(
      {},
      { attrs: { class: 'jiang-chi__role' } }
    );

    expect(wrapper.classes()).toContain('jiang-chi__role');
  });
});
