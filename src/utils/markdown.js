/**
 * Markdown 工具库 —— 把 .md 原文切成「可被搜到、也能被精准定位」的片段，
 * 以及把合并文档按节切给页面
 *
 * 三个消费者：
 *   · 全局搜索建索引 —— parseMarkdownChunks() 逐行产出片段（正文 + 明细）
 *   · 结果跳转后定位 —— anchorCandidates() 给出候选锚点，供 mark.js 逐条尝试高亮
 *   · 页面取正文 —— extractMarkdownSection() 从合并文档里切出自己那一节
 *
 * 片段里同时保留：
 *   text     —— 去掉行内标记的整行纯文本（模糊匹配用）
 *   segments —— 被行内标记切开的连续纯文本块（与渲染后的 DOM 文本节点一一对应，
 *               因此拿它当锚点必然能命中，不会因 <strong>/<a> 打断而找不到）
 */

/** 行内标记：图片 / 链接 / 代码 / 加粗 / 斜体 / 删除线 / 裸 HTML 标签 */
const INLINE_RE =
  /(!?\[[^\]]*\]\([^)]*\)|`[^`]*`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|~~[^~]+~~|<[^>]*>)/g

/** 去掉行内标记，只留纯文本 */
export function stripInline(text) {
  return String(text ?? '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/<[^>]*>/g, '')
    .trim()
}

/**
 * 把一行拆成连续纯文本块（与渲染后的 DOM 文本节点对应）
 * 「每人初始手牌 **4 张**」 → ['每人初始手牌', '4 张']
 */
export function splitInline(text) {
  const source = String(text ?? '')
  const out = []
  let last = 0
  let match

  INLINE_RE.lastIndex = 0
  while ((match = INLINE_RE.exec(source)) !== null) {
    if (match.index > last) out.push(source.slice(last, match.index))
    const plain = stripInline(match[0])
    if (plain) out.push(plain)
    last = match.index + match[0].length
  }
  if (last < source.length) out.push(source.slice(last))

  return out.map(part => part.trim()).filter(Boolean)
}

/** 按中文句读断句（高亮一整句比高亮一整段克制得多） */
export function splitSentences(text) {
  return String(text ?? '')
    .split(/(?<=[。！？；!?;])/)
    .map(part => part.trim())
    .filter(Boolean)
}

/** 去掉表格行的首尾竖线，返回各单元格 */
function splitTableRow(line) {
  return line
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map(cell => cell.trim())
}

/** 表格对齐行（| --- | :--: |）不是内容，跳过 */
function isTableDivider(line) {
  return /^\|?[\s:|-]+\|?$/.test(line) && line.includes('-')
}

/** 分隔线 / HTML 注释等纯装饰行 */
function isDecorative(line) {
  return /^([-*_])\1{2,}$/.test(line) || /^<!--/.test(line)
}

/**
 * 逐行解析 Markdown，产出行级片段
 *
 * @param {string} raw - Markdown 原文
 * @returns {Array<{ text: string, segments: string[], heading: string, kind: string, line: number }>}
 */
export function parseMarkdownChunks(raw) {
  const chunks = []
  let heading = ''
  let fence = null

  const push = (text, segments, kind, line) => {
    const body = String(text ?? '').trim()
    const parts = (segments ?? []).map(seg => String(seg).trim()).filter(Boolean)
    if (!body && parts.length === 0) return
    chunks.push({ text: body || parts.join(''), segments: parts.length ? parts : [body], heading, kind, line })
  }

  const lines = String(raw ?? '').split(/\r?\n/)

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim()
    const lineNo = index + 1

    // 代码围栏内部：整行原文即内容，不做行内标记剥离
    if (fence !== null) {
      if (line.startsWith(fence)) {
        fence = null
        return
      }
      push(line, [line], 'code', lineNo)
      return
    }

    if (!line) return

    const fenceMatch = /^(```+|~~~+)/.exec(line)
    if (fenceMatch) {
      fence = fenceMatch[1]
      return
    }

    if (isDecorative(line)) return

    // 标题：正文即标题文本，同时作为后续片段的归属
    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(line)
    if (headingMatch) {
      heading = stripInline(headingMatch[2])
      push(heading, [heading], 'heading', lineNo)
      return
    }

    // 表格：分隔行丢弃，数据行按单元格切分
    if (line.startsWith('|') || line.includes('|')) {
      if (isTableDivider(line)) return
      const cells = splitTableRow(line)
      if (cells.length > 1) {
        const segments = cells.flatMap(cell => splitInline(cell))
        push(segments.join(' '), segments, 'table', lineNo)
        return
      }
    }

    // 引用 / 列表：剥掉记号，余下按行内标记切分
    const body = line
      .replace(/^>+\s?/, '')
      .replace(/^([-*+]|\d+[.)])\s+/, '')
      .replace(/^\[[ xX]\]\s*/, '')

    const kind = line.startsWith('>') ? 'quote' : /^([-*+]|\d+[.)])\s+/.test(line) ? 'list' : 'text'
    const segments = splitInline(body)
    push(stripInline(body), segments, kind, lineNo)
  })

  return chunks
}

/** 文本前缀候选：整段/整行太长时，退而求其次地高亮开头一截 */
const PREFIX_LENGTHS = [40, 24, 16, 10, 6]

/**
 * 生成锚点候选（从优到劣），供 mark.js 顺序尝试
 *
 * 顺序：命中查询的句子 → 整行纯文本 → 其余纯文本块 → 整行前缀 → 查询词本身
 *
 * @param {{ text: string, segments: string[] }} chunk
 * @param {string} query - 用户输入的关键词
 * @returns {string[]}
 */
export function anchorCandidates(chunk, query) {
  const text = String(chunk?.text ?? '').trim()
  const segments = chunk?.segments ?? []
  const q = String(query ?? '').trim().toLowerCase()
  const out = []

  const push = value => {
    const item = String(value ?? '').trim()
    if (item.length >= 2 && !out.includes(item)) out.push(item)
  }

  const hits = []
  const rest = []

  for (const segment of segments) {
    const sentences = splitSentences(segment)
    for (const sentence of sentences) {
      const bucket = q && sentence.toLowerCase().includes(q) ? hits : rest
      bucket.push(sentence)
    }
  }

  hits.forEach(push)
  push(text)
  rest.forEach(push)
  PREFIX_LENGTHS.forEach(len => {
    if (text.length > len) push(text.slice(0, len))
  })
  push(query)

  return out.slice(0, 8)
}

/** 最佳锚点 —— 写进 URL 的那一个 */
export function pickAnchor(chunk, query) {
  return anchorCandidates(chunk, query)[0] ?? String(chunk?.text ?? '').trim()
}

/** 去掉首尾空行（节的第一行是标题、最后一行常是留给下一个标题的空行） */
function trimBlankLines(lines) {
  let start = 0
  let end = lines.length
  while (start < end && !lines[start].trim()) start += 1
  while (end > start && !lines[end - 1].trim()) end -= 1
  return lines.slice(start, end).join('\n')
}

/**
 * 取出一节 —— 合并文档（一篇 .md 里多节，多张牌/多条规则共用一篇）按节切给页面
 *
 * 从命中的标题行起，到下一个「同级或更高级」标题的前一行止；末节取到文末。
 * 标题按剥掉行内标记后的纯文本比对（与 parseMarkdownChunks 的 heading 同口径），
 * 既认 `## 趁火打劫` 也认 `## **趁火打劫**`。未命中返回空串，交给 MdViewer 的
 * emptyText 提示，不会静默画出一整篇。
 *
 * @param {string} raw - Markdown 原文
 * @param {string} heading - 节标题（如「趁火打劫」，不带 # 号）
 * @returns {string} 含标题行在内的该节原文，首尾空行已修剪
 */
export function extractMarkdownSection(raw, heading) {
  const target = stripInline(heading)
  if (!target) return ''

  const lines = String(raw ?? '').split(/\r?\n/)
  let start = -1
  let level = 0

  for (let i = 0; i < lines.length; i += 1) {
    const match = /^(#{1,6})\s+(.*)$/.exec(lines[i].trim())
    if (!match) continue

    // 开切之前：找标题；开切之后：遇到同级或更高级标题就收工
    if (start < 0) {
      if (stripInline(match[2]) === target) {
        start = i
        level = match[1].length
      }
      continue
    }

    if (match[1].length <= level) return trimBlankLines(lines.slice(start, i))
  }

  return start < 0 ? '' : trimBlankLines(lines.slice(start))
}
