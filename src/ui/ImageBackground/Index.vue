<script setup>
defineProps({
  /** 图片路径（必填），支持 URL 字符串或 Vite import 结果 */
  src: { type: String, required: true },
  /** 图片焦点位置，CSS background-position 值，如 '20% 80%'、'top right' */
  position: { type: String, default: 'center' },
  /** 模糊强度，如 '2px'，默认不模糊 */
  blur: { type: String, default: '0px' },
  /** 是否显示弱化遮罩层 */
  overlay: { type: Boolean, default: true },
})

defineSlots()
</script>

<template>
  <div
    class="image-bg"
    :style="{
      backgroundImage: `url(${src})`,
      backgroundPosition: position,
      '--ib-blur': blur,
    }"
  >
    <!-- 弱化遮罩 — 降低图片视觉权重，凸显前景内容 -->
    <div
      v-if="overlay"
      class="image-bg__overlay"
    />

    <!-- 内容层 -->
    <div class="image-bg__content">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="less">
/* ================================================================
   ImageBackground — 图片弱化背景容器
   灵感：古籍插画的淡墨衬底 — 图片退为背景，内容浮于纸上
   ================================================================ */

.image-bg {
  position: relative;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  /* 模糊通过 CSS 变量驱动，方便按需启用 */
  filter: blur(var(--ib-blur, 0px));
}

/* ── 弱化遮罩 ── */
.image-bg__overlay {
  position: absolute;
  inset: 0;
  background: var(--bg-overlay);
  z-index: 0;
}

/* ── 内容层 ── */
.image-bg__content {
  position: relative;
  z-index: 1;
}

/* ── 无障碍 ── */
@media (prefers-reduced-motion: reduce) {
  .image-bg {
    /* 模糊在 reduce-motion 下不退化 — blur 是静态视觉效果，非动画 */
  }
}
</style>
