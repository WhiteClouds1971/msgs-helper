<script setup>
  import { computed, useId } from 'vue';
  import {
    SelectRoot,
    SelectTrigger,
    SelectIcon,
    SelectPortal,
    SelectContent,
    SelectViewport,
    SelectItem,
    SelectItemText,
    SelectItemIndicator,
  } from 'reka-ui';

  /**
   * Select —— 单选下拉框（无业务耦合的基础 UI 组件）
   *
   * 只管「从 options 里选一个值」：给选项、v-model 绑值，其余（宽度、间距、摆在哪）
   * 都由使用方决定 —— 组件不自带列表容器语义，根元素是一个块级 div（宽度撑满所在容器）。
   *
   * 当前值文案自己按 options 算，不走 SelectValue 的选项注册：页面把持久化的值喂进来时
   * 下拉列表还没被打开过、选项尚未挂载，那时 SelectValue 只能渲染占位文字；
   * 自己算一遍就与「列表开没开过」无关（列表打开时两边显示的是同一个 label）。
   * 占位态由 reka-ui 挂在 trigger 上的 `data-placeholder` 标记，样式据此换淡墨色。
   *
   * 结构契约（供测试与使用方布局引用）：
   *   .select-field           —— 根元素（标题 + 触发按钮 的横向组合）
   *   .select-field__label    —— 字段标题（不传 label 则不渲染）
   *   .select-field__required —— 必填星号（不传 required 则不渲染）
   *   .select-field__trigger  —— 触发按钮（reka-ui 在其上挂 data-state / data-placeholder / data-disabled）
   *   .select-field__value    —— 当前值文案（无值时是占位文字）
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
    /** 未选择时的占位文案 */
    placeholder: { type: String, default: '请选择' },
    /** 禁用 */
    disabled: { type: Boolean, default: false },
    /** 表单字段名 —— 传入时才渲染同步的隐藏原生 select（表单提交 / 原生校验用） */
    name: { type: String, default: '' },
  });

  const emit = defineEmits(['update:modelValue']);

  /** 标题与触发按钮的关联 id（label[for] ↔ button[id]） */
  const triggerId = useId();

  /** 当前值的展示文案：以 options 为准；值已下线或为空则回落占位 */
  const selectedLabel = computed(
    () =>
      props.options.find(option => option.value === props.modelValue)?.label ??
      ''
  );
</script>

<template>
  <div class="select-field">
    <label v-if="label" :for="triggerId" class="select-field__label">
      {{ label }}
      <span v-if="required" class="select-field__required" aria-hidden="true">
        *
      </span>
    </label>

    <SelectRoot
      :model-value="modelValue"
      :disabled="disabled"
      :required="required"
      :name="name || undefined"
      @update:model-value="emit('update:modelValue', $event)"
    >
      <SelectTrigger :id="triggerId" class="select-field__trigger">
        <span class="select-field__value">
          {{ selectedLabel || placeholder }}
        </span>

        <SelectIcon class="select-field__icon">
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </SelectIcon>
      </SelectTrigger>

      <SelectPortal>
        <SelectContent
          class="select-field__content"
          position="popper"
          :side-offset="4"
        >
          <!-- 面板是自己的元素，样式（宽度/底色/描边/入场）才挂得住：
               reka-ui 的 content 根节点是 Teleport、viewport 根节点是 Fragment，
               本组件的 scoped 标记到不了它们身上，写在上面等于没写。
               面板里的视口自带 overflow 与 flex，只需限高 —— 也走内联给。 -->
          <div class="select-field__panel">
            <SelectViewport
              :style="{
                maxHeight:
                  'calc(var(--reka-select-content-available-height) - var(--space-2) - var(--border-thin))',
              }"
            >
              <SelectItem
                v-for="option in options"
                :key="option.value"
                class="select-field__item"
                :value="option.value"
                :disabled="option.disabled"
              >
                <SelectItemText>{{ option.label }}</SelectItemText>

                <SelectItemIndicator class="select-field__indicator">
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m4 12 6 6 10-12" />
                  </svg>
                </SelectItemIndicator>
              </SelectItem>
            </SelectViewport>
          </div>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>
  </div>
</template>

<style scoped lang="less">
  /* ================================================================
   字段容器：标题与控件同一行 —— 标题按内容宽，控件吃掉剩余宽度
   ================================================================ */
  .select-field {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
  }

  .select-field__label {
    /* 与控件同行后不参与伸缩，免得长标题把下拉挤窄 */
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
  .select-field__required {
    font-family: var(--font-body);
    font-size: var(--text-sm);
    line-height: 1;
    color: var(--accent-red);
  }

  /* ================================================================
   触发按钮 —— 漆器面：暖底、金描边、圆润光泽
   ================================================================ */
  .select-field__trigger {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    /* 占满标题之外的全部宽度（没有标题时即撑满整行） */
    flex: 1;
    min-width: 0;
    /* 与 @/ui/SearchSelect 的输入框、@/ui/Button 同高（--control-height） */
    min-height: var(--control-height);
    padding: 0 var(--space-2);
    font-family: var(--font-body);
    font-size: var(--text-base);
    line-height: var(--leading-normal);
    text-align: left;
    color: var(--text-primary);
    background-color: var(--bg-surface);
    background-image: var(--card-lacquer-gradient);
    border: var(--border-thin) solid var(--border);
    border-radius: var(--radius-md);
    cursor: pointer;
    -webkit-tap-highlight-color: var(--tap-highlight);
    transition:
      border-color var(--duration-fast) var(--ease-out),
      box-shadow var(--duration-fast) var(--ease-out);

    /* 视觉高度压到 --control-height，缺的 8px 用不可见伪元素补回热区（44px，设计系统 §3.8）；
       绝对定位所以不参与 flex 排布，也不影响内部的值与箭头。
       外扩量取 --control-hit-pad：与 @/ui/SearchSelect 的热区窄条同一份数据 */
    &::after {
      content: '';
      position: absolute;
      inset: calc(-1 * var(--control-hit-pad)) 0;
    }

    /* 未选择：文案退成淡墨（data-placeholder 由 reka-ui 挂在 trigger 上） */
    &[data-placeholder] .select-field__value {
      color: var(--text-tertiary);
    }

    &[data-state='open'],
    &:focus-visible {
      outline: none;
      border-color: var(--accent-gold);
      box-shadow: var(--shadow-glow-gold);
    }

    &[data-disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  /* 当前值 / 占位：单行省略，绝不撑破所在列 */
  .select-field__value {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .select-field__icon {
    flex: none;
    display: inline-flex;
    color: var(--text-tertiary);
    transition:
      transform var(--duration-fast) var(--ease-out),
      color var(--duration-fast) var(--ease-out);
  }

  .select-field__trigger[data-state='open'] .select-field__icon {
    transform: rotate(180deg);
    color: var(--accent-gold-dark);
  }

  /* ================================================================
   下拉面板 —— 竹简展开：宽度贴合触发按钮，高度受可用空间约束
   ================================================================ */
  .select-field__panel {
    /* popper 定位（position="popper"）由 reka-ui 在 content 上给出触发按钮宽度 */
    width: var(--reka-select-trigger-width);
    /* 只裁圆角，不裁高度：条目多了由内层视口滚 */
    overflow: hidden;
    padding: var(--space-1);
    background: var(--bg-surface);
    border: var(--border-thin) solid var(--border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    /* 从触发按钮一侧展开 */
    transform-origin: top center;
  }

  /* 入场状态挂在 reka-ui 的 content 上：它才是带 data-state 的那个元素 */
  .select-field__content[data-state='open'] .select-field__panel {
    animation: select-content-in var(--duration-fast) var(--ease-enter) both;
  }

  .select-field__content[data-state='closed'] .select-field__panel {
    animation: select-content-out var(--duration-instant) var(--ease-out) both;
  }

  @keyframes select-content-in {
    from {
      opacity: 0;
      transform: translateY(-4px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes select-content-out {
    from {
      opacity: 1;
      transform: scale(1);
    }
    to {
      opacity: 0;
      transform: scale(0.98);
    }
  }

  /* 视口是 reka-ui 的元素（scoped 标记够不着），限高走模板里的内联 style：
     高度 = 可用高度 - 面板上下内边距与描边，超出即滚（它自带 overflow: hidden auto） */

  /* ================================================================
   选项条目
   ================================================================ */
  .select-field__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    /* 条目与触发按钮同高（--control-height）：4px 内边距 + 16px 正文行高 */
    min-height: var(--control-height);
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-sm);
    font-family: var(--font-body);
    font-size: var(--text-base);
    color: var(--text-primary);
    cursor: pointer;
    user-select: none;

    /* 键盘 / 指针高亮：淡金底 + 深金字（保证 WCAG AA 对比度） */
    &[data-highlighted] {
      outline: none;
      background: var(--accent-gold-bg);
      color: var(--accent-gold-dark);
    }

    &[data-state='checked'] {
      color: var(--accent-gold-dark);
      font-weight: var(--font-medium);
    }

    &[data-disabled] {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  .select-field__indicator {
    flex: none;
    display: inline-flex;
    color: var(--accent-gold-dark);
  }

  /* ================================================================
   Reduced Motion — 无障碍退化
   ================================================================ */
  @media (prefers-reduced-motion: reduce) {
    .select-field__content[data-state='open'] .select-field__panel,
    .select-field__content[data-state='closed'] .select-field__panel {
      animation: none;
    }

    .select-field__icon {
      transition: none;
    }
  }
</style>
