import { describe, expect, it } from 'vitest'
import { getEngine } from './engine'

/** 命中行里的文档条目（锚点是整行/整句，故用「包含」认人） */
function docRows(query, anchorPart) {
  return getEngine()
    .search(query)
    .filter(row => row.type === 'doc' && row.anchor.includes(anchorPart))
}

/** 认人的那条（应恰好一条） */
function docRow(query, anchorPart) {
  return docRows(query, anchorPart)[0]
}

/**
 * 合并文档（src/assets/md/you-xi-pai.md）由两个页面分节认领：
 * 搜索结果的跳转路由必须落在真正渲染那一节的页面，否则落地后无处高亮。
 */
describe('全局搜索 —— 合并文档按节认领', () => {
  it('每一节都跳到真正画它的那个页面', () => {
    expect(docRow('趁火打劫', '趁火打劫')?.route).toBe('/jsrg/cheng-lv-bu-qing-jiao')
    expect(docRow('推心置腹', '推心置腹')?.route).toBe('/jsrg/cheng-lv-bu-qing-jiao')
    expect(docRow('洞烛先机', '洞烛先机')?.route).toBe('/jsrg/guo-jia')
  })

  it('结果行标题取认领的菜单名，而不是退化成文件名', () => {
    expect(docRow('洞烛先机', '洞烛先机')?.title).toBe('转郭嘉')
    expect(docRow('趁火打劫', '趁火打劫')?.title).toBe('承吕布 轻狡')
    expect(docRow('趁火打劫', '趁火打劫')?.disabled).toBe(false)
  })

  it('整篇认领的文档照旧（村规）', () => {
    const row = docRow('议规', '1.1 议规')

    expect(row?.route).toBe('/tool/cun-gui')
    expect(row?.title).toBe('村规')
  })

  it('节内正文行也归本节所属的页面', () => {
    expect(docRow('摸两张牌', '摸两张牌。')?.route).toBe('/jsrg/guo-jia')
    expect(docRow('等量的手牌', '等量的手牌。')?.route).toBe('/jsrg/cheng-lv-bu-qing-jiao')
  })
})

/**
 * 锚点文字只是「找什么」：一页里同一句话可能有好几处（承吕布页两张牌都写着
 * 「使用时机：出牌阶段。」），光靠它落地页只能取第一处 —— 点哪条都跳第一条。
 * 所以每行还得带「哪一块 + 块内第几处」，落地页据此认人（utils/highlight.js）。
 */
describe('全局搜索 —— 落点身份（section + hit）', () => {
  it('同一句话出现在多个块里时，每行各带各的块标题', () => {
    const rows = docRows('出牌阶段', '出牌阶段').map(row => `${row.section} → ${row.route}`)

    expect(new Set(rows)).toEqual(
      new Set([
        '村规 → /tool/cun-gui',
        '趁火打劫 → /jsrg/cheng-lv-bu-qing-jiao',
        '洞烛先机 → /jsrg/guo-jia',
        '推心置腹 → /jsrg/cheng-lv-bu-qing-jiao',
      ]),
    )
  })

  it('整篇认领的行落在文档标题那一块（村规整篇画在一个块里）', () => {
    const row = docRow('议规', '1.1 议规')

    expect(row?.section).toBe('村规')
    expect(row?.hit).toBe(0)
  })

  it('同一块内同一句锚点的序号从 0 起、互不重复', () => {
    for (const query of ['出牌阶段', '目标', '牌']) {
      const groups = new Map()
      const rows = getEngine()
        .search(query)
        .filter(row => row.type === 'doc' && row.route)

      for (const row of rows) {
        const key = `${row.route}\u0000${row.section}\u0000${row.anchor}`
        groups.set(key, [...(groups.get(key) ?? []), row.hit])
      }

      for (const hits of groups.values()) {
        expect([...hits].sort((a, b) => a - b)).toEqual(hits.map((_, index) => index))
      }
    }
  })
})
