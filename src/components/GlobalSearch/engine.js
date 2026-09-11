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
import { parseMarkdownChunks, pickAnchor } from '@/utils/markdown'
import { createSearchIndex, highlightSnippet, searchItemsByKeyword } from '@/utils/search'

/** 文档 id → 展示它的菜单（菜单在 menus.js 的 docs 字段里认领） */
function collectDocOwners() {
  const owners = new Map()
  for (const menu of menus) {
    for (const docId of menu.docs ?? []) {
      if (!owners.has(docId)) owners.set(docId, menu)
    }
  }
  return owners
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

/** 文档条目：.md 逐行成条，行内保留 segments 供跳转后精准高亮 */
function buildDocItems(owners) {
  const items = []

  for (const doc of mdDocs) {
    const owner = owners.get(doc.id)
    parseMarkdownChunks(doc.raw).forEach((chunk, index) => {
      items.push({
        id: `doc:${doc.id}:${index}`,
        type: 'doc',
        docId: doc.id,
        owner: owner?.name ?? doc.id,
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
    route: item.route,
    disabled: !item.route,
  }
}

function createEngine() {
  const items = [...buildMenuItems(), ...buildDocItems(collectDocOwners())]
  const fuse = createSearchIndex(items)

  return {
    size: items.length,
    /** 未输入关键词时的默认列表：全部菜单，顺序即 menus.js 顺序 */
    defaults: () => items.filter(item => item.type === 'menu').map(item => toRow(item, '')),
    search: (query) => searchItemsByKeyword(query, fuse).map(item => toRow(item, query)),
  }
}

let engine = null

/** 取索引（首次调用时构建并缓存） */
export function getEngine() {
  engine ??= createEngine()
  return engine
}

export default getEngine
