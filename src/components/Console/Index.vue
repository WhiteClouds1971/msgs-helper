<script setup>
import { computed } from 'vue'
import { useConsole } from '@/composables/useConsole'
import Drawer from '@/components/ui/Drawer/Index.vue'
import { consoleItems } from './consoleItems'

const { isOpen, close } = useConsole()

/**
 * 布局区块定义 — 控制控制台的结构划分
 *
 * 扩展只需在此追加 { code, label }，Index.vue 模板自动渲染新 section。
 * code 与 consoleItems 中的 zone 字段对应。
 */
const zones = [
  { code: 'appearance', label: '外观' },
]

/** 按 zone 将条目分组，空 zone 不渲染 */
const itemsByZone = computed(() => {
  const map = {}
  for (const zone of zones) {
    const items = consoleItems.filter(item => item.zone === zone.code)
    if (items.length) {
      map[zone.code] = items
    }
  }
  return map
})

/** 过滤掉无数据条目的 zone，避免渲染空 section */
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
        <div class="console-zone__items">
          <component
            :is="item.component"
            v-for="item in itemsByZone[zone.code]"
            :key="item.id"
          />
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
   灵感：竹简上的独立篇章，以装饰线分隔
   ================================================================ */
.console-zone {
  /* 区块间用金色装饰线 + 节距分隔 */
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
   Console Zone Items — 控件容器
   只提供垂直堆叠 + 分隔线，不假设控件内部布局
   ================================================================ */
.console-zone__items {
  display: flex;
  flex-direction: column;

  > * + * {
    border-top: var(--border-thin) solid var(--border-light);
  }
}
</style>
