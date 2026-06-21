<script setup>
import { ref, computed, onUnmounted } from 'vue'

const props = defineProps({
  /** 菜单名称（可选，不传则仅显示图标） */
  name: { type: String, default: '' },
  /** 图标文件名（src/assets/icons/ 下的文件名，不含扩展名），如 'yin_zhang' */
  icon: { type: String, required: true },
  /** 主题色（用于动画辉光），默认金色 */
  themeColor: { type: String, default: '' },
})

const emit = defineEmits(['click', 'longpress'])

// ═══════════════════════════════════════════════════════════════════
// 图标解析 — 从 icons 目录按文件名匹配
// ═══════════════════════════════════════════════════════════════════
const iconModules = import.meta.glob('@/assets/icons/*.svg', {
  eager: true,
  query: '?raw',
  import: 'default',
})

const iconRaw = computed(() => {
  const target = `${props.icon}.svg`
  for (const [path, raw] of Object.entries(iconModules)) {
    if (path.endsWith(target)) return raw
  }
  return ''
})

// ═══════════════════════════════════════════════════════════════════
// 按压状态机：idle → pressing → longpress
// ═══════════════════════════════════════════════════════════════════
const LONGPRESS_MS = 500

const phase = ref('idle') // idle | pressing | longpress
let pressTimer = null
let isCancelled = false

function clearTimer() {
  if (pressTimer) {
    clearTimeout(pressTimer)
    pressTimer = null
  }
}

function onPressStart() {
  isCancelled = false
  phase.value = 'pressing'

  pressTimer = setTimeout(() => {
    if (isCancelled) return
    phase.value = 'longpress'
    emit('longpress')
  }, LONGPRESS_MS)
}

function onPressEnd() {
  if (phase.value === 'longpress') {
    // 长按释放：直接回到 idle
    phase.value = 'idle'
  } else if (phase.value === 'pressing') {
    // 短按：fire click 后回 idle
    emit('click')
    phase.value = 'idle'
  }
  clearTimer()
}

function onPressCancel() {
  isCancelled = true
  phase.value = 'idle'
  clearTimer()
}

onUnmounted(() => clearTimer())
</script>

<template>
  <button
    class="menu-icon"
    :class="{
      'menu-icon--pressing': phase === 'pressing',
      'menu-icon--longpress': phase === 'longpress',
    }"
    :style="{
      '--accent': themeColor || undefined,
    }"
    @mousedown="onPressStart"
    @mouseup="onPressEnd"
    @mouseleave="onPressCancel"
    @touchstart.prevent="onPressStart"
    @touchend="onPressEnd"
    @touchcancel="onPressCancel"
  >
    <!-- 图标容器（SVG + 文字一体化） -->
    <span class="menu-icon__icon">
      <!-- 长按涟漪 -->
      <span
        v-if="phase === 'longpress'"
        class="menu-icon__ripple"
      />
      <span
        class="menu-icon__icon-inner"
        v-html="iconRaw"
      />

      <!-- 菜单名称（可选） -->
      <span
        v-if="name"
        class="menu-icon__name"
      >{{ name }}</span>
    </span>
  </button>
</template>

<style scoped lang="less">
/* ================================================================
   MenuIcon — 菜单图标按钮
   按压反馈：短按 pulse + 辉光 / 长按涟漪扩散 + 深压
   ================================================================ */

.menu-icon {
  --_accent: var(--accent, var(--accent-gold));

  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border: none;
  background: none;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;

  /* 基准态过渡 — 回弹用 ease-out 模拟物理沉降 */
  transition:
    transform 200ms var(--ease-out),
    filter 200ms var(--ease-out);
}

/* ================================================================
   Icon 容器 — 填满按钮空间，cell padding 由控制台统一管理
   ================================================================ */
.menu-icon__icon {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  height: 100%;
  isolation: isolate;
  transition: transform 250ms var(--ease-out);
}

/* ================================================================
   Icon 内层 — SVG 渲染，尺寸自适应容器
   ================================================================ */
.menu-icon__icon-inner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80%;
  aspect-ratio: 1;
  color: var(--text-secondary);
  transition:
    color 250ms var(--ease-out),
    transform 250ms var(--ease-out);

  :deep(svg) {
    width: 100%;
    height: 100%;
  }
}

/* ================================================================
   长按涟漪 — 从图标中心向外扩散的金色波纹
   ================================================================ */
.menu-icon__ripple {
  position: absolute;
  inset: -4px;
  border-radius: inherit;
  background: radial-gradient(
    circle at center,
    color-mix(in srgb, var(--_accent) 18%, transparent) 0%,
    transparent 70%
  );
  animation: menu-ripple-in 500ms var(--ease-ink) both;
  pointer-events: none;
}

@keyframes menu-ripple-in {
  from {
    opacity: 0;
    transform: scale(0.6);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* ================================================================
   菜单名称
   ================================================================ */
.menu-icon__name {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  color: var(--text-secondary);
  line-height: var(--leading-tight);
  text-align: center;
  white-space: nowrap;
  transition: color 250ms var(--ease-out);
}

/* ================================================================
   Phase: pressing — 短按压
   缩至 95% + 金色微辉光
   ================================================================ */
.menu-icon--pressing {
  transform: scale(0.95);

  .menu-icon__icon {
    transform: scale(0.93);
  }

  .menu-icon__icon-inner {
    color: var(--_accent);
    filter: drop-shadow(0 0 6px color-mix(in srgb, var(--_accent) 30%, transparent));
  }
}

/* ================================================================
   Phase: longpress — 长按
   更深的压缩 + 强辉光 + 名称变色
   ================================================================ */
.menu-icon--longpress {
  transform: scale(0.9);

  .menu-icon__icon {
    transform: scale(0.88);
  }

  .menu-icon__icon-inner {
    color: var(--_accent);
    transform: scale(1.08);
    filter: drop-shadow(0 0 12px color-mix(in srgb, var(--_accent) 35%, transparent));
  }

  .menu-icon__name {
    color: var(--text-primary);
  }
}

/* ================================================================
   Reduced Motion
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .menu-icon {
    transition: none;
  }

  .menu-icon__icon,
  .menu-icon__icon-inner {
    transition: none;
  }

  .menu-icon__ripple {
    animation: none;
    opacity: 0.4;
    transform: scale(1);
  }
}
</style>
