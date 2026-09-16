import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import SearchSelect from './Index.vue';

const POOLS = ['标准', '风', '火', '林'];

const mountSelect = (props = {}, options = {}) =>
  mount(SearchSelect, {
    props: { options: POOLS, ...props },
    attachTo: document.body,
    ...options,
  });

/** 让 setTimeout(0) 的防抖与 Promise 回调跑完 */
const flush = async () => {
  await new Promise(resolve => setTimeout(resolve, 0));
  await new Promise(resolve => setTimeout(resolve, 0));
};

const lastEmit = wrapper => {
  const events = wrapper.emitted('update:modelValue');
  return events ? events[events.length - 1][0] : undefined;
};

describe('SearchSelect', () => {
  it('渲染标题、必填星号与占位文字', () => {
    const wrapper = mountSelect({
      label: '将池',
      required: true,
      placeholder: '搜索或输入',
    });

    expect(
      wrapper.find('.search-select__label').text().replace(/\s+/g, '')
    ).toBe('将池*');
    expect(
      wrapper.find('.search-select__input').attributes('placeholder')
    ).toBe('搜索或输入');
    expect(
      wrapper.find('.search-select__input').attributes('aria-required')
    ).toBe('true');
  });

  it('有值时输入框显示该值对应的 label', () => {
    const wrapper = mountSelect({ modelValue: '风' });

    expect(wrapper.find('.search-select__input').element.value).toBe('风');
  });

  it('聚焦展开候选：还没打字时给全量，方便浏览', async () => {
    const wrapper = mountSelect();
    expect(wrapper.find('.search-select__panel').exists()).toBe(false);

    await wrapper.find('.search-select__input').trigger('focus');

    expect(wrapper.find('.search-select__panel').exists()).toBe(true);
    expect(
      wrapper.findAll('.search-select__option').map(el => el.text())
    ).toEqual(POOLS);
  });

  it('输入即过滤候选', async () => {
    const wrapper = mountSelect();
    const input = wrapper.find('.search-select__input');

    await input.trigger('focus');
    await input.setValue('林');

    expect(
      wrapper.findAll('.search-select__option').map(el => el.text())
    ).toEqual(['林']);
  });

  it('点候选：回填 label、收起、抛出该候选的 value', async () => {
    const wrapper = mountSelect();
    const input = wrapper.find('.search-select__input');

    await input.trigger('focus');
    await wrapper.findAll('.search-select__option')[1].trigger('pointerdown');

    expect(lastEmit(wrapper)).toBe('风');
    expect(wrapper.find('.search-select__input').element.value).toBe('风');
    expect(wrapper.find('.search-select__panel').exists()).toBe(false);
  });

  it('候选外的内容也能用：末行「使用「xxx」」，点它即采纳原文', async () => {
    const wrapper = mountSelect();
    const input = wrapper.find('.search-select__input');

    await input.trigger('focus');
    await input.setValue('自制将池');

    const rows = wrapper.findAll('.search-select__option');
    expect(rows.at(-1).text()).toBe('使用「自制将池」');
    expect(rows.at(-1).classes()).toContain('is-custom');

    await rows.at(-1).trigger('pointerdown');

    expect(lastEmit(wrapper)).toBe('自制将池');
    expect(wrapper.find('.search-select__input').element.value).toBe(
      '自制将池'
    );
  });

  it('allowCustom 关掉时不给「使用原文」这条路', async () => {
    const wrapper = mountSelect({ allowCustom: false });
    const input = wrapper.find('.search-select__input');

    await input.trigger('focus');
    await input.setValue('自制将池');

    expect(wrapper.findAll('.search-select__option')).toHaveLength(0);
    expect(wrapper.find('.search-select__empty').exists()).toBe(true);
  });

  it('手打内容后失焦：直接当值提交（命中候选则采纳候选的 value）', async () => {
    const wrapper = mountSelect({ options: [{ label: '标准', value: 'std' }] });
    const input = wrapper.find('.search-select__input');

    await input.trigger('focus');
    await input.setValue('标准');
    await input.trigger('blur');

    expect(lastEmit(wrapper)).toBe('std');
  });

  it('清空输入框即清空取值', async () => {
    const wrapper = mountSelect({ modelValue: '风' });
    const input = wrapper.find('.search-select__input');

    await input.trigger('focus');
    await input.setValue('');

    expect(lastEmit(wrapper)).toBe('');
  });

  it('传了 search 就改用它取候选，不再本地过滤', async () => {
    const search = vi.fn(async keyword => [
      { label: `结果-${keyword}`, value: keyword },
    ]);
    const wrapper = mountSelect({ options: POOLS, search, debounce: 0 });
    const input = wrapper.find('.search-select__input');

    // 聚焦：先用空关键词拉一批（取全部 / 热门）
    await input.trigger('focus');
    await flush();
    expect(search).toHaveBeenLastCalledWith('');
    expect(
      wrapper.findAll('.search-select__option').map(el => el.text())
    ).toEqual(['结果-']);

    await input.setValue('刘');
    await flush();

    expect(search).toHaveBeenLastCalledWith('刘');
    // 后端结果照单全收（组件不再本地过滤），末行照例留手动填值的口子
    expect(
      wrapper.findAll('.search-select__option').map(el => el.text())
    ).toEqual(['结果-刘', '使用「刘」']);
  });

  it('键盘：方向键移动高亮，回车选中', async () => {
    const wrapper = mountSelect();
    const input = wrapper.find('.search-select__input');

    await input.trigger('focus');
    await input.trigger('keydown', { key: 'ArrowDown' });
    expect(
      wrapper.findAll('.search-select__option')[1].attributes('data-active')
    ).toBeDefined();

    await input.trigger('keydown', { key: 'Enter' });
    expect(lastEmit(wrapper)).toBe('风');
  });
});
