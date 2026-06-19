import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import menus from '@/menus'

const STORAGE_KEY = 'msgs-menu-order-v1'

function loadOrder() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const names = JSON.parse(raw)
    if (!Array.isArray(names)) return null
    return names
  } catch {
    return null
  }
}

function saveOrder(names) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(names))
}

function rebuildFromNames(names, allMenus) {
  const map = new Map(allMenus.map((m) => [m.name, m]))
  return names.map((n) => map.get(n)).filter(Boolean)
}

/**
 * 菜单 LRU 排序 Store
 *
 * orderedMenus — 按最近访问排序的菜单列表（最近访问的排在最前）
 * recordAccess(name) — 记录访问，将该菜单移到列表最前，并持久化到 localStorage
 */
export const useMenuOrderStore = defineStore('menuOrder', () => {
  const saved = loadOrder()
  const order = ref(saved ? rebuildFromNames(saved, menus) : [...menus])

  const orderedMenus = computed(() => order.value)

  function persist() {
    saveOrder(order.value.map((m) => m.name))
  }

  function recordAccess(name) {
    const idx = order.value.findIndex((m) => m.name === name)
    if (idx <= 0) return
    const [item] = order.value.splice(idx, 1)
    order.value.unshift(item)
    persist()
  }

  return { orderedMenus, recordAccess }
})
