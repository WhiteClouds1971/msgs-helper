import { ref, computed } from 'vue'

const STORAGE_KEY = 'theme-preference'

function readTheme() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  return 'light'
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

function persist(theme) {
  localStorage.setItem(STORAGE_KEY, theme)
}

// 单例状态（初始值由 initTheme() 在入口设置）
const current = ref('light')

// 衍生：模板用布尔值
const isDark = computed(() => current.value === 'dark')

/** 入口调用：读取缓存/系统偏好，设置 data-theme，返回初始值 */
export function initTheme() {
  const theme = readTheme()
  applyTheme(theme)
  current.value = theme
  return theme
}

export function useTheme() {
  function toggle() {
    const next = current.value === 'dark' ? 'light' : 'dark'
    current.value = next
    applyTheme(next)
    persist(next)
  }

  function setTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') return
    current.value = theme
    applyTheme(theme)
    persist(theme)
  }

  return { current, isDark, toggle, setTheme }
}
