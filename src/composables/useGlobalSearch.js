import { ref } from 'vue'

/** 全局搜索蒙层的开关状态（单例） */
const isOpen = ref(false)

/**
 * 玉玺命中判定（单例）— 由 JadeSeal 注册，入参为视口坐标 (x, y)，命中返回 true。
 *
 * 玉玺就是「单击打开搜索」的那颗按钮：宽屏下它露在蒙层边缘、透过半透明遮罩还看得见，
 * 用户在它上面再点一下的本意绝不是「关掉搜索」。蒙层据此把它排除在「外部点击」之外。
 */
const sealHitTest = ref(null)

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

  return { isOpen, open, close, toggle, sealHitTest }
}
