<script setup>
import { ref } from 'vue'
import Tooltip from '@/components/ui/Tooltip/Index.vue'
import { usePageReady } from '@/composables/usePageReady'

usePageReady()

const controlledOpen = ref(false)
</script>

<template>
  <div class="demo-page">
    <div class="demo-heading-row">
      <h2 class="demo-heading">Tooltip 组件测试</h2>
    </div>

    <!-- ================================================================
         基础用法
         ================================================================ -->
    <section class="demo-section">
      <h3 class="section-title">基础用法（content prop）</h3>
      <div class="demo-row">
        <Tooltip content="这是悬停提示文字">
          <button class="demo-btn">悬停查看</button>
        </Tooltip>
        <Tooltip content="无箭头提示" :arrow="false">
          <button class="demo-btn demo-btn--ghost">无箭头</button>
        </Tooltip>
        <Tooltip content="即时打开，无延迟" :delay-duration="0">
          <button class="demo-btn demo-btn--ghost">即时打开</button>
        </Tooltip>
        <Tooltip content="这个提示已被禁用" disabled>
          <button class="demo-btn demo-btn--ghost">禁用状态</button>
        </Tooltip>
      </div>
    </section>

    <!-- ================================================================
         弹出方向
         ================================================================ -->
    <section class="demo-section">
      <h3 class="section-title">弹出方向</h3>
      <div class="demo-direction-grid">
        <Tooltip side="top" content="上方弹出（默认）">
          <button class="demo-btn">上 ↑</button>
        </Tooltip>
        <Tooltip side="bottom" content="下方弹出">
          <button class="demo-btn">下 ↓</button>
        </Tooltip>
        <Tooltip side="left" content="左侧弹出">
          <button class="demo-btn">左 ←</button>
        </Tooltip>
        <Tooltip side="right" content="右侧弹出">
          <button class="demo-btn">右 →</button>
        </Tooltip>
      </div>
    </section>

    <!-- ================================================================
         对齐方式
         ================================================================ -->
    <section class="demo-section">
      <h3 class="section-title">对齐方式（align）</h3>
      <div class="demo-row">
        <Tooltip side="bottom" align="start" content="左对齐（start）">
          <button class="demo-btn demo-btn--wide">Start</button>
        </Tooltip>
        <Tooltip side="bottom" align="center" content="居中对齐（center，默认）">
          <button class="demo-btn demo-btn--wide">Center</button>
        </Tooltip>
        <Tooltip side="bottom" align="end" content="右对齐（end）">
          <button class="demo-btn demo-btn--wide">End</button>
        </Tooltip>
      </div>
    </section>

    <!-- ================================================================
         自定义内容插槽
         ================================================================ -->
    <section class="demo-section">
      <h3 class="section-title">自定义内容（slot）</h3>
      <div class="demo-row">
        <Tooltip side="bottom">
          <button class="demo-btn">身份查看</button>
          <template #content>
            <div class="custom-tip">
              <span class="seal-label seal-label--gold">主公</span>
              <span>刘备 · 体力 4/4</span>
            </div>
          </template>
        </Tooltip>
        <Tooltip side="bottom">
          <button class="demo-btn demo-btn--ghost">长文本</button>
          <template #content>
            <span>夫君子之行，静以修身，俭以养德。非淡泊无以明志，非宁静无以致远。</span>
          </template>
        </Tooltip>
      </div>
    </section>

    <!-- ================================================================
         受控模式
         ================================================================ -->
    <section class="demo-section">
      <h3 class="section-title">受控模式（v-model:open）</h3>
      <div class="demo-row">
        <Tooltip
          :open="controlledOpen"
          content="受 JS 控制的提示"
          side="bottom"
          @update:open="controlledOpen = $event"
        >
          <button class="demo-btn">
            {{ controlledOpen ? '已打开' : '已关闭' }}
          </button>
        </Tooltip>
        <button class="demo-btn demo-btn--ghost" @click="controlledOpen = !controlledOpen">
          手动切换 (Toggle)
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped lang="less">
/* ================================================================
   Demo 页面布局
   ================================================================ */
.demo-page {
  width: 100%;
  max-width: 720px;
  min-height: 100dvh;
  margin: 0 auto;
  background: var(--bg);
  padding: var(--space-8) var(--content-padding) var(--space-12);
}

.demo-heading-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}

.demo-heading {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  color: var(--text-primary);
  text-align: center;
  margin: 0;
}

.demo-section {
  margin-bottom: var(--space-8);
}

.section-title {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  margin: 0 0 var(--space-3);
  padding-left: var(--space-2);
  border-left: 2px solid var(--accent-gold);
}

/* ================================================================
   按钮行 / 网格
   ================================================================ */
.demo-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
}

.demo-direction-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
  max-width: 320px;

  > :first-child {
    grid-column: 2;
  }
}

/* ================================================================
   演示按钮（符合设计系统的触控按钮）
   ================================================================ */
.demo-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: var(--space-2) var(--space-4);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--text-inverse);
  background: var(--accent-gold-dark);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  transition:
    transform var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);

  &:active {
    transform: scale(0.97);
    box-shadow: var(--shadow-glow-gold);
  }

  &--ghost {
    background: transparent;
    color: var(--accent-gold);
    border: var(--border-thin) solid var(--accent-gold);

    &:active {
      background: var(--accent-gold-bg);
    }
  }

  &--wide {
    min-width: 120px;
  }
}

/* ================================================================
   自定义 tooltip 内容样式
   ================================================================ */
.custom-tip {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  white-space: nowrap;
}

.seal-label {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  font-family: var(--font-display);
  font-size: var(--text-xs);
  border: 2px solid var(--accent-red);
  color: var(--accent-red);
  border-radius: var(--radius-sm);
  transform: rotate(-2deg);
  line-height: 1.4;

  &--gold {
    border-color: var(--accent-gold);
    color: var(--accent-gold);
  }
}
</style>
