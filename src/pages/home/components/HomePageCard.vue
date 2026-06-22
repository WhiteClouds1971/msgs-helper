<script setup>
import { ref, computed } from 'vue'
import SplashScreen from '@/ui/SplashScreen/Index.vue'

const props = defineProps({
  menu: { type: Object, required: true },
  isFront: { type: Boolean, default: false },
  offset: { type: Number, default: 0 },
  style: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['click', 'image-resolved'])

const imageState = ref('loading')

/** ±5 范围内全部 eager 预加载 */
const imgLoading = computed(() => (Math.abs(props.offset) <= 5 ? undefined : 'lazy'))

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
  for (const [path, url] of Object.entries(imageModules)) {
    if (path.endsWith('/' + filename) || path.endsWith(filename)) {
      return url
    }
  }
  return ''
})

function onImageLoad() {
  imageState.value = 'loaded'
  emit('image-resolved')
}

function onImageError() {
  imageState.value = 'error'
  emit('image-resolved')
}
</script>

<template>
  <div
    class="home-card"
    :class="{ 'home-card--front': isFront }"
    :style="style"
    @click="$emit('click')"
  >
    <!-- 图片区域 -->
    <div class="home-card__image">
      <!-- 加载态：占位背景色跟随卡片主题色 -->
      <div
        v-show="imageState !== 'loaded'"
        class="home-card__placeholder"
        :style="{ backgroundColor: menu.themeColor + '18' }"
      >
        <SplashScreen
          :size="48"
          :show-line="true"
          subtitle="受命于天 既寿永昌"
        />
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
      >

      <!-- 加载失败提示 -->
      <div
        v-if="imageState === 'error'"
        class="home-card__error-overlay"
      >
        <span>图片加载失败</span>
      </div>
    </div>

    <!-- 诏书标签 -->
    <div class="home-card__label">
      <div class="edict-label">
        <span class="seal-stamp">签</span>
        <span class="edict-center">
          <span class="edict-package">{{ menu.packageName }}</span>
          <span class="edict-sep">·</span>
          <span
            class="edict-title"
            :style="{ color: menu.themeColor }"
          >{{ menu.name }}</span>
        </span>
        <span class="seal-stamp">题</span>
      </div>
      <div
        class="decorative-line--knotted"
        :style="{ '--line-color': menu.themeColor }"
      />
    </div>
  </div>
</template>

<style scoped lang="less">
.home-card {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  /*
    两段式动画：
      ① 切换瞬间：全部卡片统一弱化为背景（0ms，card-stack--resetting 切断过渡）
      ② 淡入阶段：前置卡片从背景态渐显（300ms），背景卡片保持弱化
  */
  transition:
    transform 80ms var(--ease-out),
    box-shadow 150ms var(--ease-in-out),
    opacity 150ms var(--ease-in-out),
    filter 150ms var(--ease-in-out);

  &--front {
    /* 四周包围式立体阴影 — 五层零偏移同心扩散，模拟卡片悬浮半空
       自内而外：轮廓锁边 → 近距辉光 → 中距抬离 → 远距悬浮 → 环境气氛
       Light 模式用暖棕 rgba(120,100,80,x)，Dark 模式用纯黑 rgba(0,0,0,x) */
    box-shadow:
      0 0 2px rgba(120, 100, 80, 0.18),    /* L1：紧贴轮廓，锁死边缘 */
      0 0 10px rgba(120, 100, 80, 0.12),   /* L2：内圈辉光，初步抬离 */
      0 0 28px rgba(120, 100, 80, 0.08),   /* L3：中圈扩散，拉开层级 */
      0 0 56px rgba(120, 100, 80, 0.05),   /* L4：外圈悬浮，纵深感 */
      0 0 96px rgba(120, 100, 80, 0.03),   /* L5：环境光晕，融入背景 */
      var(--shadow-glow-gold);              /* 金辉描边 */
    will-change: transform;
  }

  /* 非前置卡片：裁切 blur 滤镜向外扩散的边溢，避免在前置卡片四周漏出虚边 */
  &:not(&--front) {
    clip-path: inset(0);
  }

}

/* --- 图片区 --- */
.home-card__image {
  position: relative;
  width: 100%;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.home-card__placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* SplashScreen 自带所有视觉，placeholder 仅做居中容器 */

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
  flex-shrink: 0;
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

.edict-center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  gap: 2px;
}

.edict-title {
  font-family: var(--font-display);
  font-size: var(--text-lg);
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

/* --- 暗色模式：前置卡片四周阴影改为纯黑基调 --- */
[data-theme="dark"] .home-card--front {
  box-shadow:
    0 0 2px rgba(0, 0, 0, 0.35),
    0 0 10px rgba(0, 0, 0, 0.25),
    0 0 28px rgba(0, 0, 0, 0.18),
    0 0 56px rgba(0, 0, 0, 0.10),
    0 0 96px rgba(0, 0, 0, 0.05),
    var(--shadow-glow-gold);
}

/* --- 无障碍 --- */
@media (prefers-reduced-motion: reduce) {
  .home-card {
    transition: none;
  }
}
</style>
