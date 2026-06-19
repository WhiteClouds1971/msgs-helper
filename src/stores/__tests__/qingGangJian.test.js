import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useQingGangJianStore } from '@/stores/qingGangJian'

describe('qingGangJian Store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('默认 side 为 right', () => {
    const store = useQingGangJianStore()
    expect(store.side).toBe('right')
  })

  it('默认 isExpanded 为 true', () => {
    const store = useQingGangJianStore()
    expect(store.isExpanded).toBe(true)
  })

  it('默认 currentText 为空字符串', () => {
    const store = useQingGangJianStore()
    expect(store.currentText).toBe('')
  })

  it('toggleExpand 切换展开/收起', () => {
    const store = useQingGangJianStore()
    expect(store.isExpanded).toBe(true)
    store.toggleExpand()
    expect(store.isExpanded).toBe(false)
    store.toggleExpand()
    expect(store.isExpanded).toBe(true)
  })

  it('toggleExpand 持久化到 localStorage', () => {
    const store = useQingGangJianStore()
    store.toggleExpand()
    const saved = localStorage.getItem('msgs-qinggangjian-v1')
    expect(saved).toBeTruthy()
    const parsed = JSON.parse(saved)
    expect(parsed.isExpanded).toBe(false)
  })

  it('setSide(left) 设置吸附边为左', () => {
    const store = useQingGangJianStore()
    store.setSide('left')
    expect(store.side).toBe('left')
  })

  it('setSide(right) 设置吸附边为右', () => {
    const store = useQingGangJianStore()
    store.setSide('left')
    store.setSide('right')
    expect(store.side).toBe('right')
  })

  it('currentText 可由外部设置', () => {
    const store = useQingGangJianStore()
    store.currentText = '宁教我负天下人'
    expect(store.currentText).toBe('宁教我负天下人')
  })

  it('从 localStorage 恢复展开状态', () => {
    localStorage.setItem('msgs-qinggangjian-v1', JSON.stringify({ isExpanded: false }))
    const store = useQingGangJianStore()
    expect(store.isExpanded).toBe(false)
  })

  it('localStorage 数据损坏时回退默认值', () => {
    localStorage.setItem('msgs-qinggangjian-v1', 'not-valid-json{{{')
    const store = useQingGangJianStore()
    expect(store.isExpanded).toBe(true)
  })

  it('跨实例间状态隔离', () => {
    const store1 = useQingGangJianStore()
    store1.currentText = '实例一'
    setActivePinia(createPinia())
    const store2 = useQingGangJianStore()
    expect(store2.currentText).toBe('')
  })
})
