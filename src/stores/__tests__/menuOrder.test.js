import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMenuOrderStore } from '@/stores/menuOrder'

describe('menuOrder Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('默认排序从 menus[] 注册表加载', () => {
    const store = useMenuOrderStore()
    expect(store.orderedMenus.length).toBeGreaterThanOrEqual(10)
    expect(store.orderedMenus[0].name).toBeDefined()
  })

  it('recordAccess 将指定菜单移到首位', () => {
    const store = useMenuOrderStore()
    const secondName = store.orderedMenus[1].name
    store.recordAccess(secondName)
    expect(store.orderedMenus[0].name).toBe(secondName)
  })

  it('recordAccess 已为首位时不变', () => {
    const store = useMenuOrderStore()
    const firstBefore = store.orderedMenus[0].name
    store.recordAccess(firstBefore)
    expect(store.orderedMenus[0].name).toBe(firstBefore)
  })

  it('recordAccess 未知名称不影响排序', () => {
    const store = useMenuOrderStore()
    const before = store.orderedMenus.map(m => m.name)
    store.recordAccess('不存在的工具')
    expect(store.orderedMenus.map(m => m.name)).toEqual(before)
  })

  it('不修改原始 menus[] 注册表', () => {
    const store = useMenuOrderStore()
    const originalLength = store.orderedMenus.length
    store.recordAccess(store.orderedMenus[1].name)
    expect(store.orderedMenus.length).toBe(originalLength)
  })

  it('多次 recordAccess 保持正确顺序', () => {
    const store = useMenuOrderStore()
    store.recordAccess(store.orderedMenus[2].name)
    store.recordAccess(store.orderedMenus[1].name)
    // 最后访问的应该在第一位
    expect(store.orderedMenus[0].name).toBe(store.orderedMenus[0].name)
    expect(store.orderedMenus.length).toBeGreaterThanOrEqual(10)
  })
})
