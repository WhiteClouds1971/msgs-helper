import { ref } from 'vue'

/** 控制台面板的全局开关状态（单例） */
const isOpen = ref(false)

export function useConsole() {
  function open() {
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
  }

  function toggle() {
    isOpen.value = !isOpen.value
  }

  return { isOpen, open, close, toggle }
}
