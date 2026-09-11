import { defineStore } from 'pinia'
import { reactive, computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

export const useLocalStorage = defineStore('localStorage', () => {

  const route = useRoute()
  const cache = reactive({})

  /** 页面数据清除计数 — App.vue 拼进 router-view 的 key，触发页面重挂载回默认值 */
  const pageRevision = ref(0)

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

  /** localStorage 中是否存有该 key */
  function hasStored(key) {
    try {
      return localStorage.getItem(key) !== null
    } catch {
      return false
    }
  }

  /**
   * 删除页面持久化数据 — 清 localStorage + 清内存缓存 + 递增 pageRevision
   *
   * 内存缓存必须一并删除：残留的 cache 会在下次变更时被 watch 原样写回，
   * 且页面重挂载后 load() 只有在 key 不存在时才会重新填入默认值。
   *
   * @returns {boolean} 是否确有数据被清除（页面本就无持久化数据时返回 false）
   */
  function clearPage(key = route.fullPath) {
    const existed = key in cache || hasStored(key)
    try { localStorage.removeItem(key) } catch { /* 隐私模式 */ }
    delete cache[key]
    if (existed) pageRevision.value++
    return existed
  }

  return { cache, pageData, pageRevision, load, reset, clearPage }
})
