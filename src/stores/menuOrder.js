import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import menus from '@/constants/menus'
import { useLocalStorage } from '@/stores/localStorage'

function rebuild(names, source) {
  const map = new Map(source.map((m) => [m.name, m]))
  return names.map((n) => map.get(n)).filter(Boolean)
}

export const useMenuOrderStore = defineStore('menuOrder', () => {
  const route = useRoute()
  const ls = useLocalStorage()

  ls.load(route.fullPath, { order: menus.map((m) => m.name) })

  const orderedMenus = computed(() =>
    rebuild(ls.pageData.order ?? [], menus)
  )

  function recordAccess(name) {
    const order = ls.pageData.order
    const idx = order.findIndex((n) => n === name)
    if (idx <= 0) return
    order.splice(idx, 1)
    order.unshift(name)
  }

  return { orderedMenus, recordAccess }
})
