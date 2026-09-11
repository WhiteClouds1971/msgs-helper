<script setup>
import { ToastProvider, ToastRoot, ToastViewport, ToastDescription } from 'reka-ui'
import { messageQueue, removeMessage } from '@/composables/useMessage'
import msgSuccess from '@/assets/icons/msg-success.svg?raw'
import msgError from '@/assets/icons/msg-error.svg?raw'
import msgWarning from '@/assets/icons/msg-warning.svg?raw'
import msgInfo from '@/assets/icons/msg-info.svg?raw'

/** 退场动画时长（ms）— Toast 关闭后延迟移除，让淡出播完 */
const EXIT_DURATION = 200

/** 类型 → 图标（颜色由 currentColor 继承自 .message__icon） */
const ICONS = {
  success: msgSuccess,
  error: msgError,
  warning: msgWarning,
  info: msgInfo,
}

/** Toast 关闭（超时 / 上滑 / Esc）→ 延迟移出队列 */
function onOpenChange(id, open) {
  if (open) return
  setTimeout(() => removeMessage(id), EXIT_DURATION)
}
</script>

<template>
  <ToastProvider swipe-direction="up">
    <ToastRoot
      v-for="msg in messageQueue"
      :key="msg.id"
      :open="msg.open"
      :duration="msg.duration"
      class="message"
      :class="'message--' + msg.type"
      @update:open="onOpenChange(msg.id, $event)"
    >
      <span
        class="message__icon"
        v-html="ICONS[msg.type]"
      />
      <ToastDescription class="message__text">
        {{ msg.content }}
      </ToastDescription>
    </ToastRoot>

    <ToastViewport class="message-viewport" />
  </ToastProvider>
</template>

<style lang="less">
/* ================================================================
   Message — 全局轻提示（reka-ui Toast 封装）
   形态：令牌 — 漆面窄简自上方落入，鎏金左线压边，
        类型色记号居首，铭文以毛笔体书写
   取材：DESIGN_SYSTEM 的漆器 / 鎏金线两则母题

   注意：不用 scoped —— reka 的 Toast 会把 DOM 传送到 Viewport（ol），
   该元素拿不到 SFC 的 data-v 作用域属性，scoped 规则不会命中。
   类名统一以 message- 前缀命名，避免全局污染。
   ================================================================ */

/* ---------------- Viewport：顶部居中的浮层容器 ---------------- */
.message-viewport {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  max-width: var(--max-width);
  padding: calc(var(--safe-area-top) + var(--space-4)) var(--content-padding) 0;
  /* 容器本身不拦截交互，仅消息本体可点、可上滑关闭 */
  pointer-events: none;
}

/* ---------------- 令牌本体 ---------------- */
.message {
  --_accent: var(--text-secondary);

  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-3) var(--space-4);
  /* 漆面光感 — 与 Drawer、Card 同一材质；鎏金左线用背景绘制而非 border：
     border 在圆角处与 1px 邻边做斜接，会出现台阶断层，背景则被圆角平滑裁切 */
  background:
    linear-gradient(var(--accent-gold), var(--accent-gold)) left /
      var(--border-medium) 100% no-repeat,
    var(--card-lacquer-gradient),
    var(--bg-surface);
  border: var(--border-thin) solid var(--border);
  /* 左边不留 border，金线直接顶到外缘 */
  border-left: 0;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  color: var(--text-primary);
  font-size: var(--text-base);
  pointer-events: auto;

  &[data-state='open'] {
    animation: message-in var(--duration-fast) var(--ease-enter) both;
  }

  &[data-state='closed'] {
    animation: message-out var(--duration-fast) var(--ease-out) both;
  }
}

/* ---------------- 状态配色（info 沿用淡墨） ---------------- */
.message--success {
  --_accent: var(--accent-green);
}

.message--error {
  --_accent: var(--accent-red);
}

.message--warning {
  /* 深金而非亮金：Light 模式亮金仅 3.0:1，不足以承载图形记号 */
  --_accent: var(--accent-gold-dark);
}

/* ---------------- 简首记号：只留类型色字形 ---------------- */
.message__icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 1.2em;
  height: 1.2em;
  color: var(--_accent);

  svg {
    display: block;
    width: 100%;
    height: 100%;
  }
}

/* ---------------- 铭文：毛笔体 ---------------- */
.message__text {
  flex: 1;
  min-width: 0;
  font-family: var(--font-display);
  font-size: var(--text-lg);
  line-height: var(--leading-normal);
  color: var(--text-primary);
  word-break: break-word;
}

/* ---------------- 入场 / 退场 ---------------- */
@keyframes message-in {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes message-out {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-8px);
  }
}

/* ---------------- Reduced Motion ---------------- */
@media (prefers-reduced-motion: reduce) {
  .message {
    animation: none;
  }
}
</style>
