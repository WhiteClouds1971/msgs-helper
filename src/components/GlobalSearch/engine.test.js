import { describe, expect, it } from 'vitest'
import { getEngine } from './engine.js'

describe('GlobalSearch 索引', () => {
  it('默认列表只含菜单，顺序即 menus.js 顺序', () => {
    const rows = getEngine().defaults()
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.every(row => row.type === 'menu')).toBe(true)
    expect(rows[0].title).toBe('村规')
  })

  it('文档按行收录并挂到声明 docs 的菜单路由上', () => {
    const doc = getEngine()
      .search('判定')
      .find(row => row.type === 'doc')
    expect(doc).toBeTruthy()
    expect(doc.route).toBe('/tool/cun-gui')
    expect(doc.disabled).toBe(false)
    expect(doc.typeName).toBe('文档')
  })

  it('命中行同时给出结果片段与跳转锚点', () => {
    const doc = getEngine()
      .search('判定')
      .find(row => row.type === 'doc' && row.anchor.includes('判定'))
    expect(doc).toBeTruthy()
    expect(doc.snippet).toContain('<mark>判定</mark>')
  })

  it('菜单支持拼音与首字母检索', () => {
    expect(getEngine().search('cungui').some(row => row.title === '村规')).toBe(true)
    // 「郭嘉」合并了原「洞烛先机」「神速」两个菜单：两条检索标签的拼音 / 首字母都要能命中
    expect(
      getEngine()
        .search('dzxj')
        .some(row => row.title === '郭嘉'),
    ).toBe(true)
    expect(
      getEngine()
        .search('shensu')
        .some(row => row.title === '郭嘉'),
    ).toBe(true)
  })

  it('菜单结果带分类标签，文档结果带所属章节', () => {
    const menu = getEngine()
      .search('村规')
      .find(row => row.type === 'menu')
    expect(menu.tags).toContain('工具')

    const doc = getEngine()
      .search('判定')
      .find(row => row.type === 'doc' && row.crumb)
    expect(doc.crumb.length).toBeGreaterThan(0)
  })
})
