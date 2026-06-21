# localStorage 统一缓存框架设计

## 目标

为纯前端项目建立统一的数据缓存管理层，覆盖三类数据：

| 类别 | key 来源 | 示例 |
|------|----------|------|
| 系统数据 | `StorageKeys` 枚举（固定 key） | 主题、菜单排序 |
| 控件数据 | `StorageKeys` 枚举（固定 key） | 控制台开关、悬浮球位置 |
| 页面数据 | `route.fullPath`（动态 key） | 表单内容、工具计算结果 |

## 架构

```
src/constants/storageKeys.js    ← Key 注册表（单一事实源）
src/stores/localStorage.js      ← 统一缓存 store（load/reset/pageData）
src/stores/index.js             ← createPinia（不动）
```

## storageKeys.js

```js
/**
 * localStorage Key 注册表 — 单一事实源
 *
 * 命名规范：msgs-<domain>
 *   新增 key 时在此文件追加，禁止在别处写字面量字符串。
 */
export const StorageKeys = Object.freeze({
  CONSOLE:    'msgs-console',
  THEME:      'msgs-theme',
  MENU_ORDER: 'msgs-menu-order',
  // 后续按需追加...
})
```

## useLocalStorage

```js
// src/stores/localStorage.js

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

  /** 按指定 key 从 localStorage 加载数据 */
  function load(key, defaults = {}) {
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
```

## 使用示例

```vue
<script setup>
import { useLocalStorage } from '@/stores/localStorage'
import { StorageKeys } from '@/constants/storageKeys'

const store = useLocalStorage()

// 系统/控件数据 — 固定 key
store.load(StorageKeys.CONSOLE, { isOpen: false })

// 页面数据 — fullPath 自动取，只存当前页面
store.load(route.fullPath, { selected: null, count: 0 })
</script>

<template>
  <Drawer :open="store.cache[StorageKeys.CONSOLE].isOpen" />
  <input v-model="store.pageData.count" />
  <button @click="store.reset(route.fullPath, { selected: null, count: 0 })">
    重置
  </button>
</template>
```

## 性能考虑

采用 `watch` deep 全量同步，接受以下权衡：

- **收益**：一个 store 管全部，架构极简，无需 Pinia 插件
- **代价**：任何 key 变更都会序列化整个 `cache` 对象写入 localStorage
- **可接受**：当前数据量小（几个 key + 当前页面 data），后续数据增长后再考虑优化为按 key 增量写入

## 迁移路径

现有 `menuOrder.js` 手写 localStorage 的部分，后续迁移时：

1. `storageKeys.js` 加 `MENU_ORDER: 'msgs-menu-order'`
2. `menuOrder.js` 内部用 `useLocalStorage().load/reset` 替代 `loadOrder/saveOrder`
3. 删掉 `menuOrder.js` 中的 `STORAGE_KEY`、`loadOrder`、`saveOrder` 函数

## 不纳入管理的

以下数据**不需要持久化**，保持内存状态：

- `useAppShell` — Splash 过渡（路由切换即重置）
- `useImagePreload` — 图片加载状态（副作用）
- 手势状态 — 组件内 ref（瞬时交互）
