<script setup>
import { computed } from 'vue'

/**
 * SkillCard —— 单个三国杀技能的展示（无业务耦合的基础 UI 组件）
 *
 * 只管把「一个技能」画出来：技能名居中（毛笔字，字距舒展），下面接规则正文；
 * 技能标签（`types`，可选，可多个）加粗、以空格分隔后平铺在正文最前面，
 * 没有标签的技能就只显示正文。
 *
 * 不负责列表 —— 排列、间距、排序、左滑删除这些都由使用方在自己的页面里组织；
 * 本组件不自建外层容器语义（根元素是一个 div），卡片也就是一张「牌面」：
 * 自带底色/描边/圆角/阴影与 position: relative，便于被外层包在裁剪层之上。
 *
 * 供外部交互逻辑使用的稳定钩子：根元素带 `skill-card` 类（可用 class 透传再加自己的类）。
 */
const props = defineProps({
  /** 单个技能：{ name, types?, description } */
  skill: { type: Object, required: true },
})

/** 标签拼成一行：['锁定技','觉醒技'] → '锁定技 觉醒技' */
const types = computed(() =>
  Array.isArray(props.skill?.types) ? props.skill.types.filter(Boolean).join(' ') : '',
)
</script>

<template>
  <div class="skill-card">
    <span class="skill-card__name">{{ skill.name }}</span>

    <p class="skill-card__desc">
      <span
        v-if="types"
        class="skill-card__types"
      >{{ types }}</span>
      {{ skill.description }}
    </p>
  </div>
</template>

<style scoped lang="less">
.skill-card {
  position: relative;
  padding: var(--space-3) var(--space-4);
  background-color: var(--bg-surface);
  background-image: var(--card-lacquer-gradient);
  border: var(--border-thin) solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  /* 只列行为相关的两个属性：按下缩放 / 浮起描边的即时反馈；
     跟手期间由使用方把它改写成 none，免得位移被过渡拖住 */
  transition:
    transform var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out);
}

/* 技能名：居中，毛笔字 */
.skill-card__name {
  display: block;
  margin-bottom: var(--space-2);
  font-family: var(--font-display);
  font-size: var(--text-lg);
  line-height: 1.1;
  text-align: center;
  color: var(--text-primary);
}

/* 规则正文：技能标签（若有）平铺在正文最前面，不另起一行 */
.skill-card__desc {
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  color: var(--text-secondary);
}

/* 技能标签：加粗，与正文同字号同行 */
.skill-card__types {
  font-weight: var(--font-bold);
}
</style>
