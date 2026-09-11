<script setup>
import { useRoute } from 'vue-router'
import { useConsole } from '@/composables/useConsole'
import { useLocalStorage } from '@/stores/localStorage'
import { useMessage } from '@/composables/useMessage'
import MenuIcon from '@/components/MenuIcon/Index.vue'

const route = useRoute()
const { close } = useConsole()
const ls = useLocalStorage()
const message = useMessage()

function handleClick() {
  // 无持久化数据的页面：仅提示，不做无效动作
  if (!ls.clearPage(route.fullPath)) {
    message.info('本页面暂无持久化数据')
    return
  }
  close()
  message.success('已清除本页数据')
}
</script>

<template>
  <MenuIcon
    icon="qing_chu"
    theme-color="var(--accent-red)"
    @click="handleClick"
  />
</template>
