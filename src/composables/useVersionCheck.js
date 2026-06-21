/**
 * 应用版本校验
 *
 * 首屏加载前执行：比对当前版本与 localStorage 中存储的版本号。
 * 若版本不一致，清空浏览器本地数据库（localStorage）中的所有 key，
 * 确保 stores 初始化时读到的是干净数据。
 */
import { version } from '../../package.json'
import { StorageKeys } from '@/constants/storageKeys'

/** 版本升级时保留的 key */
const PRESERVE_KEYS = new Set([
  StorageKeys.APP_VERSION,
  StorageKeys.TOUR,
])

export function checkVersion() {
  const storedVersion = localStorage.getItem(StorageKeys.APP_VERSION)

  if (storedVersion && storedVersion !== version) {
    const preserve = {}
    for (const key of PRESERVE_KEYS) {
      const val = localStorage.getItem(key)
      if (val !== null) preserve[key] = val
    }
    localStorage.clear()
    for (const [key, val] of Object.entries(preserve)) {
      localStorage.setItem(key, val)
    }
  }

  localStorage.setItem(StorageKeys.APP_VERSION, version)
}
