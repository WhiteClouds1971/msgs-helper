<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { marked } from 'marked'

/**
 * MdViewer —— Markdown 内容展示（无业务耦合的基础 UI 组件）
 *
 * 两种送内容的方式，二选一：
 *   · content —— 直接给 Markdown 原文（推荐 \`?raw\` 静态导入：随包发布、无需请求、离线可用）
 *   · src     —— 给 Markdown 文件地址，组件自行 fetch（内容可脱离构建单独更新）
 * content 非空时优先，且不会发起请求。
 *
 * 只负责"把 Markdown 画出来"：不自建滚动容器（滚动交给页面），
 * 不带标题栏/操作栏 —— 需要什么由调用方在外面套。
 *
 * 渲染结果经 v-html 注入，只喂可信来源（本项目仓库内的 .md 文件），不要传用户输入。
 */
const props = defineProps({
  /** Markdown 原文；非空时优先于 src */
  content: { type: String, default: '' },
  /** Markdown 文件地址（同源路径） */
  src: { type: String, default: '' },
  /** 加载中提示 */
  loadingText: { type: String, default: '加载中…' },
  /** 内容为空提示 */
  emptyText: { type: String, default: '暂无内容' },
  /** 加载失败提示 */
  errorText: { type: String, default: '内容加载失败' },
})

/** 请求回来的原文（仅 src 模式用得上） */
const fetched = ref('')
/** idle | loading | ready | error */
const status = ref('idle')

/** 用 content 时不算请求，只有 src 模式才看 fetched */
const source = computed(() => (props.content ? props.content : fetched.value))
const isEmpty = computed(() => source.value.trim() === '')

/** Markdown → HTML（marked 同步返回；breaks: 单换行即换行，更贴合手写村规） */
const html = computed(() => marked.parse(source.value, { gfm: true, breaks: true }))

/**
 * 取数代际：换 src 时中断上一次请求，慢响应不会覆盖后发的内容
 */
let controller = null

async function load() {
  controller?.abort()
  controller = null
  fetched.value = ''

  if (props.content || !props.src) {
    status.value = 'idle'
    return
  }

  const current = new AbortController()
  controller = current
  status.value = 'loading'

  try {
    const res = await fetch(props.src, { signal: current.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const text = await res.text()
    if (current.signal.aborted) return
    fetched.value = text
    status.value = 'ready'
  } catch (err) {
    if (current.signal.aborted) return
    console.error('[MdViewer] 内容加载失败：', err)
    status.value = 'error'
  }
}

watch(() => [props.content, props.src], load, { immediate: true })

onBeforeUnmount(() => {
  controller?.abort()
  controller = null
})
</script>

<template>
  <div class="md-viewer">
    <p
      v-if="status === 'loading'"
      class="md-viewer__hint"
    >
      {{ loadingText }}
    </p>

    <p
      v-else-if="status === 'error'"
      class="md-viewer__hint md-viewer__hint--error"
    >
      {{ errorText }}
    </p>

    <p
      v-else-if="isEmpty"
      class="md-viewer__hint"
    >
      {{ emptyText }}
    </p>

    <!-- eslint-disable vue/no-v-html -- 只渲染仓库内可信的 .md 文件 -->
    <article
      v-else
      class="md-viewer__body"
      v-html="html"
    />
    <!-- eslint-enable vue/no-v-html -->
  </div>
</template>

<style scoped lang="less">
/* ================================================================
   MdViewer —— Markdown 内容展示
   形态：h1/h2 用毛笔体（Design System 2.2 限定），正文用系统字体；
        列表记号、引用线、分隔线一律古铜金，延续「墨韵金章」母题。
   注意：全局 reset 抹掉了 list-style 与链接下划线，此处按需还原。
   ================================================================ */

.md-viewer {
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
  /* 长链接 / 长英文词不撑破容器 */
  overflow-wrap: break-word;
}

/* ---------------- 加载 / 失败 / 空态 ---------------- */
.md-viewer__hint {
  margin: 0;
  padding: var(--space-8) 0;
  /* 淡墨而非更淡墨：空态是用户要读的信息，不是纯装饰 */
  color: var(--text-secondary);
  font-size: var(--text-sm);
  text-align: center;
}

.md-viewer__hint--error {
  color: var(--accent-red);
}

/* ---------------- 正文（v-html 注入，样式需 :deep 穿透） ---------------- */
.md-viewer__body {
  /* 首元素不留上边距 —— 间距由页面负责 */
  :deep(> :first-child) {
    margin-top: 0;
  }

  /* --- 标题 --- */
  :deep(h1) {
    margin: 0 0 var(--space-6);
    font-family: var(--font-display);
    /* Ma Shan Zheng 只有 400，加粗只会得到伪粗体 */
    font-weight: var(--font-normal);
    font-size: var(--text-3xl);
    line-height: var(--leading-tight);
    text-align: center;
    text-wrap: var(--text-wrap-heading);
  }

  /* 大标题下的编绳金线 —— 竹简起首 */
  :deep(h1)::after {
    content: '';
    display: block;
    width: 60%;
    height: var(--border-medium);
    margin: var(--space-4) auto 0;
    background: var(--decorative-line);
  }

  :deep(h2) {
    margin: var(--space-8) 0 var(--space-3);
    padding-left: var(--space-3);
    border-left: var(--border-medium) solid var(--accent-gold);
    font-family: var(--font-display);
    font-weight: var(--font-normal);
    font-size: var(--text-2xl);
    line-height: var(--leading-tight);
    text-wrap: var(--text-wrap-heading);
  }

  :deep(h3) {
    margin: var(--space-6) 0 var(--space-2);
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    line-height: var(--leading-tight);
  }

  :deep(h4),
  :deep(h5),
  :deep(h6) {
    margin: var(--space-4) 0 var(--space-2);
    font-size: var(--text-base);
    font-weight: var(--font-medium);
    color: var(--text-secondary);
  }

  /* --- 正文段落 --- */
  :deep(p) {
    margin: 0 0 var(--space-3);
    text-wrap: var(--text-wrap-body);
  }

  /* --- 列表（全局 reset 抹掉了 list-style，此处还原） --- */
  :deep(ul),
  :deep(ol) {
    margin: 0 0 var(--space-3);
    padding-left: var(--space-6);
  }

  :deep(ul) {
    list-style: disc;
  }

  :deep(ol) {
    list-style: decimal;
  }

  :deep(ul ul),
  :deep(ol ul) {
    list-style: circle;
  }

  :deep(li) {
    margin-bottom: var(--space-1);
  }

  /* 记号染色 —— 深金不抢正文，且两种主题下都够对比度（亮金 Light 仅 3.0:1） */
  :deep(li)::marker {
    color: var(--accent-gold-dark);
  }

  /* 紧凑列表：段落紧跟记号时不再多一层下边距 */
  :deep(li > p) {
    margin-bottom: var(--space-1);
  }

  /* GFM 任务列表：复选框自己就是记号 */
  :deep(li:has(> input[type='checkbox'])) {
    margin-left: calc(-1 * var(--space-6));
    list-style: none;
  }

  :deep(li > input[type='checkbox']) {
    margin-right: var(--space-2);
    accent-color: var(--accent-gold);
  }

  /* --- 引用：金线压边的注记 --- */
  :deep(blockquote) {
    margin: 0 0 var(--space-3);
    padding: var(--space-3) var(--space-4);
    background: var(--accent-gold-bg);
    border-left: var(--border-medium) solid var(--accent-gold);
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
    /* 金色浅底会削掉一层对比度，正文沿用 --text-primary 才守得住 AA */
    color: var(--text-primary);
  }

  :deep(blockquote) > :last-child {
    margin-bottom: 0;
  }

  /* --- 代码 --- */
  :deep(code) {
    padding: 2px var(--space-1);
    background: var(--bg-surface-hover);
    border-radius: var(--radius-sm);
    font-family: var(--font-mono);
    font-size: 0.9em;
  }

  :deep(pre) {
    margin: 0 0 var(--space-3);
    padding: var(--space-4);
    background: var(--bg-surface-hover);
    border: var(--border-thin) solid var(--border);
    border-radius: var(--radius-md);
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  :deep(pre code) {
    padding: 0;
    background: none;
    font-size: var(--text-sm);
    line-height: var(--leading-normal);
  }

  /* --- 表格：窄屏放不下时自行横向滚动，不撑破页面 --- */
  :deep(table) {
    display: block;
    width: 100%;
    margin: 0 0 var(--space-3);
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    font-size: var(--text-sm);
  }

  :deep(th),
  :deep(td) {
    padding: var(--space-2) var(--space-3);
    border-bottom: var(--border-thin) solid var(--border);
    text-align: left;
    vertical-align: top;
  }

  :deep(th) {
    background: var(--accent-gold-bg);
    /* 金色留给底色与下缘金线：金色文字在两种主题下都到不了 AA */
    border-bottom-color: var(--accent-gold);
    color: var(--text-primary);
    font-weight: var(--font-medium);
    white-space: nowrap;
  }

  :deep(tr:last-child td) {
    border-bottom: none;
  }

  /* --- 图片：铺满容器宽度、等比缩放，与 ImageGallery 同一规则 --- */
  :deep(img) {
    width: 100%;
    height: auto;
    margin: var(--space-3) 0;
    border-radius: var(--radius-md);
  }

  /* --- 链接 --- */
  :deep(a) {
    color: var(--accent-gold-dark);
    text-decoration: underline;
    text-underline-offset: 2px;
    transition: var(--transition-color);
  }

  /* 按下即入墨 —— 亮金在 Light 仅 3.0:1，不能承载文字 */
  :deep(a):active {
    color: var(--text-primary);
  }

  /* --- 强调 / 删除线 --- */
  :deep(strong) {
    font-weight: var(--font-semibold);
  }

  :deep(del) {
    /* 划掉不等于可以不读：仍守 AA，靠删除线表达"作废" */
    color: var(--text-secondary);
  }

  /* --- 分隔线：竹简编绳 --- */
  :deep(hr) {
    height: var(--border-medium);
    margin: var(--space-6) 0;
    border: none;
    background: var(--decorative-line);
  }
}
</style>
