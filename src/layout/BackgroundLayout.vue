<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import menus from '@/constants/menus'
import ImageBackground from '@/ui/ImageBackground/Index.vue'
import InkWashBackground from '@/components/InkWashBackground/Index.vue'

const route = useRoute()

// Resolve image URLs — same pattern as HomePageCard
const imageModules = import.meta.glob('@/assets/images/menus/*.{gif,png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
})

function resolveImageUrl(src) {
  if (!src) return ''
  const filename = src.replace(/\\/g, '/').split('/').pop()
  for (const [path, url] of Object.entries(imageModules)) {
    if (path.endsWith('/' + filename) || path.endsWith(filename)) {
      return url
    }
  }
  return ''
}

const isMenuRoute = computed(() => route.meta?.isMenuRoute === true)

const menuInfo = computed(() => {
  if (!isMenuRoute.value) return null
  const code = route.meta?.code
  if (!code) return null
  return menus.find(m => m.code === code) || null
})

const hasImage = computed(() => {
  const src = menuInfo.value?.image?.src
  return !!(src && resolveImageUrl(src))
})

const imageSrc = computed(() => {
  if (!hasImage.value) return ''
  return resolveImageUrl(menuInfo.value.image.src)
})

const imagePosition = computed(() => {
  const img = menuInfo.value?.image
  if (!img) return 'center'
  return `${img.focalX ?? 50}% ${img.focalY ?? 50}%`
})
</script>

<template>
  <div class="layout">
    <!-- 背景层 -->
    <div class="layout__bg">
      <ImageBackground
        v-if="hasImage"
        :src="imageSrc"
        :position="imagePosition"
        class="layout__bg-image"
      />
      <InkWashBackground v-else />
    </div>

    <!-- 页面内容 -->
    <div class="layout__body">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="less">
.layout {
  position: relative;
  min-height: 100vh;
}

/* ── 背景层（固定视口，不随滚动）── */
.layout__bg {
  position: fixed;
  inset: 0;
  z-index: 0;
}

.layout__bg-image {
  width: 100%;
  height: 100%;
}

/* ── 内容层 ── */
.layout__body {
  position: relative;
  z-index: 1;
}
</style>
