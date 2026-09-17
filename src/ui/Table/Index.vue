<script setup>
  /**
   * Table —— 数据表格（无业务耦合的基础 UI 组件）
   *
   * 只管「把 columns 与 rows 画成一张表」：列、行、对齐方式都由使用方给，
   * 单元格的特殊画法（百分比、名次、链接…）走插槽，组件自己不认任何字段名 ——
   * 所以它既不格式化数字，也不排序、不翻页、不拉数据（那些都在页面里）。
   *
   * 默认单元格直接画 row[column.key]；要换个画法就按列名给一个插槽：
   *   <template #cell-rate="{ value, row }">{{ formatRate(value) }}</template>
   *
   * 窄屏：表格是「一列一个值」的形态，塞不下不折行（折行的表最难扫），
   * 由内层 .table__scroll 横向滚动 —— 横向滚的是表格，不是整页。
   *
   * 结构契约（供测试与使用方布局引用）：
   *   .table              —— 根元素（漆器面：底色 / 描边 / 圆角，圆角顺带裁住表头）
   *   .table__scroll      —— 横向滚动层
   *   .table__el          —— 原生 <table>
   *   .table__head        —— <thead>
   *   .table__row         —— 一行（空态那行带 .table__row--empty）
   *   .table__cell        —— 单元格（表头是 <th>）与空态格
   *   .table__cell--left / --center / --right —— 该列的对齐方式
   *   .table__empty       —— 空态文字所在的格
   */
  const props = defineProps({
    /** 列：[{ key, label, align?, width? }]；align 取 left / center / right（默认 left），width 是 CSS 宽度 */
    columns: { type: Array, default: () => [] },
    /** 行：对象数组，键与 columns 的 key 对应 */
    rows: { type: Array, default: () => [] },
    /**
     * 行的唯一键：给字段名（取 row[字段]），或给一个 (row, index) => 键 的函数。
     * 不给就退回用下标 —— 表格自己有排序 / 过滤时最好给上，否则行会跟着错位复用。
     */
    rowKey: { type: [String, Function], default: '' },
    /** 没有行时的提示文字 */
    emptyText: { type: String, default: '暂无数据' },
    /**
     * 填满父容器剩余高度，行多了在<b>表格内部</b>滚（表头吸顶），默认 false
     *
     * 父容器要给得出高度（纵向 flex 里的 flex: 1 + min-height: 0，或一个固定高度）——
     * 组件自己不知道外面还剩多少地方。开着时整页不会跟着滚，列表再长也不带动页面版式。
     */
    fill: { type: Boolean, default: false },
  });

  /** 该列的对齐方式，落成一个修饰类 */
  function alignClass(column) {
    return `table__cell--${column.align || 'left'}`;
  }

  /** 一行的键 */
  function keyOf(row, index) {
    if (typeof props.rowKey === 'function') return props.rowKey(row, index);
    if (props.rowKey) return row?.[props.rowKey];
    return index;
  }

  /** 默认单元格文字：null / undefined 一律留空（不要画出 "null" 三个字） */
  function cellText(value) {
    return value === null || value === undefined ? '' : value;
  }
</script>

<template>
  <div
    class="table"
    :class="{ 'is-fill': fill }"
  >
    <div class="table__scroll">
      <table class="table__el">
        <thead class="table__head">
          <tr class="table__row">
            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              class="table__cell"
              :class="alignClass(column)"
              :style="column.width ? { width: column.width } : undefined"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="(row, index) in rows"
            :key="keyOf(row, index)"
            class="table__row"
          >
            <td
              v-for="column in columns"
              :key="column.key"
              class="table__cell"
              :class="alignClass(column)"
            >
              <slot
                :name="`cell-${column.key}`"
                :row="row"
                :value="row?.[column.key]"
                :column="column"
                :index="index"
              >
                {{ cellText(row?.[column.key]) }}
              </slot>
            </td>
          </tr>

          <!-- 空态也是一行（colspan 铺满）：表头留着，人还知道这张表本来要看什么 -->
          <tr
            v-if="!rows.length"
            class="table__row table__row--empty"
          >
            <td
              class="table__cell table__empty"
              :colspan="columns.length"
            >
              {{ emptyText }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped lang="less">
  /* ================================================================
   表格面 —— 漆器：暖底、纸缘描边、圆润光泽（与 @/ui/Select 的触发框同一个面）。
   overflow: hidden 顺带把表头底色与滚动内容裁在圆角里
   ================================================================ */
  .table {
    background-color: var(--bg-surface);
    background-image: var(--card-lacquer-gradient);
    border: var(--border-thin) solid var(--border);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  /* 横向滚动归表格自己：窄屏塞不下时滚的是表格，不是整页 */
  .table__scroll {
    overflow-x: auto;
    overscroll-behavior-x: contain;
    -webkit-overflow-scrolling: touch;
  }

  .table__el {
    width: 100%;
    /* separate + 0 间距：与 collapse 视觉一致，但表头 position: sticky 在
       collapse 下不稳（边框可能跟着粘住的那一格不画）—— 单元格各自带边框，不受影响 */
    border-collapse: separate;
    border-spacing: 0;
    font-family: var(--font-body);
    font-size: var(--text-sm);
    color: var(--text-primary);
    /* 数字等宽：胜率、场数上下对得齐（一列数字扫起来才成列） */
    font-variant-numeric: var(--font-nums);
  }

  /* 单元格：一行一个值，窄屏靠横向滚动，不折行 */
  .table__cell {
    padding: var(--space-2) var(--space-3);
    text-align: left;
    line-height: var(--leading-normal);
    white-space: nowrap;
  }

  .table__cell--center {
    text-align: center;
  }

  .table__cell--right {
    text-align: right;
  }

  /* 表头：退一档的灰度 + 小一号字，下面压一条纸缘色描边 ——
     视线先落在数据上，表头只负责说明这是什么 */
  .table__head .table__cell {
    /* 表头吸顶：表格内部滚动时列名始终在视野里（不滚的表格上这条不起作用，留着无妨）。
       底色必须不透明 —— 否则底下的行会从字缝里透出来 */
    position: sticky;
    top: 0;
    z-index: 1;
    font-size: var(--text-xs);
    font-weight: var(--font-medium);
    letter-spacing: 0.02em;
    color: var(--text-secondary);
    background-color: var(--bg-surface-hover);
    border-bottom: var(--border-thin) solid var(--border);
  }

  /* 行与行之间一条极淡的分隔线（比表头那条更浅，层次才分得开） */
  .table__row + .table__row .table__cell {
    border-top: var(--border-thin) solid var(--border-light);
  }

  /* 悬停整行提亮，横着一行扫不容易串行（只在真有指针的设备上给） */
  @media (hover: hover) {
    tbody .table__row:hover .table__cell {
      background-color: var(--bg-surface-hover);
    }
  }

  /* ================================================================
   fill —— 填满父容器剩余高度：滚的是表体，不是整页
   ================================================================ */
  .table.is-fill {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .table.is-fill .table__scroll {
    flex: 1;
    min-height: 0;
    /* 纵向也归自己滚（默认只声明了横向）：行多了在这个框里滚，页面不跟着动 */
    overflow: auto;
  }

  /* 空态：占满整行居中，语气与占位文字一档 */
  .table__row--empty .table__empty {
    border-top: none;
    padding: var(--space-6) var(--space-3);
    text-align: center;
    font-size: var(--text-xs);
    letter-spacing: 0.02em;
    /* 不用 --text-tertiary：那一档留给水印与 placeholder，浅色模式下读起来太淡（设计系统 §4.1） */
    color: var(--text-secondary);
  }
</style>
