import { computed } from 'vue'
import { useLocalStorage } from '@/stores/localStorage'
import { StorageKeys } from '@/constants/storageKeys'

const THEME_KEY = StorageKeys.THEME

function getSystemPref() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

/**
 * 入口调用：在 Vue 挂载前执行，读 localStorage 设 data-theme，防止闪烁。
 * 不依赖 Pinia，直接用原生 localStorage。
 */
export function initTheme() {
  let theme = getSystemPref()
  try {
    const raw = localStorage.getItem(THEME_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.mode === 'light' || parsed.mode === 'dark') {
        theme = parsed.mode
      }
    }
  } catch {}
  applyTheme(theme)
}

export function useTheme() {
  const store = useLocalStorage()

  store.load(THEME_KEY, { mode: getSystemPref() })

  const current = computed(() => store.cache[THEME_KEY].mode)
  const isDark = computed(() => current.value === 'dark')

  function toggle() {
    const next = isDark.value ? 'light' : 'dark'
    store.cache[THEME_KEY].mode = next
    applyTheme(next)
  }

  function setTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') return
    store.cache[THEME_KEY].mode = theme
    applyTheme(theme)
  }

  return { current, isDark, toggle, setTheme }
}
