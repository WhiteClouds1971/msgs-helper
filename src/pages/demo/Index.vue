<script setup>
import { ref } from 'vue'
import { usePageReady } from '@/composables/usePageReady'
import { DrawerTrigger, DrawerClose } from 'reka-ui'
import Drawer from '@/components/ui/Drawer/Index.vue'

usePageReady()

const openBasic = ref(false)
const openScroll = ref(false)
const openActions = ref(false)
</script>

<template>
  <div class="demo-page">
    <div class="demo-card">
      <h1 class="demo-title">Drawer 组件 Demo</h1>
      <p class="demo-desc">墨韵金章 · 漆盒意象</p>

      <div class="demo-actions">
        <!-- 基础抽屉 -->
        <Drawer v-model:open="openBasic" title="规则说明" description="面杀基础规则 v3.0">
          <template #trigger>
            <DrawerTrigger class="demo-btn demo-btn--gold">
              基础抽屉
            </DrawerTrigger>
          </template>

          <div class="demo-content">
            <p>欢迎使用面杀辅助工具。本工具基于三国杀身份局规则设计，支持标准身份场、国战场、以及部分扩展玩法。</p>
            <p>核心机制包括：回合制出牌阶段、判定区与延时锦囊、装备区武器防具、武将技能触发时机队列。</p>
            <p>更多详细规则请参考游戏内帮助文档。</p>
          </div>
        </Drawer>

        <!-- 长内容可滚动抽屉 -->
        <Drawer v-model:open="openScroll" title="武将列传" description="建安二十二年 · 曹操">
          <template #trigger>
            <DrawerTrigger class="demo-btn demo-btn--gold">
              长内容滚动
            </DrawerTrigger>
          </template>

          <div class="demo-content">
            <p v-for="i in 8" :key="i">
              曹操（155年－220年），字孟德，沛国谯县人。东汉末年著名政治家、军事家、文学家、书法家。
              三国中曹魏政权的奠基人。在位期间，实行屯田制，兴修水利，奖励农桑，安置流民，重视教育，
              使北方社会秩序得以重建。文学方面，曹操与曹丕、曹植合称"三曹"，其诗作气韵沉雄、慷慨悲凉。
            </p>
          </div>
        </Drawer>

        <!-- 带底部操作按钮的抽屉 -->
        <Drawer v-model:open="openActions" title="确认操作" description="此操作不可撤销">
          <template #trigger>
            <DrawerTrigger class="demo-btn demo-btn--red">
              带操作区
            </DrawerTrigger>
          </template>

          <div class="demo-content">
            <p>你确定要弃置手牌中的【桃】吗？</p>
            <p>弃置后将无法在当前回合内回复体力。</p>
          </div>

          <template #footer>
            <DrawerClose class="demo-btn demo-btn--ghost">
              取消
            </DrawerClose>
            <DrawerClose class="demo-btn demo-btn--red-solid">
              确认弃置
            </DrawerClose>
          </template>
        </Drawer>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.demo-page {
  width: 100vw;
  min-height: 100dvh;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
}

.demo-card {
  width: 100%;
  max-width: var(--max-width);
  text-align: center;
}

.demo-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--text-4xl);
  color: var(--text-primary);
  line-height: var(--leading-tight);
}

.demo-desc {
  margin: var(--space-2) 0 var(--space-8);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.demo-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  align-items: stretch;
}

/* ── 按钮变体 ── */
.demo-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: var(--space-3) var(--space-6);
  border: none;
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition:
    transform var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);

  &:active {
    transform: scale(0.97);
  }
}

.demo-btn--gold {
  background: var(--accent-gold-dark);
  color: var(--text-inverse);

  &:active {
    box-shadow: var(--shadow-glow-gold);
  }
}

.demo-btn--red {
  background: transparent;
  color: var(--accent-red);
  border: var(--border-thin) solid var(--accent-red);

  &:active {
    background: var(--accent-red-bg);
  }
}

.demo-btn--red-solid {
  background: var(--accent-red);
  color: var(--text-inverse);

  &:active {
    box-shadow: var(--shadow-glow-red);
  }
}

.demo-btn--ghost {
  background: transparent;
  color: var(--text-secondary);
  border: var(--border-thin) solid var(--border);

  &:active {
    background: var(--bg-surface-hover);
  }
}

/* ── 抽屉内正文 ── */
.demo-content {
  p {
    margin: 0 0 var(--space-3);
    font-size: var(--text-base);
    color: var(--text-secondary);
    line-height: var(--leading-relaxed);
    text-align: left;
    text-indent: 2em;

    &:last-child {
      margin-bottom: 0;
    }
  }
}
</style>
