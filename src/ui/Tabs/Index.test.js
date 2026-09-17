import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import Tabs from './Index.vue';

const ITEMS = [
  { label: '地主', value: 'landlord' },
  { label: '农民', value: 'farmer' },
];

const mountTabs = (props = {}, options = {}) =>
  mount(Tabs, { props: { items: ITEMS, ...props }, ...options });

describe('Tabs', () => {
  it('每个页签都画成一枚 role=tab 的按钮，顺序即 items 顺序', () => {
    const wrapper = mountTabs({ modelValue: 'landlord' });
    const tabs = wrapper.findAll('.tabs__tab');

    expect(tabs).toHaveLength(2);
    expect(tabs.map(tab => tab.text())).toEqual(['地主', '农民']);
    expect(tabs.map(tab => tab.attributes('role'))).toEqual(['tab', 'tab']);
    // 页签条本身是 tablist（reka-ui 给的语义）
    expect(wrapper.find('.tabs__list').attributes('role')).toBe('tablist');
  });

  it('面板只挂当前选中的那一枚', () => {
    const wrapper = mount(Tabs, {
      props: { items: ITEMS, modelValue: 'landlord' },
      slots: { default: ({ item }) => `面板：${item.label}` },
    });

    // 面板容器每枚都有，带内容的只有当前这一枚（其余带 hidden 且不挂槽内容）
    const panels = wrapper.findAll('.tabs__panel:not([hidden])');
    expect(panels).toHaveLength(1);
    expect(panels[0].text()).toBe('面板：地主');
    expect(wrapper.findAll('.tabs__panel[hidden]')).toHaveLength(1);

    // 切到另一枚：上一块整个拆掉，新的一块重新挂载
    const farmer = mount(Tabs, {
      props: { items: ITEMS, modelValue: 'farmer' },
      slots: { default: ({ item }) => `面板：${item.label}` },
    });
    expect(farmer.findAll('.tabs__panel:not([hidden])')).toHaveLength(1);
    expect(farmer.find('.tabs__panel:not([hidden])').text()).toBe('面板：农民');
  });

  it('空值（没有选中的页签）时不画面板', () => {
    for (const empty of ['', undefined, null]) {
      const wrapper = mountTabs({ modelValue: empty });
      expect(wrapper.findAll('.tabs__panel:not([hidden])')).toHaveLength(0);
    }
  });

  it('点某一枚就把它的 value 派发出去', async () => {
    const wrapper = mountTabs({ modelValue: 'landlord' });

    await wrapper.findAll('.tabs__tab')[1].trigger('mousedown');
    await wrapper.findAll('.tabs__tab')[1].trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([['farmer']]);
  });

  it('禁用的页签点不动', async () => {
    const wrapper = mountTabs({
      modelValue: 'landlord',
      items: [{ label: '地主', value: 'landlord' }, { label: '农民', value: 'farmer', disabled: true }],
    });

    const disabled = wrapper.findAll('.tabs__tab')[1];
    expect(disabled.attributes('disabled')).toBeDefined();
    expect(disabled.attributes('data-disabled')).toBeDefined();

    await disabled.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('label 只喂给页签条的无障碍名，不画出来', () => {
    const plain = mountTabs({ modelValue: 'landlord' });
    expect(plain.find('.tabs__list').attributes('aria-label')).toBeUndefined();

    const labeled = mountTabs({ modelValue: 'landlord', label: '身份' });
    expect(labeled.find('.tabs__list').attributes('aria-label')).toBe('身份');
    expect(labeled.text()).not.toContain('身份');
  });

  it('插槽拿得到当前这一枚 item', () => {
    const wrapper = mount(Tabs, {
      props: { items: ITEMS, modelValue: 'farmer' },
      slots: { default: ({ value }) => `选中：${value}` },
    });

    expect(wrapper.find('.tabs__panel:not([hidden])').text()).toBe('选中：farmer');
  });

  it('fill：根元素挂 is-fill，撑开父容器剩余高度（面板里的内容自己决定谁滚）', () => {
    expect(mountTabs({ modelValue: 'landlord', fill: true }).classes()).toContain(
      'is-fill'
    );
    expect(mountTabs({ modelValue: 'landlord' }).classes()).not.toContain(
      'is-fill'
    );
  });

  it('外部传入的 class 会落到根元素上，便于页面挂布局类', () => {
    const wrapper = mountTabs(
      { modelValue: 'landlord' },
      { attrs: { class: 'sheng-lv-bang__tabs' } }
    );

    expect(wrapper.classes()).toContain('sheng-lv-bang__tabs');
  });
});
