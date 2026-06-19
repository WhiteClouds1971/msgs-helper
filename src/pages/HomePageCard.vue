<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  menu: { type: Object, required: true },
  isFront: { type: Boolean, default: false },
  offset: { type: Number, default: 0 },
  isRotating: { type: Boolean, default: false },
  style: { type: Object, default: () => ({}) },
})

defineEmits(['click'])

const imageState = ref('loading')

/** 首屏前 2 张卡片使用 eager，其余延迟加载 */
const imgLoading = computed(() => (props.offset < 2 ? undefined : 'lazy'))

// Eagerly import all menu images so Vite can hash them in production
const imageModules = import.meta.glob('@/assets/images/menus/*.{gif,png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
})

const imageUrl = computed(() => {
  const src = props.menu.image.src
  if (!src) return ''
  const filename = src.replace(/\\/g, '/').split('/').pop()
  // Match by filename across all glob-imported images
  for (const [path, url] of Object.entries(imageModules)) {
    if (path.endsWith('/' + filename) || path.endsWith(filename)) {
      return url
    }
  }
  return ''
})

function onImageLoad() {
  imageState.value = 'loaded'
}

function onImageError() {
  imageState.value = 'error'
}
</script>

<template>
  <div
    class="home-card"
    :class="{ 'home-card--front': isFront, rotating: isRotating }"
    :style="style"
    @click="$emit('click')"
  >
    <!-- 图片区域 -->
    <div class="home-card__image">
      <!-- 占位色块（始终在底层） -->
      <div
        class="home-card__placeholder"
        :style="{ backgroundColor: menu.themeColor + '1A' }"
      >
        <span class="home-card__placeholder-text">{{ menu.name }}</span>
      </div>

      <!-- 图片（加载成功后覆盖在占位色块上层） -->
      <img
        v-show="imageState === 'loaded'"
        :src="imageUrl"
        :alt="menu.name"
        class="home-card__img"
        :loading="imgLoading"
        decoding="async"
        :style="{
          objectPosition: `${menu.image.focalX}% ${menu.image.focalY}%`,
        }"
        @load="onImageLoad"
        @error="onImageError"
      />

      <!-- 加载失败提示 -->
      <div v-if="imageState === 'error'" class="home-card__error-overlay">
        <span>图片加载失败</span>
      </div>
    </div>

    <!-- 诏书标签 -->
    <div class="home-card__label">
      <div class="edict-label">
        <span class="seal-stamp">谕</span>
        <span class="edict-package">{{ menu.packageName }}</span>
        <span class="edict-sep">·</span>
        <span
          class="edict-title"
          :style="{ color: menu.themeColor }"
        >{{ menu.name }}</span>
        <span class="seal-stamp">旨</span>
      </div>
      <div
        class="decorative-line--knotted"
        :style="{ '--line-color': menu.themeColor }"
      ></div>
    </div>
  </div>
</template>

<style scoped lang="less">
.home-card {
  position: absolute;
  top: 0;
  left: 0;
  width: calc(100vw - var(--space-8) * 2);
  aspect-ratio: 3 / 2;
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  cursor: pointer;
  transition:
    transform var(--duration-slow) var(--ease-enter),
    box-shadow var(--duration-slow) var(--ease-enter);

  &--front {
    box-shadow: var(--shadow-glow-gold), var(--shadow-lg);
    /* 性能提示：提示浏览器该卡片即将参与动画（滑动/旋转） */
    will-change: transform;
  }

  &.rotating {
    animation: rotate-hint 0.5s var(--ease-enter) forwards;
  }
}

@keyframes rotate-hint {
  0% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(90deg);
  }
  100% {
    transform: rotate(90deg) scale(1.5);
  }
}

/* --- 图片区 --- */
.home-card__image {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
}

.home-card__placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.home-card__placeholder-text {
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: var(--text-xl);
  opacity: 0.6;
}

.home-card__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.home-card__error-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  color: var(--text-inverse);
  font-size: var(--text-sm);
}

/* --- 诏书标签 --- */
.home-card__label {
  padding: var(--space-3) var(--space-4) var(--space-4);
}

.edict-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.edict-package {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.edict-sep {
  color: var(--accent-gold-light);
  font-size: var(--text-sm);
}

.edict-title {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* --- 装饰线（竹简编绳节点） --- */
.decorative-line--knotted {
  position: relative;
  height: var(--border-medium);
  background: var(--line-color, var(--decorative-line));
  border: none;
  margin-top: var(--space-2);

  &::before {
    content: '◆';
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    font-size: 6px;
    color: var(--line-color, var(--accent-gold));
    line-height: 1;
  }
}

/* --- 无障碍 --- */
@media (prefers-reduced-motion: reduce) {
  .home-card {
    transition: none;
  }
}
</style>
