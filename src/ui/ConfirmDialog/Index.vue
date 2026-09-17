<script setup>
  import {
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogOverlay,
    AlertDialogPortal,
    AlertDialogRoot,
    AlertDialogTitle,
  } from 'reka-ui';
  import Button from '@/ui/Button/Index.vue';

  /**
   * ConfirmDialog —— 二次确认弹窗（无业务耦合的基础 UI 组件）
   *
   * 用在「这一下点出去就收不回来了」的动作前面：先问一句，用户确认了再放行。
   * 底层是 reka-ui 的 AlertDialog —— 不是普通 Dialog：它默认不响应点击遮罩、
   * 语义是 role="alertdialog"、并且把焦点锁在弹窗里（键盘用户不会被漏到背景上）。
   *
   * 受控组件：开合完全由使用方拿（v-model:open），它自己不记状态。
   *
   * <b>确认按钮不自己关弹窗</b>：这枚没用 reka 的 AlertDialogAction ——
   * 它点一下必定把弹窗关掉（连 event.preventDefault() 都不看，见 DialogClose 的实现），
   * 而撤回 / 提交这类动作要等接口回来，中途收起弹窗会让 loading 白画一场。
   * 换成普通按钮 emit('confirm')，收不收、什么时候收，由使用方拿到结果之后决定。
   * 取消、Esc 照常：reka 关掉它，并同步 v-model:open。
   *
   * 结构契约（供测试与使用方布局引用）：
   *   .confirm-dialog__overlay     —— 遮罩
   *   .confirm-dialog__panel       —— 面板（--danger / --primary 修饰符跟 tone 走）
   *   .confirm-dialog__title       —— 标题（AlertDialogTitle）
   *   .confirm-dialog__description —— 一句话说明（默认插槽的内容落在它里面）
   *   .confirm-dialog__actions     —— 按钮行（取消 / 确认）
   */
  defineProps({
    /** v-model:open —— 开合状态（受控；不传就一直是关的） */
    open: { type: Boolean, default: false },
    /** 标题 —— 一句话说清「要确认什么」 */
    title: { type: String, default: '确认操作' },
    /** 说明 —— 讲清后果；也可用默认插槽塞更复杂的内容 */
    description: { type: String, default: '' },
    /** 确认按钮文案 */
    confirmText: { type: String, default: '确认' },
    /** 确认按钮在等结果时的文案（配合 loading） */
    loadingText: { type: String, default: '处理中…' },
    /** 取消按钮文案 */
    cancelText: { type: String, default: '取消' },
    /** 语气：danger = 危险动作（朱砂），primary = 普通确认（鎏金） */
    tone: {
      type: String,
      default: 'danger',
      validator: value => ['danger', 'primary'].includes(value),
    },
    /** 确认在飞 —— 两个按钮都禁用，文案换成 loadingText（防手快连点两下） */
    loading: { type: Boolean, default: false },
  });

  const emit = defineEmits(['update:open', 'confirm', 'cancel']);
</script>

<template>
  <AlertDialogRoot :open="open" @update:open="emit('update:open', $event)">
    <AlertDialogPortal>
      <AlertDialogOverlay class="confirm-dialog__overlay" />

      <AlertDialogContent
        class="confirm-dialog__panel"
        :class="`confirm-dialog__panel--${tone}`"
      >
        <AlertDialogTitle class="confirm-dialog__title">
          {{ title }}
        </AlertDialogTitle>

        <!-- 说明与默认插槽二选一：插槽给了就用插槽（能塞更细的内容，如一条记录的样子） -->
        <AlertDialogDescription
          class="confirm-dialog__description"
          :class="{ 'is-empty': !description && !$slots.default }"
        >
          <slot>{{ description }}</slot>
        </AlertDialogDescription>

        <div class="confirm-dialog__actions">
          <AlertDialogCancel as-child>
            <Button
              variant="ghost"
              class="confirm-dialog__cancel"
              :disabled="loading"
              @click="emit('cancel')"
            >
              {{ cancelText }}
            </Button>
          </AlertDialogCancel>

          <Button
            class="confirm-dialog__confirm"
            :disabled="loading"
            @click="emit('confirm')"
          >
            {{ loading ? loadingText : confirmText }}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>

<style scoped lang="less">
  /* ================================================================
     遮罩 —— 漆盒开启前的暗场（与 @/ui/Drawer 同一份材质）
     ================================================================ */
  .confirm-dialog__overlay {
    position: fixed;
    inset: 0;
    z-index: var(--z-modal-backdrop);
    background: var(--bg-overlay);

    &[data-state='open'] {
      animation: confirm-dialog-fade-in var(--duration-fast) var(--ease-enter)
        both;
    }

    &[data-state='closed'] {
      animation: confirm-dialog-fade-out var(--duration-fast) var(--ease-out)
        both;
    }
  }

  /* ================================================================
     面板 —— 漆盒：暖底光感 + 鎏金描边，从暗场里浮现
     ================================================================ */
  .confirm-dialog__panel {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: var(--z-modal);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    width: calc(100% - 2 * var(--content-padding));
    /* 与设计系统 §3.5 同宽：手机竖屏的窄栏，桌面端不摊开 */
    max-width: calc(var(--max-width) - var(--space-8));
    padding: var(--space-6);
    background: var(--card-lacquer-gradient), var(--bg-surface);
    border: var(--border-thin) solid var(--border);
    /* 顶上一道语气线 —— 与 @/ui/Drawer 的金线同笔法，这里换成语气的颜色 */
    border-top: var(--border-medium) solid var(--accent-red);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-xl);

    &[data-state='open'] {
      animation: confirm-dialog-in var(--duration-normal) var(--ease-enter) both;
    }

    &[data-state='closed'] {
      animation: confirm-dialog-out var(--duration-fast) var(--ease-out) both;
    }
  }

  /* 普通确认（非危险动作）走鎏金线 */
  .confirm-dialog__panel--primary {
    border-top-color: var(--accent-gold);
  }

  .confirm-dialog__title {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    line-height: var(--leading-tight);
    text-wrap: var(--text-wrap-heading);
    color: var(--text-primary);
  }

  .confirm-dialog__description {
    margin: 0;
    font-family: var(--font-body);
    font-size: var(--text-sm);
    line-height: var(--leading-relaxed);
    color: var(--text-secondary);
    word-break: break-word;

    /* 没给说明也没给插槽时不占位（不能用 :empty —— 模板里的换行会留成空白文本节点，
       元素看着是空的，:empty 也不认；由 is-empty 标记来认） */
    &.is-empty {
      display: none;
    }
  }

  /* ================================================================
     按钮行 —— 取消在左、确认在右（拇指落在右下角，与全站一致）
     ================================================================ */
  .confirm-dialog__actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-3);
    /* 与说明拉开一段（面板 gap 之上再补一点，两个按钮不贴着正文） */
    margin-top: var(--space-2);
  }

  .confirm-dialog__cancel {
    flex: none;
  }

  .confirm-dialog__confirm {
    flex: none;
    /* 危险动作换成朱砂底：@/ui/Button 只有 primary / ghost 两个变体，
       这里不改那个公共组件，就地覆盖底色 —— 选择器带上作用域属性，
       比 .btn--primary 那条规则更具体，能稳稳压住 */
    background: var(--accent-red);
  }

  /* 普通确认保持 @/ui/Button 的鎏金底，不动 */
  .confirm-dialog__panel--primary .confirm-dialog__confirm {
    background: var(--accent-gold-dark);
  }

  /* ================================================================
     入场 / 退场 —— 只动 transform + opacity
     ================================================================ */
  @keyframes confirm-dialog-in {
    from {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.96);
    }

    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }

  @keyframes confirm-dialog-out {
    from {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }

    to {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.98);
    }
  }

  @keyframes confirm-dialog-fade-in {
    from {
      opacity: 0;
    }

    to {
      opacity: 1;
    }
  }

  @keyframes confirm-dialog-fade-out {
    from {
      opacity: 1;
    }

    to {
      opacity: 0;
    }
  }

  /* ================================================================
     Reduced Motion — 无障碍退化
     ================================================================ */
  @media (prefers-reduced-motion: reduce) {
    .confirm-dialog__overlay,
    .confirm-dialog__panel {
      animation: none;
    }
  }
</style>
