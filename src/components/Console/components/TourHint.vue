<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useConsole } from '@/composables/useConsole'
import { startTour, hasTour } from '@/composables/useTour'
import { useMessage } from '@/composables/useMessage'
import MenuIcon from '@/components/MenuIcon/Index.vue'

const route = useRoute()
const { close } = useConsole()
const message = useMessage()

const tourKey = computed(() => route.meta?.tourKey)

function handleClick() {
  // 图标常驻占位（无导览时不隐藏，避免控制台网格留空）
  // 当前页面/菜单未注册导览 → 给出提示而非静默无响应
  if (!hasTour(tourKey.value)) {
    message.info('本页面暂无教学导览')
    return
  }
  close()
  startTour(tourKey.value, { mode: 'manual' })
}
</script>

<template>
  <MenuIcon
    icon="tour-hint"
    @click="handleClick"
  />
</template>
