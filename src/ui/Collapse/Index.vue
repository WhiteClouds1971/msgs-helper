<script setup>
  import {
    AccordionContent,
    AccordionHeader,
    AccordionItem,
    AccordionRoot,
    AccordionTrigger,
  } from 'reka-ui';

  /**
   * Collapse —— 折叠框（无业务耦合的基础 UI 组件）
   *
   * 一组「标题 + 可收起的正文」：标题常驻一行，正文默认收着，点标题展开。
   * 组数、组里放什么、展开哪几组都由使用方决定 —— 几条 items 一行 v-model，
   * 正文走默认插槽（拿得到当前这一条 item）。
   *
   * 与 @/ui/Drawer 分工：Drawer 是盖住页面的一次性面板（选完就走），
   * 本组件是留在页面里的一节内容 —— 牌池、分组设置这类「常驻但要收着」的块用它。
   *
   * 语义与键盘交给 reka-ui 的 Accordion（不是自己拿 v-show 搓的折叠）：
   * role=region 与 aria-labelledby 互指、标题即按钮、上下方向键在组间跳、
   * Home / End 到首尾，屏幕阅读器读到的是「按钮，已展开/已折叠」。
   *
   * <b>正文不做高度动画</b>：设计系统 §6 明令不用 height 做动画（会带着整页回流），
   * 这里开门见山 —— 收起的那一组直接从 DOM 摘掉（reka-ui 的 unmountOnHide 默认开），
   * 展开时正文整体淡入上浮一段（只动 opacity + transform），箭头同时转个身。
   *
   * 结构契约（供测试与使用方布局引用）：
   *   .collapse            —— 根元素（各组纵向堆叠，间距 --space-2）
   *   .collapse__item      —— 单个折叠框（漆器面：底色 + 纸缘描边 + 圆角）
   *   .collapse__header    —— 标题容器（reka-ui 默认渲染 h3，本组件把外边距归零）
   *   .collapse__trigger   —— 标题行（按钮，44px；reka-ui 在其上挂 data-state=open|closed）
   *   .collapse__title     —— 标题文字（毛笔字）
   *   .collapse__hint      —— 标题后的一句补充（如「44 张」，不传不渲染）
   *   .collapse__chevron   —— 右侧箭头（CSS 画的，展开时翻转）
   *   .collapse__panel     —— 正文容器（收起时整块不挂载）
   */
  defineProps({
    /**
     * v-model 绑定值：type='single' 时是单个值（如 'pai'），
     * type='multiple' 时是数组（如 ['pai', 'ji']）。
     */
    modelValue: { type: [String, Number, Array], default: undefined },
    /** 折叠框：[{ value, title, hint?, disabled? }]；顺序即展示顺序 */
    items: { type: Array, default: () => [] },
    /** 单选：同时只展开一组 | 多选：各组各管各的 */
    type: {
      type: String,
      default: 'single',
      validator: value => ['single', 'multiple'].includes(value),
    },
    /**
     * 单选时能否把展开的那一组再收回去（默认能）
     *
     * 只在 type='single' 时有效：多选时每一组本来就能各自收起，
     * reka-ui 对 multiple 传这个属性会直接报错。
     */
    collapsible: { type: Boolean, default: true },
  });

  const emit = defineEmits(['update:modelValue']);
</script>

<template>
  <AccordionRoot
    class="collapse"
    :type="type"
    :collapsible="type === 'single' ? collapsible : undefined"
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <AccordionItem
      v-for="item in items"
      :key="item.value"
      class="collapse__item"
      :value="item.value"
      :disabled="item.disabled"
    >
      <AccordionHeader class="collapse__header">
        <AccordionTrigger class="collapse__trigger">
          <span class="collapse__title">{{ item.title }}</span>
          <span v-if="item.hint" class="collapse__hint">{{ item.hint }}</span>
          <span class="collapse__chevron" aria-hidden="true" />
        </AccordionTrigger>
      </AccordionHeader>

      <AccordionContent class="collapse__panel">
        <slot :item="item" />
      </AccordionContent>
    </AccordionItem>
  </AccordionRoot>
</template>

<style scoped lang="less">
  .collapse {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    min-width: 0;
  }

  /* ================================================================
   单个折叠框 —— 漆器面：与 @/ui/SkillCard / @/ui/PlayingCard 同一个面
   ================================================================ */
  .collapse__item {
    /* 正文与标题同宽同圆角：裁在框上，面板里的内容不会越过圆角 */
    overflow: hidden;
    background-color: var(--bg-surface);
    background-image: var(--card-lacquer-gradient);
    border: var(--border-thin) solid var(--border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
  }

  /* reka-ui 的 AccordionHeader 默认是 h3，自带外边距与字重：归零，
     排版整个交给标题按钮（页面上的标题层级仍由 h3 表达，设计系统 §4.3） */
  .collapse__header {
    margin: 0;
    font-size: inherit;
    font-weight: inherit;
  }

  /* ================================================================
   标题行 —— 整行可点（44px 触控下限），箭头钉在最右
   ================================================================ */
  .collapse__trigger {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    width: 100%;
    min-height: 44px;
    padding: 0 var(--space-3);
    font-family: var(--font-body);
    text-align: left;
    color: var(--text-primary);
    background: none;
    border: none;
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: var(--tap-highlight);
    transition: background-color var(--duration-fast) var(--ease-out);

    /* 悬停只在真有指针的设备上给（触屏上 :hover 会粘住不放） */
    @media (hover: hover) {
      &:hover:not([data-disabled]) {
        background-color: var(--bg-surface-hover);
      }
    }

    /* 焦点环画在整行里侧（设计系统 §3.6）；鼠标点击不匹配 :focus-visible */
    &:focus-visible {
      outline: 2px solid var(--accent-gold);
      outline-offset: -2px;
    }

    &[data-disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .collapse__title {
    flex: none;
    font-family: var(--font-display);
    font-size: var(--text-lg);
    line-height: 1.2;
    letter-spacing: 0.02em;
  }

  /* 补充说明跟在标题后面（「游戏牌 44 张」），不抢标题的位置；
     --text-tertiary 留给水印，这里用次文字色（设计系统 §4.1） */
  .collapse__hint {
    flex: none;
    font-size: var(--text-xs);
    letter-spacing: 0.02em;
    font-variant-numeric: var(--font-nums);
    color: var(--text-secondary);
  }

  /* 箭头：金线画的「⌄」—— 右 + 下两条边转 45°，展开时翻成「⌃」。
     只动 transform，时长走 token（reduced-motion 由 token 归零） */
  .collapse__chevron {
    flex: none;
    /* margin-left: auto 把它推到最右 —— 标题与补充说明都留在左边 */
    margin-left: auto;
    width: 7px;
    height: 7px;
    border-right: var(--border-medium) solid var(--accent-gold);
    border-bottom: var(--border-medium) solid var(--accent-gold);
    transform: translateY(-2px) rotate(45deg);
    transition: transform var(--duration-normal) var(--ease-enter);
  }

  .collapse__trigger[data-state='open'] .collapse__chevron {
    transform: translateY(1px) rotate(-135deg);
  }

  /* ================================================================
   正文 —— 与标题隔一条纸缘线；收起时整块不挂载（reka-ui unmountOnHide）
   ================================================================ */
  .collapse__panel {
    min-width: 0;
    padding: var(--space-3);
    border-top: var(--border-thin) solid var(--border-light);
  }

  /* 展开：淡入 + 上浮一段（只动 opacity / transform） */
  .collapse__panel[data-state='open'] {
    animation: collapse-panel-in var(--duration-normal) var(--ease-enter) both;
  }

  @keyframes collapse-panel-in {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Reduced Motion —— 无障碍退化（设计系统 §4.2） */
  @media (prefers-reduced-motion: reduce) {
    .collapse__panel[data-state='open'] {
      animation: none;
    }
  }
</style>
