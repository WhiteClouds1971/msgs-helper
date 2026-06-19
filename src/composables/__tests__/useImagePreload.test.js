import { describe, it, expect } from 'vitest'
import { useImagePreload } from '@/composables/useImagePreload'

describe('useImagePreload', () => {
  it('返回 loadState reactive Map', () => {
    const { loadState } = useImagePreload(['url1', 'url2'])
    expect(loadState).toBeInstanceOf(Map)
    expect(loadState.has('url1')).toBe(true)
    expect(loadState.has('url2')).toBe(true)
  })

  it('空字符串 URL 被跳过', () => {
    const { loadState } = useImagePreload(['valid-url', ''])
    expect(loadState.has('valid-url')).toBe(true)
    expect(loadState.has('')).toBe(false)
  })

  it('初始状态为 pending', () => {
    const { loadState } = useImagePreload(['url1'])
    expect(loadState.get('url1')).toBe('pending')
  })

  it('preloadNext 可调用', () => {
    const { preloadNext } = useImagePreload(['url1'])
    expect(() => preloadNext(1)).not.toThrow()
  })

  it('空数组容错', () => {
    const { loadState, preloadNext: pn } = useImagePreload([])
    expect(loadState.size).toBe(0)
    expect(() => pn(1)).not.toThrow()
  })

  it('预加载已加载的 URL 不重复', () => {
    const { loadState, preloadNext } = useImagePreload(['url1'])
    preloadNext(1)
    // 不应崩溃
    expect(loadState.has('url1')).toBe(true)
  })
})
