<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useConsole } from '@/composables/useConsole'
import { startTour } from '@/composables/useTour'
import MenuIcon from '@/components/MenuIcon/Index.vue'

const route = useRoute()
const { close } = useConsole()

const tourKey = computed(() => route.meta?.tourKey)

function handleClick() {
  if (!tourKey.value) return
  close()
  startTour(tourKey.value, { mode: 'manual' })
}
</script>

<template>
  <MenuIcon
    v-if="tourKey"
    icon="tour-hint"
    name="提示"
    @click="handleClick"
  />
</template>
