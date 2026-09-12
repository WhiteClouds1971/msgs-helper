import { describe, expect, it } from 'vitest'
import menus from '@/constants/menus'
import { getMdDoc } from '@/assets/md'
import { extractMarkdownSection } from '@/utils/markdown'

/** 把各菜单 docs 字段的两种写法摊平成 { menu, id, heading } */
const claims = menus.flatMap(menu =>
  (menu.docs ?? []).map(claim =>
    typeof claim === 'string'
      ? { menu, id: claim, heading: '' }
      : { menu, id: claim.id, heading: claim.heading ?? '' },
  ),
)

/**
 * docs 写错是**静默降级**（搜得到、点不动、页面空态），没有编译期兜底，
 * 所以这里把注册表与 src/assets/md/ 的真实内容对一遍。
 */
describe('menus.js — docs 认领', () => {
  it('每条认领都指向真实存在的 .md', () => {
    const missing = claims.filter(claim => !getMdDoc(claim.id)).map(claim => claim.id)

    expect(missing).toEqual([])
  })

  it('分节认领的 heading 都能从该篇里切出正文', () => {
    const broken = claims
      .filter(claim => claim.heading)
      .filter(claim => !extractMarkdownSection(getMdDoc(claim.id).raw, claim.heading))
      .map(claim => `${claim.menu.code} → ${claim.id} / ${claim.heading}`)

    expect(broken).toEqual([])
  })

  it('同一篇的同一节不被两个菜单重复认领（先声明的生效，另一个会落空）', () => {
    const keys = claims.map(claim => `${claim.id} / ${claim.heading}`)
    const seen = new Set()
    const dup = keys.filter(key => (seen.has(key) ? true : (seen.add(key), false)))

    expect(dup).toEqual([])
  })
})
