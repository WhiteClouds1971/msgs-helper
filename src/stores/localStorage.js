import { defineStore } from 'pinia'
import { reactive, computed, watch } from 'vue'
import { useRoute } from 'vue-router'

export const useLocalStorage = defineStore('localStorage', () => {

  const route = useRoute()
  const cache = reactive({})

  const pageData = computed(() => cache[route.fullPath] ?? {})

  // ── 自动持久化（deep watch → 全量同步到 localStorage）──
  watch(
    () => ({ ...cache }),
    (snapshot) => {
      for (const [key, val] of Object.entries(snapshot)) {
        try {
          localStorage.setItem(key, JSON.stringify(val))
        } catch { /* quota / 隐私模式 */ }
      }
    },
    { deep: true }
  )

  /** 按指定 key 从 localStorage 加载数据（已在 cache 中则跳过） */
  function load(key, defaults = {}) {
    if (key in cache) return
    try {
      const raw = localStorage.getItem(key)
      cache[key] = raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults }
    } catch {
      cache[key] = { ...defaults }
    }
  }

  /** 删除 localStorage + 重置为默认值 */
  function reset(key, defaults = {}) {
    try { localStorage.removeItem(key) } catch {}
    cache[key] = { ...defaults }
  }

  return { cache, pageData, load, reset }
})
