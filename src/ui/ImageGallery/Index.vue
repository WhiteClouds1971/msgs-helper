<script setup>
import { computed, ref, watch } from 'vue'

/**
 * ImageGallery —— 多图展示（无业务耦合的基础 UI 组件）
 *
 * 排布只有一条规则：逐张铺满容器宽度、纵向排列；一屏放不下就纵向滚动。
 * 图片只做等比缩放（宽度铺满、高度随自身比例），永不裁切、永不拉伸；
 * 一屏放得下时整组居中 —— 用 `margin: auto` 居中，内容溢出时不像
 * `justify-content: center` 那样把顶部裁掉。
 *
 * 尺寸全部交给 CSS（width: 100% + height: auto）：没有脚本测量、没有容器监听，
 * 图片加载前后也不会跳版。
 */
const props = defineProps({
  /** [{ src, alt? }]，也接受纯 src 字符串数组 */
  images: { type: Array, default: () => [] },
  /** 图间距（CSS 长度，可直接用 token） */
  gap: { type: String, default: 'var(--space-2)' },
})

const normalized = computed(() =>
  props.images.map(raw => (typeof raw === 'string' ? { src: raw } : raw || {})),
)

/** 加载失败的图（下标 = 图片序号），失败处留下占位文案 */
const failed = ref([])

function onError(index) {
  const next = failed.value.slice()
  next[index] = true
  failed.value = next
}

watch(
  () => props.images,
  () => {
    failed.value = []
  },
)
</script>

<template>
  <div class="gallery">
    <div
      class="gallery__stack"
      :style="{ gap }"
    >
      <figure
        v-for="(image, index) in normalized"
        :key="index"
        class="gallery__item"
      >
        <img
          class="gallery__img"
          :src="image.src"
          :alt="image.alt || ''"
          decoding="async"
          @error="onError(index)"
        >

        <div
          v-if="failed[index]"
          class="gallery__error"
        >
          图片加载失败
        </div>
      </figure>
    </div>
  </div>
</template>

<style scoped lang="less">
/* 容器即滚动视口：内容超出一屏时纵向滚动，放得下则不滚且居中 */
.gallery {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  /* 隐藏滚动条但保留滚动：触控滑动不需要滚动条，
     桌面端 overlay 滚动条也会在滑动时闪出，破坏整屏图片的观感 */
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.gallery::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

/* 图组：占满容器宽度；margin: auto 纵向居中 —— 放得下时居中，放不下时归零不裁上边 */
.gallery__stack {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  margin: auto;
}

.gallery__item {
  position: relative;
  margin: 0;
}

/* 宽度铺满容器，高度随自身比例 —— 等比缩放，永不裁切、永不拉伸 */
.gallery__img {
  display: block;
  width: 100%;
  height: auto;
}

.gallery__error {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-surface-hover);
  color: var(--text-tertiary);
  font-size: var(--text-xs);
}
</style>
