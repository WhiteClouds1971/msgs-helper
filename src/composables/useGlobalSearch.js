import { ref } from 'vue'

/** 全局搜索蒙层的开关状态（单例） */
const isOpen = ref(false)

export function useGlobalSearch() {
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
