import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import Select from './Index.vue';

const OPTIONS = [
  { label: '斗地主', value: 'dou-di-zhu' },
  { label: '军争', value: 'jun-zheng' },
  { label: '团战', value: 'tuan-zhan', disabled: true },
];

const mountSelect = (props = {}, options = {}) =>
  mount(Select, { props: { options: OPTIONS, ...props }, ...options });

describe('Select', () => {
  it('无值时展示占位文字', () => {
    const wrapper = mountSelect({ placeholder: '请选择模式' });

    expect(wrapper.find('.select-field__value').text()).toBe('请选择模式');
    expect(
      wrapper.find('.select-field__trigger').attributes('data-placeholder')
    ).toBeDefined();
  });

  it('有值时展示该值对应的 label —— 与列表是否打开过无关', () => {
    const wrapper = mountSelect({ modelValue: 'jun-zheng' });

    expect(wrapper.find('.select-field__value').text()).toBe('军争');
    expect(
      wrapper.find('.select-field__trigger').attributes('data-placeholder')
    ).toBeUndefined();
  });

  it('值不在 options 里（已下线 / 空值）时回落到占位', () => {
    const wrapper = mountSelect({ modelValue: '' });

    expect(wrapper.find('.select-field__value').text()).toBe('请选择');
  });

  it('标题与必填星号：不传就不渲染', () => {
    const plain = mountSelect();
    expect(plain.find('.select-field__label').exists()).toBe(false);

    const labeled = mountSelect({ label: '模式', required: true });
    // 模板里标题与星号之间的换行会留成空白，比较时归一
    expect(labeled.find('.select-field__label').text().replace(/\s+/g, '')).toBe(
      '模式*'
    );
    expect(labeled.find('.select-field__required').exists()).toBe(true);
  });

  it('标题通过 for/id 关联到触发按钮，必填透出 aria-required', () => {
    const wrapper = mountSelect({ label: '模式', required: true });
    const trigger = wrapper.find('.select-field__trigger');

    expect(wrapper.find('.select-field__label').attributes('for')).toBe(
      trigger.attributes('id')
    );
    expect(trigger.attributes('aria-required')).toBe('true');
  });

  it('禁用时触发按钮带上 disabled 与 data-disabled', () => {
    const wrapper = mountSelect({ disabled: true });
    const trigger = wrapper.find('.select-field__trigger');

    expect(trigger.attributes('disabled')).toBeDefined();
    expect(trigger.attributes('data-disabled')).toBeDefined();
  });

  it('外部传入的 class 会落到根元素上，便于页面挂布局类', () => {
    const wrapper = mountSelect({}, { attrs: { class: 'jiang-chi__mode' } });
    expect(wrapper.classes()).toContain('jiang-chi__mode');
  });
});
