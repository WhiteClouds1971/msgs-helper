<script setup>
import { computed, ref, onUnmounted } from 'vue'
import { useConsole } from '@/composables/useConsole'
import Drawer from '@/components/ui/Drawer/Index.vue'
import { consoleItems } from '@/constants/consoleItems'

const { isOpen, close } = useConsole()

// ═══════════════════════════════════════════════════════════════════
// Grid 布局参数
// 单位方格 = 正方形，边长 = 容器宽度 / COLS
// ═══════════════════════════════════════════════════════════════════
const COLS = 4
const GAP_PX = 8 // var(--space-2)

const unitSize = ref('80px')
let observers = []

function calcUnitSize(el) {
  const width = el.clientWidth
  if (!width) return null
  const colW = (width - GAP_PX * (COLS - 1)) / COLS
  return `${colW}px`
}

function observeGrid(el) {
  if (!el) return
  const size = calcUnitSize(el)
  if (size) unitSize.value = size
  const obs = new ResizeObserver(([entry]) => {
    const s = calcUnitSize(entry.target)
    if (s) unitSize.value = s
  })
  obs.observe(el)
  observers.push(obs)
}

onUnmounted(() => observers.forEach(o => o.disconnect()))

/** 根据条目的 colSpan / rowSpan 计算 grid 放置样式 */
function cellStyle(item) {
  const s = {}
  const span = item.colSpan || COLS
  s.gridColumn = span >= COLS ? '1 / -1' : `span ${span}`

  if (item.rowSpan > 1) {
    s.gridRow = `span ${item.rowSpan}`
    s.height = `calc(${item.rowSpan} * var(--unit-size) + ${(item.rowSpan - 1) * GAP_PX}px)`
  }

  return s
}

// ═══════════════════════════════════════════════════════════════════
// Zone 编排
// ═══════════════════════════════════════════════════════════════════

const zoneCodes = ['features']

const itemsByZone = computed(() => {
  const map = {}
  for (const code of zoneCodes) {
    const items = consoleItems.filter(item => item.zone === code)
    if (items.length) map[code] = items
  }
  return map
})

const visibleZones = computed(() =>
  zoneCodes.filter(c => itemsByZone.value[c]),
)
</script>

<template>
  <Drawer
    :open="isOpen"
    title="尚书台"
    description="经纬天下 · 纲纪四方"
    height="50dvh"
    @update:open="close"
  >
    <div class="console-body">
      <section
        v-for="code in visibleZones"
        :key="code"
        class="console-zone"
      >
        <div
          class="console-zone__grid"
          :ref="(el) => observeGrid(el)"
          :style="{ '--unit-size': unitSize }"
        >
          <div
            v-for="item in itemsByZone[code]"
            :key="item.id"
            class="console-zone__cell"
            :style="cellStyle(item)"
          >
            <component :is="item.component" />
          </div>
        </div>
      </section>
    </div>
  </Drawer>
</template>

<style scoped lang="less">
/* ================================================================
   Console Body — 内容容器
   ================================================================ */
.console-body {
  /* 延续 Drawer 的 .drawer-body 内边距体系 */
}

/* ================================================================
   Console Zone — 功能区块
   ================================================================ */
.console-zone {
  &:not(:first-child) {
    margin-top: var(--space-4);
    padding-top: var(--space-3);
    border-top: var(--border-thin) solid var(--border-light);
  }
}

/* ================================================================
   Console Zone Grid — 单位方格网格
   N 列固定；全宽项高度自适应，方块项 aspect-ratio:1 保正方形
   ================================================================ */
.console-zone__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-2);
}

/* ================================================================
   Console Zone Cell — 控件容器
   磨砂托盘：半透明底色 + 大圆角 + ::before 承载模糊
   模糊放伪元素避免 backdrop-filter 在 grid item 上建层叠上下文偏移
   shadow-md 投影 + ::after 顶边高光线 强化立体感
   ================================================================ */
.console-zone__cell {
  min-width: 0;
  position: relative;
  border-radius: var(--radius-lg);
  padding: var(--space-3);
  isolation: isolate;
  box-shadow: var(--shadow-md);
}

.console-zone__cell::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: color-mix(in srgb, var(--bg) 80%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: -1;
}

/* 顶边高光 — 模拟光线掠过磨砂玻璃表面 */
.console-zone__cell::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25);
  pointer-events: none;
}
</style>
