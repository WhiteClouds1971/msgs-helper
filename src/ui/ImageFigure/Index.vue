<script setup>
import { computed, ref, useSlots, watch } from 'vue'

/**
 * ImageFigure —— 单张图片展示（无业务耦合的基础 UI 组件）
 *
 * 一张图 = 一个 <figure>：图片铺满容器宽度、等比缩放（永不裁切、永不拉伸），
 * 图下可以跟一段「说明」—— 说明区域用 <figcaption>，只靠间距与图片分开。
 *
 * 只管一张图，不管一组图：多张图怎么排、间距多大、谁跟谁一组，全由使用方在自己的
 * 页面里组织（叠几个 <ImageFigure> 即可）。组件不自建滚动容器、不画列表，
 * 滚动与居中一律交给页面 —— 否则每个图各成一个滚动区，同页多图会互相打架。
 *
 * 说明区域两种喂法，二选一：
 *   · caption  —— 直接给一段纯文本（简单场景）
 *   · 默认插槽 —— 塞任意内容（如 <MdViewer> 的规则正文），给了插槽就以插槽为准
 * 两者都不给就不渲染说明区域 —— 说明是可选的。
 *
 * 尺寸全部交给 CSS（width: 100% + height: auto）：没有脚本测量、没有容器监听，
 * 图片加载前后不跳版。
 */
const props = defineProps({
  /** 图片地址 */
  src: { type: String, required: true },
  /** 替代文本：读屏用，也是这张图「是什么」的唯一文字说明 */
  alt: { type: String, default: '' },
  /** 说明文字（纯文本）；要放正文块请改用默认插槽 */
  caption: { type: String, default: '' },
})

const slots = useSlots()

/** 说明区域：有插槽或非空 caption 才渲染，否则图下不留空位 */
const hasCaption = computed(() => Boolean(slots.default) || props.caption.trim() !== '')

/** 加载失败：撤下 <img>，原地留一块占位，省得页面上挂个破图标 */
const failed = ref(false)

// 换图即复位失败态 —— 否则换了新地址仍是占位块
watch(
  () => props.src,
  () => {
    failed.value = false
  },
)
</script>

<template>
  <figure class="image-figure">
    <img
      v-if="!failed"
      class="image-figure__img"
      :src="src"
      :alt="alt"
      decoding="async"
      @error="failed = true"
    >

    <p
      v-else
      class="image-figure__broken"
    >
      图片加载失败
    </p>

    <figcaption
      v-if="hasCaption"
      class="image-figure__caption"
    >
      <slot>{{ caption }}</slot>
    </figcaption>
  </figure>
</template>

<style scoped lang="less">
/* 图与说明自成一块：外边距留给使用方（排布与间距是页面的事） */
.image-figure {
  margin: 0;
}

/* 宽度铺满容器，高度随自身比例 —— 等比缩放，永不裁切、永不拉伸 */
.image-figure__img {
  display: block;
  width: 100%;
  height: auto;
}

/* 加载失败：图片撤下后原地留一块占位，版式不塌 */
.image-figure__broken {
  padding: var(--space-8) var(--space-4);
  background: var(--bg-surface-hover);
  color: var(--text-tertiary);
  font-size: var(--text-sm);
  text-align: center;
}

/* 说明区域：只与图隔开一段间距，不加任何装饰线 —— 说明是注脚，
   靠字号与次要色退到图后，不跟图抢戏 */
.image-figure__caption {
  margin-top: var(--space-3);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  color: var(--text-secondary);
  /* 长链接 / 长英文词不撑破容器 */
  overflow-wrap: break-word;
  text-wrap: var(--text-wrap-body);
}
</style>
