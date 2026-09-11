<script setup>
/**
 * GlobalSearch —— 全局搜索蒙层
 *
 * 触发：控制台「搜索」控件 / 玉玺单击。
 * 收录菜单与文档（src/assets/md），汉字、全拼、首字母三路检索。
 *
 * 索引含拼音库与 Fuse，首次打开时才动态载入（见 ./engine.js）。
 */
import { nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'
import { useGlobalSearch } from '@/composables/useGlobalSearch'
import { useMessage } from '@/composables/useMessage'
import { requestHighlight } from '@/composables/useKeywordHighlight'
import ResultItem from './ResultItem.vue'
import searchIcon from '@/assets/icons/sou_suo.svg?raw'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const { isOpen, close } = useGlobalSearch()

const keyword = ref('')
const rows = ref([])
const ready = ref(false)
const inputRef = ref(null)

/** 索引实例（非响应式：只在 ready 时被读取） */
let engine = null
let enginePromise = null

function loadEngine() {
  enginePromise ??= import('./engine.js').then(module => module.getEngine())
  return enginePromise
}

/** 检索（本地索引，输入即出结果） */
function refresh() {
  if (!engine) return
  const query = keyword.value.trim()
  rows.value = query ? engine.search(query) : engine.defaults()
}

// ── 打开：重置关键词 → 聚焦输入框 → 首次打开时载入索引 ──
watch(isOpen, async open => {
  if (!open) return

  keyword.value = ''
  rows.value = []
  ready.value = false

  // 手势内聚焦：移动端软键盘认这一下
  await nextTick()
  inputRef.value?.focus()

  engine ??= await loadEngine()
  ready.value = true
  refresh()
})

// ── 输入即搜（本地索引，无需防抖） ──
watch(keyword, refresh)

/** 打开结果：菜单直接跳转，文档带上锚点让落地页滚动并高亮 */
function activate(row) {
  if (!row) return
  if (!row.route) {
    message.info('该文档暂未挂到任何菜单')
    return
  }

  close()
  if (row.type === 'menu') {
    router.push({ path: row.route })
    return
  }

  const target = {
    path: row.route,
    query: { keyword: row.anchor, q: keyword.value.trim() },
  }

  // 目标与当前地址一致（在文档页里又搜到同一条）时 router 不会再导航，
  // 直接请落地页按当前锚点重新滚动高亮一次
  if (router.resolve(target).fullPath === route.fullPath) {
    requestHighlight()
    return
  }

  router.push(target)
}

</script>

<template>
  <DialogRoot
    :open="isOpen"
    @update:open="value => !value && close()"
  >
    <DialogPortal>
      <DialogOverlay class="search-mask" />

      <DialogContent class="search-panel">
        <DialogTitle class="search-panel__sr">
          全局搜索
        </DialogTitle>

        <header class="search-bar">
          <div class="search-field">
            <span
              class="search-field__icon"
              v-html="searchIcon"
            />
            <input
              ref="inputRef"
              v-model="keyword"
              class="search-field__input"
              type="text"
              inputmode="search"
              autocomplete="off"
              placeholder="请输入汉字、拼音或拼音首字母"
              aria-label="搜索关键词"
            >
            <button
              class="search-field__cancel"
              type="button"
              @click="close"
            >
              取消
            </button>
          </div>
        </header>

        <div class="search-body">
          <p
            v-if="!ready"
            class="search-tip"
          >
            正在整理条目…
          </p>

          <template v-else-if="rows.length">
            <ResultItem
              v-for="row in rows"
              :key="row.id"
              :row="row"
              @select="activate"
            />
          </template>

          <p
            v-else
            class="search-tip"
          >
            无匹配结果
          </p>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped lang="less">
/* ================================================================
   GlobalSearch — 全屏搜索蒙层
   通体一张宣纸：搜索栏与结果区同底同面，中间不做任何分层
   ================================================================ */
.search-mask {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal-backdrop);
  background: var(--bg-overlay);
  /* 门户挂到 body，#app 的 touch-action 管不到；
     不声明的话移动端双击会被浏览器当成「双击缩放」，整屏被放大 */
  touch-action: manipulation;
}

.search-panel {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 50%;
  z-index: var(--z-modal);
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: var(--max-width);
  transform: translateX(-50%);
  background: var(--bg);
  box-shadow: var(--shadow-xl);
  overscroll-behavior: contain;
  touch-action: manipulation;

  &[data-state='open'] {
    animation: search-panel-in var(--duration-slow) var(--ease-enter) both;
  }

  &[data-state='closed'] {
    animation: search-panel-out var(--duration-fast) var(--ease-enter) both;
  }
}

@keyframes search-panel-in {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-2%);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes search-panel-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

/* 无障碍标题：只给读屏软件 */
.search-panel__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

/* ================================================================
   搜索栏 —— 玉玺上的圆角搜索框，左右等距居中，浮在宣纸上
   ================================================================ */
.search-bar {
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  padding: var(--space-3) var(--content-padding) var(--space-2);
  padding-top: calc(var(--safe-area-top) + var(--space-3));
}

.search-field {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: var(--border-thin) solid var(--border);
  border-radius: var(--radius-full);
  background: var(--bg-surface);
  box-shadow: var(--shadow-sm);
  transition:
    border-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
}

/* 聚焦时整条框泛金（设计系统 3.6：表单控件用 :focus-within 高亮容器） */
.search-field:focus-within {
  border-color: var(--accent-gold);
  box-shadow: var(--shadow-glow-gold);
}

.search-field__icon {
  display: flex;
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  color: var(--text-tertiary);

  :deep(svg) {
    width: 100%;
    height: 100%;
  }
}

.search-field__input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  /* 16px 起步：iOS 聚焦时不缩放页面 */
  font-size: var(--text-base);
  color: var(--text-primary);

  &::placeholder {
    color: var(--text-tertiary);
  }

  /* 去掉 type=search 的原生清除按钮（自绘交互更统一） */
  &::-webkit-search-cancel-button {
    display: none;
  }
}

.search-field__cancel {
  position: relative;
  flex-shrink: 0;
  padding: 0;
  font-size: var(--text-sm);
  color: var(--accent-gold-dark);
  cursor: pointer;
}

/* 文字按钮不撑高度，用伪元素把触控区补到 44px 以上（设计系统 3.8） */
.search-field__cancel::after {
  content: '';
  position: absolute;
  inset: -12px calc(-1 * var(--space-1));
}

/* ================================================================
   结果区
   ================================================================ */
.search-body {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: var(--space-1) var(--space-2)
    calc(var(--safe-area-bottom) + var(--space-6));
}

.search-tip {
  padding: var(--space-8) 0;
  font-size: var(--text-sm);
  color: var(--text-secondary);
  text-align: center;
}

/* ================================================================
   Reduced Motion
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .search-panel[data-state='open'],
  .search-panel[data-state='closed'] {
    animation: none;
  }
}
</style>
