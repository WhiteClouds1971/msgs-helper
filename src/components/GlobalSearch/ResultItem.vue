<script setup>
/**
 * ResultItem —— 全局搜索的一条结果
 *
 * 两类形态：
 *   · 菜单 —— 分类标签 + 名称 + 标签（点击跳菜单）
 *   · 文档 —— 所属菜单 + 所在章节 + 命中片段（点击跳页面并高亮定位）
 */
defineProps({
  /** 结果行数据（由 engine.js 的 toRow 产出） */
  row: { type: Object, required: true },
})

const emit = defineEmits(['select'])
</script>

<template>
  <button
    type="button"
    class="search-row"
    :class="{ 'search-row--disabled': row.disabled }"
    @click="emit('select', row)"
  >
    <span
      class="search-row__type"
      :class="`search-row__type--${row.type}`"
    >{{ row.typeName }}</span>

    <span class="search-row__main">
      <span class="search-row__head">
        <span class="search-row__title">{{ row.title }}</span>
        <span
          v-if="row.crumb"
          class="search-row__crumb"
        >{{ row.crumb }}</span>
        <span
          v-for="tag in row.tags"
          :key="tag"
          class="search-row__tag"
        >{{ tag }}</span>
      </span>

      <!-- eslint-disable vue/no-v-html -- 片段由 utils/search 转义后再拼 <mark> -->
      <span
        v-if="row.snippet"
        class="search-row__snippet"
        v-html="row.snippet"
      />
      <!-- eslint-enable vue/no-v-html -->
    </span>
  </button>
</template>

<style scoped lang="less">
/* ================================================================
   SearchRow — 一条结果
   左侧类型印记（菜单古铜金 / 文档朱砂红），右侧标题与命中片段
   ================================================================ */
.search-row {
  display: flex;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-3) var(--space-3);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-primary);
  text-align: left;
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-out);
}

/* 指针悬停/按下反馈（不做常驻选中态） */
@media (hover: hover) {
  .search-row:hover {
    background: var(--bg-surface-hover);
  }
}

.search-row:active {
  background: var(--bg-surface-hover);
}

/* ---------------- 类型印记 ---------------- */
.search-row__type {
  flex-shrink: 0;
  align-self: flex-start;
  margin-top: 2px;
  padding: 0 var(--space-1);
  border: var(--border-thin) solid currentColor;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  line-height: 1.5;
  white-space: nowrap;
  color: var(--accent-gold-dark);
}

.search-row__type--doc {
  color: var(--accent-red);
}

/* ---------------- 主区 ---------------- */
.search-row__main {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
  flex: 1;
}

.search-row__head {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  min-width: 0;
}

.search-row__title {
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-row__crumb {
  flex-shrink: 0;
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  white-space: nowrap;
}

.search-row__crumb::before {
  content: '·';
  margin-right: var(--space-1);
}

.search-row__tag {
  flex-shrink: 0;
  padding: 0 var(--space-1);
  border-radius: var(--radius-sm);
  background: var(--accent-gold-bg);
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

/* ---------------- 命中片段 ---------------- */
.search-row__snippet {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  color: var(--text-secondary);
  overflow-wrap: anywhere;
}

.search-row__snippet :deep(mark) {
  padding: 0 2px;
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--accent-gold) 32%, transparent);
  color: var(--text-primary);
  font-weight: var(--font-medium);
}

/* ---------------- 未挂到菜单的文档 ---------------- */
.search-row--disabled {
  cursor: default;
  opacity: 0.55;
}
</style>
