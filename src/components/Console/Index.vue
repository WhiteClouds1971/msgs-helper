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

/** 根据条目的布局属性计算 grid 放置样式 */
function cellStyle(item) {
  const style = {}
  if (item.fullWidth) {
    style.gridColumn = '1 / -1'
  }
  if (item.rowSpan && item.rowSpan > 1) {
    style.gridRow = `span ${item.rowSpan}`
  }
  return style
}

// ═══════════════════════════════════════════════════════════════════
// Zone 编排
// ═══════════════════════════════════════════════════════════════════

const zones = [
  { code: 'appearance', label: '外观' },
]

const itemsByZone = computed(() => {
  const map = {}
  for (const zone of zones) {
    const items = consoleItems.filter(item => item.zone === zone.code)
    if (items.length) map[zone.code] = items
  }
  return map
})

const visibleZones = computed(() =>
  zones.filter(z => itemsByZone.value[z.code]),
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
        v-for="zone in visibleZones"
        :key="zone.code"
        class="console-zone"
      >
        <h3 class="console-zone__title">{{ zone.label }}</h3>
        <div
          class="console-zone__grid"
          :ref="(el) => observeGrid(el)"
          :style="{ '--unit-size': unitSize }"
        >
          <div
            v-for="item in itemsByZone[zone.code]"
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

.console-zone__title {
  margin: 0 0 var(--space-2);
  font-family: var(--font-display);
  font-size: var(--text-lg);
  color: var(--text-primary);
  line-height: var(--leading-tight);
}

/* ================================================================
   Console Zone Grid — 单位方格网格
   N 列固定，单位尺寸由容器宽 / N 计算得出（正方形）
   ================================================================ */
.console-zone__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-2);
  grid-auto-rows: var(--unit-size);
}

/* ================================================================
   Console Zone Cell — 网格单元格
   每个控件包裹一层，兼作网格项 + 视觉容器
   ================================================================ */
.console-zone__cell {
  min-width: 0;
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  border: var(--border-thin) solid var(--border-light);
  /* 内边距由子组件自行决定，cell 只提供舞台 */
}
</style>
