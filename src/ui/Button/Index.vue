<script setup>
  /**
   * Button —— 按钮（无业务耦合的基础 UI 组件）
   *
   * 两个变体（设计系统 §3.2 按钮）：
   *   · primary —— 深金底反白字，页面主操作（新增、确认）；视觉高 36px
   *   · ghost   —— 金色描边透明底，次要操作（重置、取消）；视觉高 32px，横向排布时不被挤压
   *
   * 两个变体的视觉高度都低于 §3.8 的 44px 触控下限，缺的那截用不可见的 ::after 补回来
   * （--btn-hit-area），真正可点的范围仍是 44px 见方。
   *
   * 只画按钮本身：点击事件、id、aria-*、额外 class 都按原生 <button> 透传
   * （页面直接写 @click / id="xxx"，不用为了挂事件再包一层）。
   * 默认 type="button" —— 放进表单里也不会变成提交按钮；要提交就自己传 type="submit"。
   */
  defineProps({
    /** 变体：primary（主操作）| ghost（次要操作） */
    variant: {
      type: String,
      default: 'primary',
      validator: value => ['primary', 'ghost'].includes(value),
    },
    /** 禁用 */
    disabled: { type: Boolean, default: false },
  });

  defineSlots();
</script>

<template>
  <button
    class="btn"
    :class="`btn--${variant}`"
    type="button"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<style scoped lang="less">
  /* ================================================================
   按钮基座：两变体共用的排版与状态
   ================================================================ */
  .btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-body);
    border-radius: var(--radius-md);
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
    -webkit-tap-highlight-color: var(--tap-highlight);
    transition:
      background-color var(--duration-fast) var(--ease-out),
      transform var(--duration-fast) var(--ease-out),
      box-shadow var(--duration-fast) var(--ease-out);

    /* 焦点环（设计系统 §3.6）：所有可交互元素都要有可见焦点指示 */
    &:focus-visible {
      outline: 2px solid var(--accent-gold);
      outline-offset: 2px;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* 视觉高度可以压，触控热区不压（设计系统 §3.8：交互元素 ≥44px）——
       用一块看不见的伪元素把热区补回 44px，各变体只声明自己缺多少。
       绝对定位所以不参与 flex 排布（按钮是 inline-flex）。 */
    &::after {
      content: '';
      position: absolute;
      inset: var(--btn-hit-area, 0);
    }
  }

  /* ================================================================
   主按钮 —— 漆器鎏金：深金底反白字，按下微缩 + 泛金辉光
   ================================================================ */
  .btn--primary {
    /* 视觉 --control-height、热区 44px（上下各补 4px）。
       按钮没有描边，补 --space-1 就够；有描边的控件要多补 1px（见 --control-hit-pad） */
    --btn-hit-area: calc(-1 * var(--space-1)) 0;
    min-height: var(--control-height);
    padding: 0 var(--space-4);
    font-size: var(--text-base);
    font-weight: var(--font-medium);
    color: var(--text-inverse);
    background: var(--accent-gold-dark);
    border: none;

    &:active {
      transform: scale(0.97);
      box-shadow: var(--shadow-glow-gold);
    }
  }

  /* ================================================================
   幽灵按钮 —— 金线描边：视觉收窄到 32px，触控热区外扩到 44px
   ================================================================ */
  .btn--ghost {
    /* 视觉 32px、热区 44px（四周各补 6px） */
    --btn-hit-area: -6px;
    /* 紧凑的次要操作：横向排布时不参与挤压 */
    flex: none;
    min-height: 32px;
    padding: 0 var(--space-2);
    font-size: var(--text-sm);
    line-height: 1;
    color: var(--accent-gold-dark);
    background: transparent;
    border: var(--border-thin) solid var(--accent-gold);

    &:active {
      background: var(--accent-gold-bg);
    }
  }
</style>
