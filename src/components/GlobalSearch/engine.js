/**
 * 全局搜索索引 —— 收录「菜单」与「文档」两类条目
 *
 * 单一事实源：
 *   · 菜单 —— src/constants/menus.js
 *   · 文档 —— src/assets/md/ 下的全部 .md（按行切段）
 *
 * 本模块依赖拼音库与 Fuse（体积可观），由 GlobalSearch/Index.vue 动态 import，
 * 首次打开搜索时才加载，不进首屏包。
 */
import menus from '@/constants/menus'
import { mdDocs } from '@/assets/md'
import { convertChineseToPinyin } from '@/utils/pinyin'
import { parseMarkdownChunks, pickAnchor, stripInline } from '@/utils/markdown'
import { createSearchIndex, highlightSnippet, searchItemsByKeyword } from '@/utils/search'

/**
 * 文档认领表 —— 菜单在 menus.js 的 docs 字段里认领本页展示的正文
 *
 * 两种写法（合并文档由多个页面各认领一节）：
 *   · 'cun-gui'                                  —— 认领整篇
 *   · { id: 'you-xi-pai', heading: '趁火打劫' }    —— 只认领该篇里这一节
 *
 * 返回 { whole: Map<docId, menu>, sections: Map<docId, Map<heading, menu>> }。
 * 一名认领者在多个菜单间重复时不叠加：整篇先到先得，同一节也先到先得。
 */
function collectDocClaims() {
  const whole = new Map()
  const sections = new Map()

  for (const menu of menus) {
    for (const claim of menu.docs ?? []) {
      const id = (typeof claim === 'string' ? claim : claim?.id)?.trim()
      if (!id) continue

      const heading = stripInline(typeof claim === 'string' ? '' : claim.heading)
      if (!heading) {
        if (!whole.has(id)) whole.set(id, menu)
        continue
      }

      const byHeading = sections.get(id) ?? new Map()
      if (!byHeading.has(heading)) byHeading.set(heading, menu)
      sections.set(id, byHeading)
    }
  }

  return { whole, sections }
}

/** 认领行按行号排好序后，取「最后一个不晚于本行」的认领 —— 节里的下级标题也跟着走 */
function claimAtLine(anchors, line) {
  let claim = null
  for (const anchor of anchors) {
    if (anchor.line > line) break
    claim = anchor
  }
  return claim
}

/** 菜单条目：名称 + 分类 + 自定义标签，一起参与检索 */
function buildMenuItems() {
  return menus
    .filter(menu => !menu.hidden)
    .map(menu => {
      const tags = [menu.packageName, ...(menu.tags ?? [])].filter(Boolean)
      const keyword = [menu.name, ...tags].join('、')
      return {
        id: `menu:${menu.code}`,
        type: 'menu',
        title: menu.name,
        tags,
        keyword,
        route: menu.route,
        ...convertChineseToPinyin(keyword),
      }
    })
}

/**
 * 文档条目：.md 逐行成条，行内保留 segments 供跳转后精准高亮
 *
 * 每条还带一份**落点身份**（落地页按它在 DOM 里认人，见 utils/highlight.js）：
 *   · section —— 本行所在正文块的标题；分节认领是那一节的标题，
 *                整篇认领则取文档自己的首个标题（整篇画在一个块里）
 *   · seq     —— 文档顺序。同一句锚点在一页里出现多次时，块内第几处就靠它数
 *                （块内 DOM 顺序 = 文档顺序，故与页面把两节排成什么先后无关）
 */
function buildDocItems(claims) {
  const items = []
  let seq = 0

  for (const doc of mdDocs) {
    const chunks = parseMarkdownChunks(doc.raw)
    // 整篇认领最省事；分节认领则先找出「认领的那几行标题」当锚点，
    // 每个片段归给它前面最近的锚点 —— 于是节里的 ### 下级标题也归本节，
    // 而节前的内容（如一级标题）无人认领，仍按老规矩退化成灰行
    const whole = claims.whole.get(doc.id)
    const anchors = []

    if (!whole) {
      const sections = claims.sections.get(doc.id)
      if (sections) {
        for (const chunk of chunks) {
          const menu = chunk.kind === 'heading' ? sections.get(chunk.text) : null
          if (menu) anchors.push({ line: chunk.line, heading: chunk.text, menu })
        }
        anchors.sort((a, b) => a.line - b.line)
      }
    }

    // 整篇认领的文档整篇画在一个块里，块标题取它自己的首个标题
    const docTitle = whole ? (chunks.find(chunk => chunk.kind === 'heading')?.text ?? '') : ''

    chunks.forEach((chunk, index) => {
      const claim = whole ? null : claimAtLine(anchors, chunk.line)
      const owner = whole ?? claim?.menu

      items.push({
        id: `doc:${doc.id}:${index}`,
        type: 'doc',
        docId: doc.id,
        owner: owner?.name ?? doc.id,
        section: whole ? docTitle : (claim?.heading ?? ''),
        seq: seq++,
        heading: chunk.heading,
        chunk,
        keyword: chunk.text,
        route: owner?.route ?? '',
        ...convertChineseToPinyin(chunk.text),
      })
    })
  }

  return items
}

/** 索引条目 → 结果行（视图层直接渲染，不再做业务判断） */
function toRow(item, query) {
  const isMenu = item.type === 'menu'
  return {
    id: item.id,
    type: item.type,
    typeName: isMenu ? '菜单' : '文档',
    title: isMenu ? item.title : item.owner,
    tags: isMenu ? item.tags : [],
    // 标题行右侧的小字：文档给所属章节，菜单给分类
    crumb: isMenu
      ? ''
      : item.heading && item.heading !== item.chunk.text
        ? item.heading
        : '',
    snippet: isMenu ? '' : highlightSnippet(item.chunk.text, query),
    // 写进 URL 的锚点：无关键词时用整行，供跳转后高亮
    anchor: isMenu ? '' : pickAnchor(item.chunk, query),
    // 落点身份：「哪一块 + 块内第几处」，随锚点一起写进 URL（hit 由 assignHitIndex 补）
    section: isMenu ? '' : (item.section ?? ''),
    hit: 0,
    route: item.route,
    disabled: !item.route,
  }
}

/**
 * 补「块内第几处」—— 同一句锚点在一页里出现多次时，落地页靠它认人
 *
 * 行是按相关度排的，序号却得按文档顺序数，故借条目自带的 seq 排一遍再编号。
 * 分组键带上 route：块的先后由页面自己定，跨页的两行互不干扰。
 */
function assignHitIndex(items, rows) {
  const groups = new Map()

  rows.forEach((row, index) => {
    if (row.type !== 'doc') return

    const key = `${row.route}\u0000${row.section}\u0000${row.anchor}`
    const group = groups.get(key) ?? []
    group.push({ row, seq: items[index].seq })
    groups.set(key, group)
  })

  for (const group of groups.values()) {
    group
      .sort((a, b) => a.seq - b.seq)
      .forEach((entry, index) => {
        entry.row.hit = index
      })
  }

  return rows
}

function createEngine() {
  const items = [...buildMenuItems(), ...buildDocItems(collectDocClaims())]
  const fuse = createSearchIndex(items)

  return {
    size: items.length,
    /** 未输入关键词时的默认列表：全部菜单，顺序即 menus.js 顺序 */
    defaults: () => items.filter(item => item.type === 'menu').map(item => toRow(item, '')),
    search: (query) => {
      const hits = searchItemsByKeyword(query, fuse)
      return assignHitIndex(hits, hits.map(item => toRow(item, query)))
    },
  }
}

let engine = null

/** 取索引（首次调用时构建并缓存） */
export function getEngine() {
  engine ??= createEngine()
  return engine
}

export default getEngine
