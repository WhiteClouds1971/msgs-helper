/**
 * useKeywordHighlight — 跳转落地后的「滚动 + 高亮」
 *
 * 全局搜索的结果带 query 跳转：keyword = 命中整行/整句，q = 用户输入。
 * 本组合式函数在页面根元素内用 mark.js 逐条尝试候选锚点
 * （命中整句 → 整行 → 纯文本块 → 前缀 → 关键词），
 * 命中即平滑滚动到视野中央并闪一下，未命中则重试一次（等页面过渡结束）。
 *
 * 用法：
 *   const pageRef = ref(null)
 *   useKeywordHighlight(pageRef)
 */
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { anchorCandidates } from '@/utils/markdown'

/** 命中后「落点闪烁」的持续时长 */
const ACTIVE_MS = 1400

/** 高亮请求计数 —— 锚点没变（URL 相同）时，靠它让落地页重新定位一次 */
const highlightTick = ref(0)

/** 请求落地页重新执行一次「滚动 + 高亮」（搜索结果点击时调用） */
export function requestHighlight() {
  highlightTick.value += 1
}

/** mark.js 按需加载：只有真的落地到带锚点的页面才需要它 */
let markModule = null
function loadMark() {
  markModule ??= import('mark.js').then(module => module.default)
  return markModule
}

function prefersReducedMotion() {
  return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
}

/**
 * @param {import('vue').Ref<HTMLElement|null>} rootRef - 页面根元素（其滚动祖先由浏览器自行上溯）
 * @param {{ className?: string, retryDelay?: number }} [options]
 */
export function useKeywordHighlight(rootRef, options = {}) {
  const { className = 'md-hit', retryDelay = 240 } = options
  const route = useRoute()

  let retryTimer = null
  let activeTimer = null

  /** 滚动到命中处并闪烁提示 */
  function reveal(hit) {
    hit.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'center',
    })
    hit.classList.add(`${className}--active`)
    clearTimeout(activeTimer)
    activeTimer = setTimeout(() => {
      hit.classList.remove(`${className}--active`)
    }, ACTIVE_MS)
  }

  /** 依次尝试候选锚点，命中即止 */
  async function highlight(root, candidates, onDone) {
    const Mark = await loadMark()
    const instance = new Mark(root)
    let cursor = 0

    const step = () => {
      if (cursor >= candidates.length) {
        onDone(false)
        return
      }

      const anchor = candidates[cursor++]
      instance.unmark({
        done: () => {
          instance.mark([anchor], {
            separateWordSearch: false,
            caseSensitive: false,
            className,
            done: () => {
              const hit = root.querySelector(`mark.${className}`)
              if (hit) {
                reveal(hit)
                onDone(true)
              } else {
                step()
              }
            },
          })
        },
      })
    }

    step()
  }

  function run(attempt = 0) {
    clearTimeout(retryTimer)

    const anchor = String(route.query.keyword ?? '')
    if (!anchor) return

    const candidates = anchorCandidates(
      { text: anchor, segments: [anchor] },
      route.query.q ?? '',
    )

    // immediate 的 watch 在 setup 阶段就触发，此刻模板 ref 尚未绑定，必须等一帧
    nextTick(() => {
      const root = rootRef.value

      // 首次未就绪/未命中：页面过渡、字体加载都可能还没结束，稍后重来一次
      const retry = () => {
        if (attempt === 0) retryTimer = setTimeout(() => run(1), retryDelay)
      }

      if (!root) {
        retry()
        return
      }

      highlight(root, candidates, found => {
        if (!found) retry()
      })
    })
  }

  // 拼成字符串比较，避免数组每次新建导致无关路由变化也重跑
  watch(
    () =>
      `${route.query.keyword ?? ''}\u0000${route.query.q ?? ''}\u0000${highlightTick.value}`,
    () => run(0),
    { immediate: true },
  )

  onBeforeUnmount(() => {
    clearTimeout(retryTimer)
    clearTimeout(activeTimer)
  })
}
