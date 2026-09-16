<script setup>
  import { computed, useId } from 'vue';

  /**
   * RadioGroup —— 单选按钮组（无业务耦合的基础 UI 组件）
   *
   * 与 @/ui/Select 的分工只在「选项露不露面」：Select 把选项收进下拉，点开才知道有什么；
   * 本组件把选项全摊在行上，每个选项是一枚可点的按钮面 —— 二选一、四选一这种
   * 扫一眼就能定的值域，省掉「展开 → 找 → 点」三下。值域大的（模式、将池、武将）
   * 仍然归 @/ui/Select / @/ui/SearchSelect。
   *
   * 单选语义整个交给原生 <input type="radio">，不自己搓：
   *   · 同组 input 共用一个 name（不传就按实例生成），浏览器自带「同组只选一个」
   *     与方向键切换；一页放几组也互不串台
   *   · 表单提交、原生必填校验、屏幕阅读器读「单选按钮，4 之 1」都是白拿的
   * 可视部分只有按钮面（label 元素，整块可点），真正的 input 视觉隐藏但不从无障碍树里摘掉。
   *
   * 结构契约（供测试与使用方布局引用）：
   *   .radio-field           —— 根元素（标题 + 选项组 的横向组合）
   *   .radio-field__label    —— 字段标题（不传 label 则不渲染）
   *   .radio-field__required —— 必填星号（不传 required 则不渲染）
   *   .radio-field__options  —— 选项组（role="radiogroup"）
   *   .radio-field__option   —— 单个选项（按钮面；选中挂 .is-checked，禁用挂 .is-disabled）
   *   .radio-field__input    —— 原生 radio（视觉隐藏）
   *   .radio-field__text     —— 选项文字
   *
   * 与 @/ui/Select 同高（--control-height），也不额外用伪元素外扩触控热区：
   * 一行一个控件、行距 16px 的窄栏里，那层看不见的外扩只会让相邻行互相侵入。
   * 需要 44px 热区的页面自己往外补。
   *
   * 选项一律排一行、等分宽度：一行放不下时文字省略（与 @/ui/Select 的取值文字同一套处理），
   * 不折行 —— 折行会让落在第二行的那一枚独占整行，看着像被选中了。
   */
  const props = defineProps({
    /** v-model 绑定值；空值（'' / undefined）即未选择 */
    modelValue: { type: [String, Number], default: undefined },
    /** 选项：[{ label, value, disabled? }] */
    options: { type: Array, default: () => [] },
    /** 字段标题；留空则不渲染标题行 */
    label: { type: String, default: '' },
    /** 必填：标题后加朱砂星号，并透出 aria-required */
    required: { type: Boolean, default: false },
    /** 禁用整组 */
    disabled: { type: Boolean, default: false },
    /** 表单字段名（同组 input 共用）；留空按实例生成 */
    name: { type: String, default: '' },
  });

  const emit = defineEmits(['update:modelValue']);

  const fieldId = useId();

  /** 标题与选项组的关联 id（aria-labelledby） */
  const labelId = `${fieldId}-label`;
  /** 同组 input 的同名标识：不传 name 就按实例生成 */
  const groupName = computed(() => props.name || fieldId);

  /** 该选项是否选中；空值（未选择）时任何选项都不算选中 */
  function isChecked(option) {
    const value = props.modelValue;
    if (value === '' || value === undefined || value === null) return false;
    return option.value === value;
  }
</script>

<template>
  <div class="radio-field">
    <span v-if="label" :id="labelId" class="radio-field__label">
      {{ label }}
      <span v-if="required" class="radio-field__required" aria-hidden="true">
        *
      </span>
    </span>

    <div
      class="radio-field__options"
      role="radiogroup"
      :aria-labelledby="label ? labelId : undefined"
      :aria-required="required ? 'true' : undefined"
    >
      <label
        v-for="option in options"
        :key="option.value"
        class="radio-field__option"
        :class="{
          'is-checked': isChecked(option),
          'is-disabled': disabled || option.disabled,
        }"
      >
        <input
          class="radio-field__input"
          type="radio"
          :name="groupName"
          :value="option.value"
          :checked="isChecked(option)"
          :disabled="disabled || option.disabled"
          :required="required"
          @change="emit('update:modelValue', option.value)"
        />

        <span class="radio-field__text">{{ option.label }}</span>
      </label>
    </div>
  </div>
</template>

<style scoped lang="less">
  /* ================================================================
   字段容器：标题与选项组同一行 —— 标题按内容宽，选项组吃掉剩余宽度
   （与 @/ui/Select 的 .select-field 同版式，两行控件左边线才对得齐）
   ================================================================ */
  .radio-field {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
  }

  .radio-field__label {
    /* 与选项组同行后不参与伸缩，免得长标题把按钮压窄 */
    flex: none;
    display: inline-flex;
    align-items: baseline;
    gap: var(--space-1);
    font-family: var(--font-body);
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    letter-spacing: 0.02em;
    color: var(--text-secondary);
  }

  /* 必填标记：朱砂星号，压在标题右上角 */
  .radio-field__required {
    font-family: var(--font-body);
    font-size: var(--text-sm);
    line-height: 1;
    color: var(--accent-red);
  }

  /* ================================================================
   选项组：等分排一行，每个选项都长成按钮
   ================================================================ */
  .radio-field__options {
    display: flex;
    /* 占满标题之外的全部宽度（没有标题时即撑满整行） */
    flex: 1;
    min-width: 0;
    gap: var(--space-2);
  }

  /* 按钮面：漆器面 —— 暖底、纸缘描边、圆润光泽（与 Select 的触发框同一个面） */
  .radio-field__option {
    position: relative;
    display: flex;
    /* 等分：选项宽度不随文字长短变，一行按钮才是齐的 */
    flex: 1 1 0;
    min-width: 0;
    align-items: center;
    justify-content: center;
    min-height: var(--control-height);
    /* 左右各 4px：文字本身居中，这层只是兜底 ——
       留得越窄，一行四枚（军争 / 团战）在窄屏上越不容易把文字挤成省略号 */
    padding: 0 var(--space-1);
    font-family: var(--font-body);
    font-size: var(--text-base);
    line-height: var(--leading-normal);
    /* 未选中：淡墨，给选中的那一枚留出层次 */
    color: var(--text-secondary);
    background-color: var(--bg-surface);
    background-image: var(--card-lacquer-gradient);
    border: var(--border-thin) solid var(--border);
    border-radius: var(--radius-md);
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: var(--tap-highlight);
    transition:
      transform var(--duration-fast) var(--ease-out),
      border-color var(--duration-fast) var(--ease-out),
      background-color var(--duration-fast) var(--ease-out),
      color var(--duration-fast) var(--ease-out),
      box-shadow var(--duration-fast) var(--ease-out);

    /* 悬停只在真有指针的设备上给（触屏上 :hover 会粘住不放） */
    @media (hover: hover) {
      &:hover:not(.is-checked, .is-disabled) {
        border-color: var(--accent-gold-light);
        background-color: var(--bg-surface-hover);
        color: var(--text-primary);
      }
    }

    /* 按下：与 @/ui/Button 同一个反馈量 */
    &:active:not(.is-disabled) {
      transform: scale(0.97);
    }

    /* 选中 —— 竹简落印：金描边 + 淡金底 + 金辉光，字色回到浓墨并加半档字重。
       注意不用金色写字：--accent-gold 在 Light 模式只有 3.0:1（设计系统 §4.1），
       选中态不靠字色也站得住 */
    &.is-checked {
      color: var(--text-primary);
      font-weight: var(--font-medium);
      background-color: var(--accent-gold-bg);
      border-color: var(--accent-gold);
      box-shadow: var(--shadow-glow-gold);
    }

    &.is-disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* 键盘焦点落在真正持有语义的 input 上：焦点环画在按钮面上（设计系统 §3.6）。
       鼠标点选时 input 不匹配 :focus-visible，不会平白多一圈 */
    &:has(.radio-field__input:focus-visible) {
      outline: 2px solid var(--accent-gold);
      outline-offset: 2px;
    }
  }

  /* 选项文字：窄屏放不下就省略，绝不撑破所在列 */
  .radio-field__text {
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  /* 原生 radio：视觉隐藏（1px 透明贴在按钮面左上角），
     点击面由外层的 label 承担，键盘与表单语义仍留在它身上 */
  .radio-field__input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
    pointer-events: none;
  }
</style>
