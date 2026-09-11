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
   灵感：令牌 — 从上方落入的一条窄简，左缘色条标示类型

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

/* ---------------- 消息本体 ---------------- */
.message {
  --_accent: var(--text-secondary);

  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: var(--bg-surface);
  border: var(--border-thin) solid var(--border);
  /* 左缘色条 — 类型识别，如令牌的编绳 */
  border-left: var(--border-medium) solid var(--_accent);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  pointer-events: auto;

  &[data-state='open'] {
    animation: message-in var(--duration-fast) var(--ease-enter) both;
  }

  &[data-state='closed'] {
    animation: message-out var(--duration-fast) var(--ease-out) both;
  }
}

/* ---------------- 类型配色（info 沿用默认淡墨色） ---------------- */
.message--success {
  --_accent: var(--accent-green);
}

.message--error {
  --_accent: var(--accent-red);
}

.message--warning {
  --_accent: var(--accent-gold);
}

/* ---------------- 图标 ---------------- */
.message__icon {
  display: flex;
  flex-shrink: 0;
  width: 1.25em;
  height: 1.25em;
  color: var(--_accent);

  svg {
    display: block;
    width: 100%;
    height: 100%;
  }
}

/* ---------------- 文本 ---------------- */
.message__text {
  flex: 1;
  min-width: 0;
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
