<script setup>
import { useConsole } from '@/composables/useConsole'
import { useGlobalSearch } from '@/composables/useGlobalSearch'
import MenuIcon from '@/components/MenuIcon/Index.vue'

const { close } = useConsole()
const { open } = useGlobalSearch()

function handleClick() {
  // 先收起控制台，再拉起搜索蒙层（两者都是全屏层，不叠加）
  close()
  open()
}
</script>

<template>
  <MenuIcon
    icon="sou_suo"
    @click="handleClick"
  />
</template>
