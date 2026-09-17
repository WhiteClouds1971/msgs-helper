<script setup>
  import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui';

  /**
   * Tabs —— 页签切换（无业务耦合的基础 UI 组件）
   *
   * 只管「一组值里当前选中哪一个 + 把选中那一枚的面板画出来」：给页签、v-model 绑值，
   * 其余（放在哪、面板里放什么、间距多大）都由使用方决定 —— 面板内容走默认插槽，
   * 拿得到当前这一枚 item。
   *
   * 与 @/ui/RadioGroup 的分工：RadioGroup 是「填一个字段」，选项摊成一行按钮就直接是表单的一部分；
   * 本组件是「切换下面那一大块内容」，页签条与内容是一体的，值域通常还更多（一屏放得下就不该收进下拉）。
   *
   * 语义与键盘都交给 reka-ui：role=tablist / tab / tabpanel、左右方向键切换、
   * aria-controls 与 aria-labelledby 的互指都是白拿的。
   *
   * <b>内容只在当前这一枚里挂载</b>：每一枚页签都对应一个 role=tabpanel 的容器，非当前的
   * 那几枚带 hidden、里面的插槽内容不挂载（reka-ui 的 unmountOnHide 默认开）——
   * 于是切页签等于把上一块整个拆掉、新的一块重新挂载，页面按当前页签拉数据的写法
   * （watch 选中值）天然对得上，也不会把四个面板的 DOM 一起堆在页面上。
   * 取「当前这块」用 `:not([hidden])`。
   *
   * 结构契约（供测试与使用方布局引用）：
   *   .tabs          —— 根元素
   *   .tabs__list    —— 页签条（role=tablist，下沿一条纸缘色描边）
   *   .tabs__tab     —— 单个页签（reka-ui 在其上挂 data-state=active|inactive、data-disabled）
   *   .tabs__label   —— 页签文字（放不下时省略，绝不折行）
   *   .tabs__panel   —— 面板容器（非当前页签的那几枚带 hidden，内容也不挂载）
   *
   * 页签等分整行宽度（与 @/ui/RadioGroup 的选项同一个排法）：一屏最多四枚，
   * 等分之后文字长度相差多少，页签条看着都是齐的。
   */
  defineProps({
    /** v-model 绑定值；空值（'' / undefined）时没有任何一枚是选中的 */
    modelValue: { type: [String, Number], default: undefined },
    /** 页签：[{ label, value, disabled? }]；顺序即展示顺序 */
    items: { type: Array, default: () => [] },
    /**
     * 页签条的无障碍名（如「身份」）—— 只喂给 aria-label，不画出来。
     * 页面上别处已经有可见标题时可省。
     */
    label: { type: String, default: '' },
    /** 排布方向：horizontal 走左右方向键，vertical 走上下方向键 */
    orientation: {
      type: String,
      default: 'horizontal',
      validator: value => ['horizontal', 'vertical'].includes(value),
    },
    /**
     * 填满父容器剩余高度（默认 false）
     *
     * 父容器要是纵向 flex 且自己有确定高度。开着时页签条与面板一起撑开，
     * <b>面板里的内容自己决定谁滚</b>（如 @/ui/Table 的 fill）——
     * 页面因此不用写 :deep 去够组件内部的面板。
     */
    fill: { type: Boolean, default: false },
  });

  const emit = defineEmits(['update:modelValue']);
</script>

<template>
  <TabsRoot
    :model-value="modelValue"
    :orientation="orientation"
    class="tabs"
    :class="{ 'is-fill': fill }"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <TabsList
      class="tabs__list"
      :aria-label="label || undefined"
    >
      <TabsTrigger
        v-for="item in items"
        :key="item.value"
        class="tabs__tab"
        :value="item.value"
        :disabled="item.disabled"
      >
        <span class="tabs__label">{{ item.label }}</span>
      </TabsTrigger>
    </TabsList>

    <!-- 面板只挂当前这一枚（reka-ui 的 Presence 卸载非选中项）；
         item 一并透出去，使用方不必再自己按选中值回查一次 -->
    <TabsContent
      v-for="item in items"
      :key="item.value"
      class="tabs__panel"
      :value="item.value"
    >
      <slot
        :item="item"
        :value="item.value"
      />
    </TabsContent>
  </TabsRoot>
</template>

<style scoped lang="less">
  .tabs {
    /* 页签条等分整行，但面板里可能有宽内容：别让本组件成为撑破页面的那一环 */
    min-width: 0;
  }

  /* ================================================================
   页签条 —— 竹简并排：下沿一条纸缘色描边，选中的那一枚用金线顶掉它
   ================================================================ */
  .tabs__list {
    display: flex;
    align-items: stretch;
    gap: var(--space-1);
    border-bottom: var(--border-thin) solid var(--border);
  }

  .tabs__tab {
    position: relative;
    /* 等分：页签宽度不随文字长短变，一排才是齐的 */
    flex: 1 1 0;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: var(--control-height);
    padding: 0 var(--space-2);
    font-family: var(--font-body);
    font-size: var(--text-sm);
    line-height: var(--leading-normal);
    letter-spacing: 0.02em;
    /* 未选中：淡墨，给选中的那一枚留出层次 */
    color: var(--text-secondary);
    background: none;
    border: none;
    /* 底线才是选中标记：2px 金线压在列表那条描边上（负外边距抵消掉描边，
       否则选中时整条页签会被顶高一像素） */
    border-bottom: var(--border-medium) solid transparent;
    margin-bottom: calc(-1 * var(--border-thin));
    border-radius: var(--radius-sm) var(--radius-sm) 0 0;
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: var(--tap-highlight);
    transition:
      color var(--duration-fast) var(--ease-out),
      background-color var(--duration-fast) var(--ease-out),
      border-color var(--duration-fast) var(--ease-out);

    /* 悬停只在真有指针的设备上给（触屏上 :hover 会粘住不放） */
    @media (hover: hover) {
      &:hover:not([data-disabled]) {
        color: var(--text-primary);
        background-color: var(--bg-surface-hover);
      }
    }

    /* 选中 —— 竹简落印：淡金底 + 金底线 + 浓墨字（不用金色写字：
       --accent-gold 在 Light 模式只有 3.0:1，见设计系统 §4.1） */
    &[data-state='active'] {
      color: var(--text-primary);
      font-weight: var(--font-medium);
      background-color: var(--accent-gold-bg);
      border-bottom-color: var(--accent-gold);
    }

    /* 键盘焦点环画在页签面上（设计系统 §3.6）；鼠标点选时按钮不匹配
       :focus-visible，不会平白多一圈 */
    &:focus-visible {
      outline: 2px solid var(--accent-gold);
      outline-offset: -2px;
    }

    &[data-disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  /* 页签文字：窄屏放不下就省略，绝不撑破所在列 */
  .tabs__label {
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  /* 面板：容器本身只有一条 min-width 兜底 —— 与页签条之间的间距、
     面板内部的排版都归使用方（本组件不自带内边距，免得与页面给的那层叠加） */
  .tabs__panel {
    min-width: 0;
  }

  /* ================================================================
   fill —— 填满父容器剩余高度：页签条定高，面板吃掉剩下的
   ================================================================ */
  .tabs.is-fill {
    display: flex;
    flex: 1;
    flex-direction: column;
    /* 下限归零：否则 flex 子项的下限是内容高度，面板里的长内容会把整页顶出滚动条 */
    min-height: 0;
  }

  .tabs.is-fill .tabs__list {
    flex: none;
  }

  .tabs.is-fill .tabs__panel {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
  }

  /* 非当前页签是 hidden 的 —— 上面那条 display: flex 会盖掉浏览器默认的
     [hidden] { display: none }，必须显式按回去，否则几个面板会一起叠出来 */
  .tabs.is-fill .tabs__panel[hidden] {
    display: none;
  }
</style>
