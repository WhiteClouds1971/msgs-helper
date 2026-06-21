<script setup>
import { useRouter } from 'vue-router'
import { useConsole } from '@/composables/useConsole'
import MenuIcon from '@/components/MenuIcon/Index.vue'

const router = useRouter()
const { close } = useConsole()

function goHome() {
  close()
  router.push('/')
}
</script>

<template>
  <MenuIcon
    icon="home"
    @click="goHome"
  />
</template>
