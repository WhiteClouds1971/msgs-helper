/**
 * 应用版本校验
 *
 * 首屏加载前执行：比对当前版本与 localStorage 中存储的版本号。
 * 若版本不一致，清空浏览器本地数据库（localStorage）中的所有 key，
 * 确保 stores 初始化时读到的是干净数据。
 */
import { version } from '../../package.json'

const VERSION_KEY = 'msgs-app-version'

export function checkVersion() {
  const storedVersion = localStorage.getItem(VERSION_KEY)

  if (storedVersion && storedVersion !== version) {
    localStorage.clear()
  }

  localStorage.setItem(VERSION_KEY, version)
}
