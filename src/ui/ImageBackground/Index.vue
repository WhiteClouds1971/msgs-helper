<script setup>
defineProps({
  /** 图片路径（必填），支持 URL 字符串或 Vite import 结果 */
  src: { type: String, required: true },
  /** 图片焦点位置，CSS background-position 值，如 '20% 80%'、'top right' */
  position: { type: String, default: 'center' },
  /** 模糊强度，默认不模糊 */
  blur: { type: String, default: '0px' },
})

defineSlots()
</script>

<template>
  <div
    class="image-bg"
    :style="{
      '--ib-src': `url(${src})`,
      '--ib-pos': position,
      '--ib-blur': blur,
    }"
  >
    <!-- 内容层 -->
    <div class="image-bg__content">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="less">
/* ================================================================
   ImageBackground — 图片背景容器
   背景图通过 ::before 承载，blur 由外部控制
   ================================================================ */

.image-bg {
  position: relative;
  overflow: hidden;
  isolation: isolate;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background-image: var(--ib-src);
    background-size: cover;
    background-position: var(--ib-pos);
    background-repeat: no-repeat;
    filter: blur(var(--ib-blur, 0px));
  }
}

.image-bg__content {
  position: relative;
  z-index: 1;
}
</style>
