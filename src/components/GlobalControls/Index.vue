<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppShell } from '@/composables/useAppShell'
import JadeSeal from '@/components/JadeSeal/Index.vue'
import Console from '@/components/Console/Index.vue'
import GlobalSearch from '@/components/GlobalSearch/Index.vue'

const route = useRoute()
const { isReady } = useAppShell()

/** 控件可见性规则（统一管理，后续按路由扩展） */
const controls = computed(() => ({
  jadeSeal: isReady.value && route.name !== 'NotFound',
  globalSearch: isReady.value && route.name !== 'NotFound',
}))
</script>

<template>
  <JadeSeal v-if="controls.jadeSeal" />
  <Console />
  <GlobalSearch v-if="controls.globalSearch" />
</template>
