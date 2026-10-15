<script setup>
  import { computed, ref, useId, watch } from 'vue';

  /**
   * Stepper —— 数值步进器（无业务耦合的基础 UI 组件）
   *
   * 一个计数用的控件：左减、右加，中间那个数字可以直接点进去改。
   * 凡是「同一件东西的数一数」的场面都归它 —— 出牌数、体力、标记数。
   * 值域小的枚举归 @/ui/RadioGroup，值域大的选择归 @/ui/Select / @/ui/SearchSelect，
   * 这里只管**开区间数量**这一种。
   *
   * 值由使用方持有（v-model），组件自己不记状态：加减与手输都只 emit
   * `update:modelValue`，显示什么完全看传进来的那个数。
   *
   * 手输的三条约定：
   *   · 打字期间如实回显（清空也不算数），失焦时才拿回当前值 —— 否则删到一半就被顶回来
   *   · 输进来的数一律按 min / max 截断，且**当场**把显示纠正过来（输 999、上限 20，立刻显示 20）
   *   · 输入框自己按字数宽：2 位数与 3 位数一样居中，不跳版
   *
   * 与 @/ui/Select / @/ui/RadioGroup 同版式（标题在左、控件在右，控件吃掉剩余宽度），
   * 但**控件比它们高一档**（--control-height + --space-2 = 44px）：加减按钮是本组件的主力操作，
   * 一枚 36px 见方的按钮在触屏上偏小（设计系统 §3.8），干脆整条控件就按 44px 立住，
   * 用不着再拿不可见伪元素去外扩热区。
   *
   * 结构契约（供测试与使用方布局引用）：
   *   .stepper            —— 根元素（标题 + 控件 的横向组合）
   *   .stepper__label     —— 字段标题（不传 label 则不渲染）
   *   .stepper__control   —— 控件本体（漆器面；整组禁用挂 .is-disabled）
   *   .stepper__btn       —— 加减按钮（--minus / --plus；到边界即 disabled）
   *   .stepper__value     —— 数字 + 单位那一格
   *   .stepper__input     —— 原生 number 输入框（视觉上去掉边框与原生上下箭头）
   *   .stepper__suffix    —— 单位（不传 suffix 则不渲染）
   */
  const props = defineProps({
    /** v-model 绑定值 */
    modelValue: { type: Number, default: 0 },
    /** 下限（null = 不设下限） */
    min: { type: Number, default: 0 },
    /** 上限（null = 不封顶） */
    max: { type: Number, default: null },
    /** 每次加减的量 */
    step: { type: Number, default: 1 },
    /** 字段标题；留空则不渲染标题行 */
    label: { type: String, default: '' },
    /** 数字后面的单位（如「张」）；留空则不渲染 */
    suffix: { type: String, default: '' },
    /** 禁用整组 */
    disabled: { type: Boolean, default: false },
  });

  const emit = defineEmits(['update:modelValue']);

  const inputId = useId();
  /** 标题与输入框的关联 id */
  const labelId = `${inputId}-label`;

  /** 输入框里的可见文本 —— 与 modelValue 分开存，才容得下「删到一半」的中间态 */
  const draft = ref(toText(props.modelValue));

  watch(
    () => props.modelValue,
    value => {
      draft.value = toText(value);
    }
  );

  /** 数字宽度：按当前文本长度给（最短 2 个字宽），几位数都不跳版 */
  const valueWidth = computed(() => `${Math.max(2, draft.value.length)}ch`);

  const canDecrease = computed(
    () => !props.disabled && (props.min === null || props.modelValue > props.min)
  );

  const canIncrease = computed(
    () => !props.disabled && (props.max === null || props.modelValue < props.max)
  );

  function toText(value) {
    if (value === null || value === undefined || Number.isNaN(value)) return '';
    return String(value);
  }

  /** 一律按上下限截断（没设的那一头就不管） */
  function clamp(value) {
    let next = value;
    if (props.min !== null && next < props.min) next = props.min;
    if (props.max !== null && next > props.max) next = props.max;
    return next;
  }

  function commit(value) {
    const next = clamp(value);
    emit('update:modelValue', next);
    return next;
  }

  function decrease() {
    draft.value = toText(commit(props.modelValue - props.step));
  }

  function increase() {
    draft.value = toText(commit(props.modelValue + props.step));
  }

  function handleInput(event) {
    const raw = event.target.value;
    draft.value = raw;
    // 清空或半截输入（"-"、"1e"）先不认：等失焦时再拿当前值顶回去
    if (raw.trim() === '') return;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return;
    const next = commit(parsed);
    // 被上下限截住就当场纠正显示，别让框里留着一个不生效的数
    if (String(next) !== raw) draft.value = toText(next);
  }

  function handleBlur() {
    const raw = draft.value.trim();
    const parsed = raw === '' ? NaN : Number(raw);
    draft.value = toText(Number.isFinite(parsed) ? clamp(parsed) : props.modelValue);
  }
</script>

<template>
  <div class="stepper">
    <label v-if="label" :id="labelId" class="stepper__label" :for="inputId">
      {{ label }}
    </label>

    <div class="stepper__control" :class="{ 'is-disabled': disabled }">
      <button
        class="stepper__btn stepper__btn--minus"
        type="button"
        :disabled="!canDecrease"
        :aria-label="label ? `减少${label}` : '减少'"
        @click="decrease"
      >
        <span aria-hidden="true">−</span>
      </button>

      <span class="stepper__value">
        <input
          :id="inputId"
          class="stepper__input"
          type="number"
          inputmode="numeric"
          :value="draft"
          :min="min ?? undefined"
          :max="max ?? undefined"
          :step="step"
          :disabled="disabled"
          :style="{ width: valueWidth }"
          :aria-labelledby="label ? labelId : undefined"
          :aria-label="label ? undefined : '数值'"
          @input="handleInput"
          @blur="handleBlur"
        />
        <span v-if="suffix" class="stepper__suffix">{{ suffix }}</span>
      </span>

      <button
        class="stepper__btn stepper__btn--plus"
        type="button"
        :disabled="!canIncrease"
        :aria-label="label ? `增加${label}` : '增加'"
        @click="increase"
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="less">
  /* ================================================================
   字段容器：标题与控件同一行 —— 标题按内容宽，控件吃掉剩余宽度
   （与 @/ui/Select 的 .select-field / @/ui/RadioGroup 的 .radio-field 同版式）
   ================================================================ */
  .stepper {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
  }

  .stepper__label {
    /* 与控件同行后不参与伸缩，免得长标题把加减按钮压窄 */
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

  /* ================================================================
   控件本体 —— 漆器面：暖底、纸缘描边、圆润光泽
   三格一行：减 / 数字 / 加，等分不了（中间那格随字数走），两侧固定 44px
   ================================================================ */
  .stepper__control {
    display: flex;
    align-items: stretch;
    /* 占满标题之外的全部宽度（没有标题时即撑满整行） */
    flex: 1;
    min-width: 0;
    /* 比 --control-height 高一档：加减是本控件的主力操作，按 44px 触控下限立住 */
    min-height: calc(var(--control-height) + var(--space-2));
    font-family: var(--font-body);
    color: var(--text-primary);
    background-color: var(--bg-surface);
    background-image: var(--card-lacquer-gradient);
    border: var(--border-thin) solid var(--border);
    border-radius: var(--radius-md);
    overflow: hidden;
    transition:
      border-color var(--duration-fast) var(--ease-out),
      box-shadow var(--duration-fast) var(--ease-out);

    &:focus-within {
      border-color: var(--accent-gold);
      box-shadow: var(--shadow-glow-gold);
    }

    &.is-disabled {
      opacity: 0.5;
    }
  }

  /* ================================================================
   加减按钮：与控件同高的一格，两边各 44px
   两枚按钮共用一个面（在控件内部，没有自己的描边），只靠一条细分割线与数字分开
   ================================================================ */
  .stepper__btn {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    /* 44px 见方 —— 触控下限（设计系统 §3.8） */
    width: calc(var(--control-height) + var(--space-2));
    padding: 0;
    font-family: var(--font-body);
    font-size: var(--text-xl);
    line-height: 1;
    color: var(--text-secondary);
    background: none;
    border: none;
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: var(--tap-highlight);
    transition:
      background-color var(--duration-fast) var(--ease-out),
      color var(--duration-fast) var(--ease-out);

    @media (hover: hover) {
      &:hover:not(:disabled) {
        background-color: var(--bg-surface-hover);
        color: var(--accent-gold);
      }
    }

    &:active:not(:disabled) {
      background-color: var(--accent-gold-bg);
    }

    /* 键盘焦点画在自己身上（按钮自己有焦点，不需要再借 input 的） */
    &:focus-visible {
      outline: 2px solid var(--accent-gold);
      outline-offset: -2px;
    }

    &:disabled {
      color: var(--text-tertiary);
      cursor: not-allowed;
    }
  }

  /* 分割线画在加号那一枚的左缘（减号那枚的右缘留给「主次」——
     数字左边贴着减号、右边隔一条线，视线会先落在数字上） */
  .stepper__btn--plus {
    border-left: var(--border-thin) solid var(--border);
  }

  /* ================================================================
   数字那一格：数字居左、单位紧随其后，整体居中
   ================================================================ */
  .stepper__value {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-1);
    /* 吃掉两侧按钮之外的宽度 */
    flex: 1;
    min-width: 0;
    padding: 0 var(--space-2);
  }

  /* 原生 number 输入框：去掉描边与底色，只留一个能点进去改的数字。
     原生上下箭头也一并撤掉 —— 加减已经由两侧的按钮承担，再来一对箭头是两套操作打一架 */
  .stepper__input {
    min-width: 0;
    padding: 0;
    font-family: var(--font-body);
    font-size: var(--text-lg);
    font-weight: var(--font-medium);
    /* 数字等宽：位数变化时数字本身不左右晃 */
    font-variant-numeric: var(--font-nums);
    line-height: var(--leading-normal);
    text-align: center;
    color: var(--text-primary);
    background: none;
    border: none;
    appearance: textfield;
    -moz-appearance: textfield;

    &:focus {
      outline: none;
    }

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  }

  /* 单位：比数字低一档的信息 */
  .stepper__suffix {
    flex: none;
    font-size: var(--text-xs);
    letter-spacing: 0.02em;
    color: var(--text-secondary);
  }
</style>
