import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import ConfirmDialog from './Index.vue';

/**
 * 弹窗内容走 reka 的 Portal 传送到 body，wrapper.find 够不着 ——
 * 一律从 document 上查；内容也不是挂载那一帧就落地的，等一次 tick。
 */
async function mountDialog({ props = {}, slots } = {}) {
  const wrapper = mount(ConfirmDialog, {
    props: {
      open: true,
      title: '撤回这条记录？',
      description: '将从「将池3」里减去这 1 场。',
      ...props,
    },
    slots,
    attachTo: document.body,
  });
  await nextTick();
  return wrapper;
}

const panel = () => document.querySelector('.confirm-dialog__panel');
const buttons = () =>
  Array.from(document.querySelectorAll('.confirm-dialog__actions button'));

afterEach(() => {
  document.body.innerHTML = '';
});

describe('ConfirmDialog', () => {
  it('关闭时什么都不渲染', async () => {
    await mountDialog({ props: { open: false } });

    expect(panel()).toBeNull();
  });

  it('打开时画标题、说明与两枚按钮', async () => {
    await mountDialog();

    expect(panel()).not.toBeNull();
    expect(document.querySelector('.confirm-dialog__title').textContent).toBe(
      '撤回这条记录？'
    );
    expect(
      document.querySelector('.confirm-dialog__description').textContent
    ).toContain('减去这 1 场');

    expect(buttons().map(button => button.textContent.trim())).toEqual([
      '取消',
      '确认',
    ]);
  });

  it('默认插槽的内容落在说明里，可以塞比一句话更细的东西', async () => {
    await mountDialog({
      props: { description: '' },
      slots: { default: '<b class="detail">关羽 · 地主 · 赢</b>' },
    });

    expect(
      document.querySelector('.confirm-dialog__description .detail').textContent
    ).toBe('关羽 · 地主 · 赢');
  });

  it('点确认只报事件，弹窗不自己关（等使用方拿到结果再收）', async () => {
    const wrapper = await mountDialog();

    buttons()[1].click();
    await nextTick();

    expect(wrapper.emitted('confirm')).toHaveLength(1);
    // 没有 update:open —— 也就不会自己消失，撤回在飞时按钮上的 loading 才看得见
    expect(wrapper.emitted('update:open')).toBeUndefined();
    expect(panel()).not.toBeNull();
  });

  it('点取消报 cancel，并请使用方收起（v-model:open）', async () => {
    const wrapper = await mountDialog();

    buttons()[0].click();
    await nextTick();

    expect(wrapper.emitted('cancel')).toHaveLength(1);
    expect(wrapper.emitted('update:open')).toEqual([[false]]);
  });

  it('loading：两枚按钮都禁用，确认那枚换成进行中的文案', async () => {
    await mountDialog({ props: { loading: true, loadingText: '撤回中…' } });

    const [cancel, confirm] = buttons();
    expect(confirm.textContent.trim()).toBe('撤回中…');
    expect(confirm.disabled).toBe(true);
    expect(cancel.disabled).toBe(true);
  });

  it('tone 决定面板的语气（默认 danger，普通确认给 primary）', async () => {
    await mountDialog({ props: { tone: 'danger' } });
    expect(panel().classList.contains('confirm-dialog__panel--danger')).toBe(
      true
    );

    document.body.innerHTML = '';

    await mountDialog({ props: { tone: 'primary' } });
    expect(panel().classList.contains('confirm-dialog__panel--primary')).toBe(
      true
    );
  });

  it('确认那枚用的还是 @/ui/Button 的主按钮（只就地换语气色）', async () => {
    await mountDialog();

    expect(buttons()[1].classList.contains('btn--primary')).toBe(true);
    expect(buttons()[1].classList.contains('confirm-dialog__confirm')).toBe(
      true
    );
  });

  it('没给说明也没给插槽时，说明那一行不占位', async () => {
    await mountDialog({ props: { description: '' } });

    expect(
      document
        .querySelector('.confirm-dialog__description')
        .classList.contains('is-empty')
    ).toBe(true);
  });
});
