<script setup>
import {
  DrawerRoot,
  DrawerPortal,
  DrawerOverlay,
  DrawerContent,
  DrawerHandle,
  DrawerTitle,
  DrawerDescription,
} from 'reka-ui'

defineProps({
  /** v-model:open — 抽屉开合状态 */
  open: { type: Boolean, default: undefined },
  /** 默认开合状态（非受控） */
  defaultOpen: { type: Boolean, default: false },
  /** 弹窗模式：true=模态 | 'trap-focus'=仅焦点锁定 | false=非模态 */
  modal: { type: [Boolean, String], default: true },
  /** 标题（可选，传入则渲染 DrawerTitle） */
  title: { type: String, default: '' },
  /** 描述（可选） */
  description: { type: String, default: '' },
  /** 是否显示拖拽手柄 */
  showHandle: { type: Boolean, default: true },
  /** 是否显示遮罩层 */
  showOverlay: { type: Boolean, default: true },
  /** 强制挂载（用于动画控制） */
  forceMount: { type: Boolean, default: false },
  /** 滑动关闭方向 */
  swipeDirection: {
    type: String,
    default: 'down',
    validator: v => ['up', 'down', 'left', 'right'].includes(v),
  },
  /** 最小高度（CSS 值），抽屉至少为此高度 */
  minHeight: { type: String, default: '' },
  /** 最大高度（CSS 值），默认 85dvh */
  maxHeight: { type: String, default: '85dvh' },
  /** 固定高度（CSS 值），设置后抽屉不再自适应内容 */
  height: { type: String, default: '' },
})

defineEmits(['update:open', 'update:openComplete'])

defineSlots()
</script>

<template>
  <DrawerRoot
    :open="open"
    :default-open="defaultOpen"
    :modal="modal"
    :swipe-direction="swipeDirection"
    @update:open="$emit('update:open', $event)"
    @update:open-complete="$emit('update:openComplete', $event)"
  >
    <!-- Trigger 插槽 — 放置触发按钮 -->
    <slot name="trigger" />

    <DrawerPortal>
      <!-- 遮罩层 -->
      <DrawerOverlay
        v-if="showOverlay"
        :force-mount="forceMount"
        class="drawer-overlay"
      />

      <!-- 抽屉内容面板 -->
      <DrawerContent
        :force-mount="forceMount"
        class="drawer-content"
        :style="{
          '--drawer-max-height': maxHeight,
          minHeight: minHeight || undefined,
          height: height || undefined,
        }"
      >
        <!-- 拖拽手柄 -->
        <DrawerHandle
          v-if="showHandle"
          class="drawer-handle"
        />

        <!-- 标题区 -->
        <div
          v-if="title || $slots.header"
          class="drawer-header"
        >
          <DrawerTitle
            v-if="title"
            class="drawer-title"
          >
            {{ title }}
          </DrawerTitle>
          <DrawerDescription
            v-if="description"
            class="drawer-description"
          >
            {{ description }}
          </DrawerDescription>
          <slot name="header" />
        </div>

        <!-- 内容区（可滚动） -->
        <div class="drawer-body">
          <slot />
        </div>

        <!-- 底部操作区 -->
        <div
          v-if="$slots.footer"
          class="drawer-footer"
        >
          <slot name="footer" />
        </div>
      </DrawerContent>
    </DrawerPortal>
  </DrawerRoot>
</template>

<style scoped lang="less">
/* ================================================================
   Drawer Overlay — 漆盒开启时的暗色遮罩
   灵感：漆器开盒时从暗处浮现亮面
   ================================================================ */
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg-overlay);
  z-index: var(--z-modal-backdrop);

  &[data-state='open'] {
    animation: drawer-overlay-in var(--duration-slow) var(--ease-enter) both;
  }

  &[data-state='closed'] {
    animation: drawer-overlay-out var(--duration-normal) var(--ease-enter) both;
  }
}

@keyframes drawer-overlay-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes drawer-overlay-out {
  from { opacity: 1; }
  to   { opacity: 0; }
}

/* ================================================================
   Drawer Content — 漆盒面板
   灵感：漆器盒面 — 亮面暖底、金色描边、圆润光泽
   ================================================================ */
.drawer-content {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: var(--max-width);
  max-height: var(--drawer-max-height, 85dvh);
  display: flex;
  flex-direction: column;
  background:
    var(--card-lacquer-gradient),
    var(--bg-surface);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  box-shadow: var(--shadow-xl);
  z-index: var(--z-modal);
  /* 金色顶部描边 — 漆盒开盖处的鎏金线 */
  border-top: var(--border-medium) solid var(--accent-gold);
  /* 防止背景滚动穿透 */
  overscroll-behavior: contain;
  touch-action: manipulation;
  /* 底部安全区域 */
  padding-bottom: var(--safe-area-bottom);

  &[data-state='open'] {
    animation: drawer-content-in var(--duration-slow) var(--ease-enter) both;
  }

  &[data-state='closed'] {
    animation: drawer-content-out var(--duration-normal) var(--ease-enter) both;
  }
}

@keyframes drawer-content-in {
  from {
    transform: translateX(-50%) translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

@keyframes drawer-content-out {
  from {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
  to {
    transform: translateX(-50%) translateY(100%);
    opacity: 0;
  }
}

/* ================================================================
   Drawer Handle — 拖拽手柄
   灵感：漆盒的铜质拉环
   ================================================================ */
.drawer-handle {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: var(--border);
  margin: var(--space-3) auto var(--space-2);
  flex-shrink: 0;

  /* 微交互：hover 时泛金 */
  transition: background-color var(--duration-fast) var(--ease-out);

  :deep([data-swiping]) & {
    background: var(--accent-gold);
  }
}

/* ================================================================
   Drawer Header — 标题区
   ================================================================ */
.drawer-header {
  padding: 0 var(--space-4) var(--space-3);
  flex-shrink: 0;
}

.drawer-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  color: var(--text-primary);
  line-height: var(--leading-tight);
  text-wrap: var(--text-wrap-heading);
}

.drawer-description {
  margin: var(--space-1) 0 0;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-normal);
}

/* ================================================================
   Drawer Body — 可滚动内容区
   ================================================================ */
.drawer-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 var(--space-4);
  /* 滚动触底/触顶时不传播到背景 */
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

/* ================================================================
   Drawer Footer — 底部操作区
   ================================================================ */
.drawer-footer {
  flex-shrink: 0;
  padding: var(--space-4);
  /* 与内容区的分割线 */
  border-top: var(--border-thin) solid var(--border-light);
  margin-top: var(--space-2);
}

/* ================================================================
   Reduced Motion — 无障碍退化
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .drawer-overlay,
  .drawer-content {
    animation: none;
  }
}
</style>
