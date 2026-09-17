import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import Table from './Index.vue';

const COLUMNS = [
  { key: 'hero', label: '武将' },
  { key: 'games', label: '总场数', align: 'right' },
  { key: 'rate', label: '胜率', align: 'right' },
];

const ROWS = [
  { hero: '将马岱', games: 4, rate: 75 },
  { hero: '界周瑜', games: 1, rate: 0 },
];

const mountTable = (props = {}, options = {}) =>
  mount(Table, { props: { columns: COLUMNS, rows: ROWS, ...props }, ...options });

describe('Table', () => {
  it('表头按 columns 画，顺序与 label 都照给的那份来', () => {
    const wrapper = mountTable();
    const head = wrapper.findAll('.table__head .table__cell');

    expect(head.map(cell => cell.text())).toEqual(['武将', '总场数', '胜率']);
    expect(head.map(cell => cell.element.tagName)).toEqual(['TH', 'TH', 'TH']);
    expect(head.map(cell => cell.attributes('scope'))).toEqual([
      'col',
      'col',
      'col',
    ]);
  });

  it('一行一个对象，格子按 column.key 取', () => {
    const wrapper = mountTable();
    const rows = wrapper.findAll('tbody .table__row');

    expect(rows).toHaveLength(2);
    expect(rows[0].findAll('.table__cell').map(cell => cell.text())).toEqual([
      '将马岱',
      '4',
      '75',
    ]);
  });

  it('对齐方式落成修饰类，默认左对齐', () => {
    const wrapper = mountTable();
    const first = wrapper.findAll('tbody .table__row')[0].findAll('.table__cell');

    expect(first[0].classes()).toContain('table__cell--left');
    expect(first[1].classes()).toContain('table__cell--right');
    expect(
      wrapper.findAll('.table__head .table__cell')[2].classes()
    ).toContain('table__cell--right');
  });

  it('cell-<key> 插槽盖掉默认画法，拿得到 value / row / index', () => {
    const wrapper = mountTable(
      {},
      {
        slots: {
          'cell-rate': ({ value, row, index }) =>
            `${index}:${row.hero}=${value}%`,
        },
      }
    );

    expect(
      wrapper.findAll('tbody .table__row')[0].findAll('.table__cell')[2].text()
    ).toBe('0:将马岱=75%');
    // 没给插槽的列照旧画原值
    expect(
      wrapper.findAll('tbody .table__row')[1].findAll('.table__cell')[0].text()
    ).toBe('界周瑜');
  });

  it('null / undefined 的格子留空，不画出 null 三个字', () => {
    const wrapper = mountTable({ rows: [{ hero: '将马岱', games: null }] });

    expect(wrapper.findAll('tbody .table__row')[0].text()).not.toContain('null');
  });

  it('没有行时画空态那一行，铺满所有列，文字可覆盖', () => {
    const wrapper = mountTable({ rows: [] });

    const empty = wrapper.find('.table__empty');
    expect(empty.exists()).toBe(true);
    expect(empty.text()).toBe('暂无数据');
    expect(empty.attributes('colspan')).toBe('3');
    expect(wrapper.find('.table__row--empty').exists()).toBe(true);

    // 表头留着（人还知道这张表本来要看什么）
    expect(wrapper.findAll('.table__head .table__cell')).toHaveLength(3);

    const custom = mountTable({ rows: [], emptyText: '统计中…' });
    expect(custom.find('.table__empty').text()).toBe('统计中…');
  });

  it('rowKey 给字段名或函数都能用，行照样按序渲染', () => {
    const byField = mountTable({ rowKey: 'hero' });
    expect(
      byField.findAll('tbody .table__row').map(row => row.text())
    ).toEqual(['将马岱475', '界周瑜10']);

    const byFn = mountTable({ rowKey: (row, index) => `${row.hero}-${index}` });
    expect(byFn.findAll('tbody .table__row')).toHaveLength(2);
  });

  it('fill：根元素挂 is-fill（行多了在表格内部滚、表头吸顶，整页不动）', () => {
    expect(mountTable({ fill: true }).classes()).toContain('is-fill');
    expect(mountTable().classes()).not.toContain('is-fill');
  });

  it('外部传入的 class 会落到根元素上，便于页面挂布局类', () => {
    const wrapper = mountTable(
      {},
      { attrs: { class: 'sheng-lv-bang__table' } }
    );

    expect(wrapper.classes()).toContain('sheng-lv-bang__table');
  });
});
