/**
 * 页内展示的 Markdown 正文注册表 — 单一事实源
 *
 * 自动收录 src/assets/md/ 下的全部 .md 文件（新增文件无需改这里），
 * 全局搜索据此建立文档索引；页面取正文仍走 \`?raw\` 静态导入或 getMdDoc()。
 * 文档 id = 文件名（不含扩展名），菜单在 menus.js 的 docs 字段里认领整篇；
 * 多节合并成一篇的（如 you-xi-pai.md），各菜单按「id + heading」分节认领。
 */
const modules = import.meta.glob('@/assets/md/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
})

function toDocId(path) {
  return path.slice(path.lastIndexOf('/') + 1).replace(/\.md$/, '')
}

export const mdDocs = Object.entries(modules)
  .map(([path, raw]) => ({ id: toDocId(path), raw }))
  .sort((a, b) => a.id.localeCompare(b.id))

/** 按 id 取文档（找不到返回 null） */
export function getMdDoc(id) {
  return mdDocs.find(doc => doc.id === id) ?? null
}

export default mdDocs
