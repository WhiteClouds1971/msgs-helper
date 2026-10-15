import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import Stepper from './Index.vue';

const mountStepper = (props = {}, options = {}) =>
  mount(Stepper, { props: { modelValue: 3, ...props }, ...options });

const emittedValues = wrapper =>
  (wrapper.emitted('update:modelValue') ?? []).map(([value]) => value);

describe('Stepper', () => {
  it('画出「标题 + 减 / 数字 / 加」四件东西', () => {
    const wrapper = mountStepper({ label: '本回合已出牌数', suffix: '张' });

    expect(wrapper.find('.stepper__label').text()).toBe('本回合已出牌数');
    expect(wrapper.find('.stepper__input').element.value).toBe('3');
    expect(wrapper.find('.stepper__suffix').text()).toBe('张');
    expect(
      wrapper.findAll('.stepper__btn').map(btn => btn.text())
    ).toEqual(['−', '+']);
  });

  it('标题与单位都是可选的：不传就不渲染', () => {
    const wrapper = mountStepper();

    expect(wrapper.find('.stepper__label').exists()).toBe(false);
    expect(wrapper.find('.stepper__suffix').exists()).toBe(false);
  });

  it('加一下 / 减一下就派发新值（按 step 走）', async () => {
    const wrapper = mountStepper({ modelValue: 3 });

    await wrapper.find('.stepper__btn--plus').trigger('click');
    expect(emittedValues(wrapper)).toEqual([4]);

    await wrapper.find('.stepper__btn--minus').trigger('click');
    expect(emittedValues(wrapper)).toEqual([4, 2]);

    const byFive = mountStepper({ modelValue: 3, step: 5 });
    await byFive.find('.stepper__btn--plus').trigger('click');
    expect(emittedValues(byFive)).toEqual([8]);
  });

  it('碰上下限：值截断在边界上，那一刻的按钮同时禁用', async () => {
    const atMin = mountStepper({ modelValue: 0, min: 0, max: 10 });
    expect(atMin.find('.stepper__btn--minus').element.disabled).toBe(true);
    expect(atMin.find('.stepper__btn--plus').element.disabled).toBe(false);

    // 到边界的按钮点不动，也就不会再派发
    await atMin.find('.stepper__btn--minus').trigger('click');
    expect(atMin.emitted('update:modelValue')).toBeUndefined();

    const atMax = mountStepper({ modelValue: 10, min: 0, max: 10 });
    expect(atMax.find('.stepper__btn--plus').element.disabled).toBe(true);
    await atMax.find('.stepper__btn--plus').trigger('click');
    expect(atMax.emitted('update:modelValue')).toBeUndefined();
  });

  it('不设上限（max 不传）时加号一直可用', () => {
    const wrapper = mountStepper({ modelValue: 999 });

    expect(wrapper.find('.stepper__btn--plus').element.disabled).toBe(false);
  });

  it('整组禁用：两枚按钮都点不动，输入框也锁上', () => {
    const wrapper = mountStepper({ disabled: true });

    expect(wrapper.find('.stepper__control').classes()).toContain(
      'is-disabled'
    );
    expect(
      wrapper.findAll('.stepper__btn').map(btn => btn.element.disabled)
    ).toEqual([true, true]);
    expect(wrapper.find('.stepper__input').element.disabled).toBe(true);
  });

  it('手输一个数：派发出去；超出上下限的当场截断并纠正显示', async () => {
    const wrapper = mountStepper({ modelValue: 0, min: 0, max: 20 });
    const input = wrapper.find('.stepper__input');

    await input.setValue('7');
    expect(emittedValues(wrapper)).toEqual([7]);
    expect(input.element.value).toBe('7');

    await input.setValue('999');
    expect(emittedValues(wrapper)).toEqual([7, 20]);
    // 框里不能留着一个不生效的数
    expect(input.element.value).toBe('20');
  });

  it('删到一半（空着）不派发，失焦时把当前值拿回来', async () => {
    const wrapper = mountStepper({ modelValue: 5 });
    const input = wrapper.find('.stepper__input');

    await input.setValue('');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(input.element.value).toBe('');

    await input.trigger('blur');
    expect(input.element.value).toBe('5');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('失焦时输入的是一个越界的数，就落成截断后的值', async () => {
    const wrapper = mountStepper({ modelValue: 5, max: 8 });
    const input = wrapper.find('.stepper__input');

    await input.setValue('12');
    await input.trigger('blur');

    expect(input.element.value).toBe('8');
  });

  it('无障碍：按钮读得出是给哪个字段加减的，输入框与标题互指', () => {
    const labeled = mountStepper({ label: '本回合已出牌数' });

    expect(
      labeled
        .findAll('.stepper__btn')
        .map(btn => btn.attributes('aria-label'))
    ).toEqual(['减少本回合已出牌数', '增加本回合已出牌数']);

    const input = labeled.find('.stepper__input');
    expect(input.attributes('aria-labelledby')).toBe(
      labeled.find('.stepper__label').attributes('id')
    );
    // 有标题就不再另挂 aria-label，免得读屏念两遍
    expect(input.attributes('aria-label')).toBeUndefined();

    // 没有标题时给一个兜底的可读名
    expect(
      mountStepper().find('.stepper__input').attributes('aria-label')
    ).toBe('数值');
  });

  it('外部传入的 class 会落到根元素上，便于页面挂布局类', () => {
    const wrapper = mountStepper(
      {},
      { attrs: { class: 'luo-tong__qty' } }
    );

    expect(wrapper.classes()).toContain('luo-tong__qty');
  });
});
