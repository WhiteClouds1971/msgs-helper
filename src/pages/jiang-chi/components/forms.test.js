import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import DouDiZhuForm from './DouDiZhuForm.vue';
import JunZhengForm from './JunZhengForm.vue';
import TuanZhanForm from './TuanZhanForm.vue';

/**
 * 三个模式表单的接线：页面上「身份（位置）」每个选项后面那个胜率，就是 rates 里按
 * value 取出来的那一句（见 ../Index.vue 的 roleRates 与 ../rates.js）。
 *
 * 「对局」那一行没有胜率，一个 hint 都不该有。
 */
const mountForm = (component, rates) =>
  mount(component, { props: { role: '', result: '', rates } });

/** 取「身份 / 位置」那一组里每个选项的文字（选项名 + 括号里的胜率） */
const roleOptions = wrapper =>
  wrapper
    .findAll('.radio-field')[0]
    .findAll('.radio-field__option')
    .map(option => option.text().replace(/\s+/g, ''));

describe('将池页各模式表单的身份（位置）胜率', () => {
  it('斗地主：地主 / 农民各自的胜率画在各自选项上', () => {
    const wrapper = mountForm(DouDiZhuForm, {
      landlord: '75%',
      farmer: '25%',
    });

    expect(roleOptions(wrapper)).toEqual(['地主（75%）', '农民（25%）']);
  });

  it('军争：四个身份各取各的，没打过（rates 里没有）的那枚只显示身份名', () => {
    const wrapper = mountForm(JunZhengForm, {
      lord: '40%',
      loyalist: '50%',
      rebel: '60%',
    });

    expect(roleOptions(wrapper)).toEqual([
      '主公（40%）',
      '忠臣（50%）',
      '反贼（60%）',
      '内奸',
    ]);
  });

  it('团战：位置的 value 是 "1" 这样的字符串，照样取得到', () => {
    const wrapper = mountForm(TuanZhanForm, { 1: '75%', 4: '100%' });

    expect(roleOptions(wrapper)).toEqual([
      '一号位（75%）',
      '二号位',
      '三号位',
      '四号位（100%）',
    ]);
  });

  it('胜率还没拉回来（rates 为空）时，选项上只有身份名，不留空位', () => {
    for (const empty of [undefined, {}]) {
      expect(roleOptions(mountForm(JunZhengForm, empty))).toEqual([
        '主公',
        '忠臣',
        '反贼',
        '内奸',
      ]);
    }
  });

  it('「对局」那一行不带胜率', () => {
    const wrapper = mountForm(DouDiZhuForm, { landlord: '75%', farmer: '25%' });

    const outcomes = wrapper.findAll('.radio-field')[1];
    expect(outcomes.findAll('.radio-field__hint')).toHaveLength(0);
    expect(outcomes.findAll('.radio-field__option').map(o => o.text())).toEqual(
      ['赢', '输']
    );
  });
});
