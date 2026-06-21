<script setup>
import {
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipPortal,
  TooltipContent,
  TooltipArrow,
} from 'reka-ui'

defineProps({
  /** 提示文本（简单场景直接传字符串） */
  content: { type: String, default: '' },
  /** 弹出方向 */
  side: {
    type: String,
    default: 'top',
    validator: v => ['top', 'bottom', 'left', 'right'].includes(v),
  },
  /** 对齐方式 */
  align: {
    type: String,
    default: 'center',
    validator: v => ['start', 'center', 'end'].includes(v),
  },
  /** 距触发元素的偏移量（px） */
  sideOffset: { type: Number, default: 5 },
  /** 打开延迟（ms），0 为即时打开 */
  delayDuration: { type: Number, default: 300 },
  /** 是否禁用 */
  disabled: { type: Boolean, default: false },
  /** 是否显示箭头 */
  arrow: { type: Boolean, default: true },
  /** 受控：开合状态 */
  open: { type: Boolean, default: undefined },
  /** 非受控：默认开合 */
  defaultOpen: { type: Boolean, default: false },
})

defineEmits(['update:open'])

defineSlots()
</script>

<template>
  <TooltipProvider :delay-duration="delayDuration">
    <TooltipRoot
      :open="open"
      :default-open="defaultOpen"
      :delay-duration="delayDuration"
      :disabled="disabled"
      @update:open="$emit('update:open', $event)"
    >
      <!-- Trigger 插槽 — as-child 模式，直接包裹触发元素 -->
      <TooltipTrigger
        as-child
        class="tooltip-trigger"
      >
        <slot />
      </TooltipTrigger>

      <TooltipPortal>
        <TooltipContent
          :side="side"
          :align="align"
          :side-offset="sideOffset"
          :avoid-collisions="true"
          class="tooltip-content"
        >
          <!-- 自定义内容插槽 > content prop 文本 -->
          <slot name="content">
            {{ content }}
          </slot>

          <!-- 箭头 — 指向触发元素，自动继承 content 背景色 -->
          <TooltipArrow
            v-if="arrow"
            :width="8"
            :height="4"
            class="tooltip-arrow"
          />
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>

<style scoped lang="less">
/* ================================================================
   Tooltip Content — 竹简注记（:deep 穿透 reka-ui 子组件 + Teleport）
   灵感：竹简上的简短批注，克制小巧，漆器鎏金顶部描边
   ================================================================ */
:deep(.tooltip-content) {
  /* --- 竹简底色 --- */
  background: var(--bg-surface);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-md);
  z-index: var(--z-tooltip);
  max-width: 240px;
  word-break: break-word;

  /* 动效原点 — 用于 scale 动画，由 reka-ui CSS 变量计算 */
  transform-origin: var(--reka-tooltip-content-transform-origin);

  /* 方向感知入场动画 */
  &[data-state='delayed-open'],
  &[data-state='instant-open'] {
    animation: tooltip-in var(--duration-fast) var(--ease-enter) both;
  }

  &[data-state='closed'] {
    animation: tooltip-out var(--duration-fast) var(--ease-out) both;
    pointer-events: none;
  }

  &[data-side='top']    { animation-name: tooltip-in-top; }
  &[data-side='bottom'] { animation-name: tooltip-in-bottom; }
  &[data-side='left']   { animation-name: tooltip-in-left; }
  &[data-side='right']  { animation-name: tooltip-in-right; }
}

/* --- 入场：从不同方向滑入 + 淡入 --- */
@keyframes tooltip-in-top {
  from { opacity: 0; transform: translateY(4px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes tooltip-in-bottom {
  from { opacity: 0; transform: translateY(-4px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes tooltip-in-left {
  from { opacity: 0; transform: translateX(4px) scale(0.96); }
  to   { opacity: 1; transform: translateX(0) scale(1); }
}

@keyframes tooltip-in-right {
  from { opacity: 0; transform: translateX(-4px) scale(0.96); }
  to   { opacity: 1; transform: translateX(0) scale(1); }
}

@keyframes tooltip-out {
  from { opacity: 1; transform: scale(1); }
  to   { opacity: 0; transform: scale(0.96); }
}

/* ================================================================
   Tooltip Arrow
   ================================================================ */
:deep(.tooltip-arrow) {
  fill: var(--bg-surface);
}

/* ================================================================
   Reduced Motion — 无障碍退化
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  :deep(.tooltip-content) {
    &[data-state='delayed-open'],
    &[data-state='instant-open'],
    &[data-state='closed'] {
      animation: none;
    }
  }
}
</style>
