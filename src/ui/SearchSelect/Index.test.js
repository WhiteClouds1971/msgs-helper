import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import SearchSelect from './Index.vue';

const POOLS = ['标准', '风', '火', '林'];

const mountSelect = (props = {}, options = {}) =>
  mount(SearchSelect, {
    props: { options: POOLS, ...props },
    attachTo: document.body,
    ...options,
  });

/**
 * 派发一个指针事件：带上坐标与 pointerId。
 *
 * 候选面板是滚动容器，点选靠「按下 → 抬手」的位移分辨（见组件里的 TAP_SLOP），
 * 所以测试必须喂得出坐标，不能用 trigger('pointerdown') 那种不带坐标的空事件。
 */
const pointer = (
  wrapperOrEl,
  type,
  { x = 0, y = 0, pointerId = 1, pointerType = 'touch' } = {}
) => {
  const el = wrapperOrEl.element ?? wrapperOrEl;
  el.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
      pointerId,
      pointerType,
      isPrimary: true,
    })
  );
};

/** 点一下：按下与抬手都在同一点 */
const tap = async (wrapperOrEl, point = {}) => {
  pointer(wrapperOrEl, 'pointerdown', point);
  pointer(wrapperOrEl, 'pointerup', point);
  await nextTick();
};

/** 拖着滚：按住后位移超过阈值，再抬手 */
const drag = async (wrapperOrEl, from = {}, to = {}) => {
  pointer(wrapperOrEl, 'pointerdown', from);
  pointer(wrapperOrEl, 'pointerup', {
    x: from.x ?? 0,
    y: from.y ?? 0,
    ...to,
  });
  await nextTick();
};

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
    await tap(wrapper.findAll('.search-select__option')[1]);

    expect(lastEmit(wrapper)).toBe('风');
    expect(wrapper.find('.search-select__input').element.value).toBe('风');
    expect(wrapper.find('.search-select__panel').exists()).toBe(false);
  });

  it('拖着滚列表（位移超过阈值）不选中、不收起 —— 触屏划列表不能被当成点选', async () => {
    const wrapper = mountSelect();
    const input = wrapper.find('.search-select__input');

    await input.trigger('focus');
    await drag(
      wrapper.findAll('.search-select__option')[1],
      { y: 120 },
      { y: 60 }
    );

    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.find('.search-select__panel').exists()).toBe(true);
    expect(wrapper.find('.search-select__input').element.value).toBe('');
  });

  it('按下与抬手不在同一行（手指滑到别的条目上才抬）→ 不算点选', async () => {
    const wrapper = mountSelect();
    const input = wrapper.find('.search-select__input');

    await input.trigger('focus');
    const options = wrapper.findAll('.search-select__option');
    pointer(options[1], 'pointerdown', { y: 40 });
    pointer(options[2], 'pointerup', { y: 80 });
    await nextTick();

    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.find('.search-select__panel').exists()).toBe(true);
  });

  it('指针被浏览器收去做滚动手势（pointercancel）→ 本次按下作废', async () => {
    const wrapper = mountSelect();
    const input = wrapper.find('.search-select__input');

    await input.trigger('focus');
    const option = wrapper.findAll('.search-select__option')[1];
    pointer(option, 'pointerdown', { y: 40 });
    pointer(option, 'pointercancel', { y: 45 });
    pointer(option, 'pointerup', { y: 45 });
    await nextTick();

    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.find('.search-select__panel').exists()).toBe(true);
  });

  it('手指按在候选上时来的 blur 是「碰面板」带出来的，不收面板（真机滚列表不被这一下打断）', async () => {
    const wrapper = mountSelect();
    const input = wrapper.find('.search-select__input');

    await input.trigger('focus');
    // 有的浏览器不认 pointerdown 上的 preventDefault，照样把焦点从输入框收走
    pointer(wrapper.findAll('.search-select__option')[1], 'pointerdown', {
      y: 40,
    });
    await input.trigger('blur');

    expect(wrapper.find('.search-select__panel').exists()).toBe(true);

    // 抬手仍落在同一行同一点：这一下才作数
    pointer(wrapper.findAll('.search-select__option')[1], 'pointerup', {
      y: 40,
    });
    await nextTick();

    expect(lastEmit(wrapper)).toBe('风');
  });

  it('鼠标划过条目才跟着高亮：触屏拖动改高亮会跟滚动抢位置', async () => {
    const wrapper = mountSelect();
    const input = wrapper.find('.search-select__input');

    await input.trigger('focus');
    const options = wrapper.findAll('.search-select__option');

    pointer(options[2], 'pointermove', { pointerType: 'touch' });
    await nextTick();
    expect(
      wrapper.findAll('.search-select__option')[2].attributes('data-active')
    ).toBeUndefined();

    pointer(options[2], 'pointermove', { pointerType: 'mouse' });
    await nextTick();
    expect(
      wrapper.findAll('.search-select__option')[2].attributes('data-active')
    ).toBeDefined();
  });

  it('候选外的内容也能用：末行「使用「xxx」」，点它即采纳原文', async () => {
    const wrapper = mountSelect();
    const input = wrapper.find('.search-select__input');

    await input.trigger('focus');
    await input.setValue('自制将池');

    const rows = wrapper.findAll('.search-select__option');
    expect(rows.at(-1).text()).toBe('使用「自制将池」');
    expect(rows.at(-1).classes()).toContain('is-custom');

    await tap(rows.at(-1));

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

  it('每次展开都重新取候选：两次展开之间数据变了也要看得见', async () => {
    // 模拟「别处新增了一条」——比如将池页记完一局后把新武将并进缓存
    let remote = ['关羽'];
    const search = vi.fn(async () =>
      remote.map(name => ({ label: name, value: name }))
    );
    const wrapper = mountSelect({ search, debounce: 0 });
    const input = wrapper.find('.search-select__input');
    const rows = () =>
      wrapper.findAll('.search-select__option').map(el => el.text());

    await input.trigger('focus');
    await flush();
    expect(rows()).toEqual(['关羽']);

    remote = ['貂蝉', '关羽'];

    await input.trigger('blur');
    await input.trigger('focus');
    await flush();

    // 只拉过一次就再也不刷的话，这里还是老的 ['关羽']
    expect(rows()).toEqual(['貂蝉', '关羽']);
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
