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
  const s = {}
  if (item.fullWidth) {
    s.gridColumn = '1 / -1'
    if (item.rowSpan > 1) {
      s.height = `calc(${item.rowSpan} * var(--unit-size) + ${(item.rowSpan - 1) * GAP_PX}px)`
    }
  } else {
    s.aspectRatio = '1'
  }
  return s
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
   N 列固定；全宽项高度自适应，方块项 aspect-ratio:1 保正方形
   ================================================================ */
.console-zone__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-2);
}

/* ================================================================
   Console Zone Cell — 控件容器
   用背景色 + 圆角区分每个控件的范围，grid gap 提供间距
   ================================================================ */
.console-zone__cell {
  min-width: 0;
  background: var(--bg);
  border-radius: var(--radius-sm);
  padding: var(--space-3);
}
</style>
