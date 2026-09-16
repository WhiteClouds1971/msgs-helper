import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import Button from './Index.vue';

describe('Button', () => {
  it('默认是主按钮变体，渲染插槽内容', () => {
    const wrapper = mount(Button, { slots: { default: '新增' } });

    expect(wrapper.element.tagName).toBe('BUTTON');
    expect(wrapper.classes()).toEqual(['btn', 'btn--primary']);
    expect(wrapper.text()).toBe('新增');
  });

  it('ghost 变体只换变体类，基座类不变', () => {
    const wrapper = mount(Button, {
      props: { variant: 'ghost' },
      slots: { default: '重置' },
    });

    expect(wrapper.classes()).toContain('btn');
    expect(wrapper.classes()).toContain('btn--ghost');
  });

  it('默认 type="button"，避免放进表单里被当成提交按钮', () => {
    expect(mount(Button).attributes('type')).toBe('button');
  });

  it('外部传入的 type 覆盖默认值', () => {
    const wrapper = mount(Button, { attrs: { type: 'submit' } });

    expect(wrapper.attributes('type')).toBe('submit');
  });

  it('点击按原生按钮透传，页面直接写 @click 即可', async () => {
    const onClick = vi.fn();
    const wrapper = mount(Button, { attrs: { onClick } });

    await wrapper.trigger('click');

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('id 与额外 class 落到根元素上（导览按 #id 定位、页面挂布局类都靠它）', () => {
    const wrapper = mount(Button, {
      attrs: { id: 'wqx-reset', class: 'wqx__reset' },
    });

    expect(wrapper.attributes('id')).toBe('wqx-reset');
    expect(wrapper.classes()).toContain('wqx__reset');
  });

  it('禁用时带上 disabled', () => {
    const wrapper = mount(Button, { props: { disabled: true } });

    expect(wrapper.attributes('disabled')).toBeDefined();
  });
});
