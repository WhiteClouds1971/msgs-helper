import { ref } from 'vue'

/** 消息类型 — 决定图标与强调色 */
const MessageTypes = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
}

/** 默认停留时长（ms） */
const DEFAULT_DURATION = 2000

/** 全局消息队列（单例）— 由 src/ui/Message/Index.vue 渲染 */
const queue = ref([])

let seed = 0

function show(type, content, options = {}) {
  const id = ++seed
  queue.value.push({
    id,
    type,
    content,
    duration: options.duration ?? DEFAULT_DURATION,
    open: true,
  })
  return id
}

function close(id) {
  const item = queue.value.find(msg => msg.id === id)
  if (item) item.open = false
}

function closeAll() {
  queue.value.forEach(msg => {
    msg.open = false
  })
}

function remove(id) {
  queue.value = queue.value.filter(msg => msg.id !== id)
}

/**
 * 全局轻提示 — 命令式 API
 *
 *   const message = useMessage()
 *   message.success('身份已确认')
 *   message.error('体力不足', { duration: 3000 })
 *   const id = message.info('长按卡片查看身份', { duration: 0 })  // duration 0 = 常驻
 *   message.close(id)  // 或 message.closeAll()
 *
 * 宿主 <Message /> 在 App.vue 中全局挂载一次，负责渲染队列。
 */
export function useMessage() {
  return {
    success: (content, options) => show(MessageTypes.SUCCESS, content, options),
    error: (content, options) => show(MessageTypes.ERROR, content, options),
    warning: (content, options) => show(MessageTypes.WARNING, content, options),
    info: (content, options) => show(MessageTypes.INFO, content, options),
    close,
    closeAll,
  }
}

// 宿主组件（src/ui/Message）内部使用，业务侧请走 useMessage()
export { queue as messageQueue, remove as removeMessage }
