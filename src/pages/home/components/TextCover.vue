<script setup>
/**
 * TextCover — 文字封面
 *
 * 给没有图片资源的菜单当卡片封面：版式与加载占位组件一致
 * （主标题 → 编绳装饰线 → 副标题），但去掉玉玺与描边动画，
 * 底色直接取菜单主题色。
 *
 * 用法：menus.js 条目写
 *   cover: { title: '村规', subtitle: '入乡随俗 众议成规' }
 * 标题、副标题均可用 CSS 容器宽度自适应缩放，无需传尺寸。
 */
defineProps({
  /** 主标题（毛笔字，占加载组件里玉玺的位置） */
  title: { type: String, required: true },
  /** 副标题（可空；为空则只显示主标题） */
  subtitle: { type: String, default: '' },
  /** 底色 —— 传菜单的 themeColor，与卡片标签同色 */
  color: { type: String, default: '' },
})
</script>

<template>
  <div
    class="text-cover"
    :style="color ? { '--cover-color': color } : undefined"
  >
    <p class="text-cover__title">
      {{ title }}
    </p>

    <template v-if="subtitle">
      <div class="text-cover__line decorative-line--knotted" />
      <p class="text-cover__subtitle">
        {{ subtitle }}
      </p>
    </template>
  </div>
</template>

<style scoped lang="less">
.text-cover {
  /* 底色恒为菜单主题色（深底），故字色不能随主题翻转 —— 固定用宣纸暖白 */
  --cover-ink: #faf6f0;
  /* 装饰线 / 编绳节点改宣纸白：金线落在主题色底上会发灰 */
  --decorative-line: linear-gradient(
    90deg,
    transparent 0%,
    rgba(250, 246, 240, 0.85) 50%,
    transparent 100%
  );
  --accent-gold: rgba(250, 246, 240, 0.85);

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  width: 100%;
  height: 100%;
  padding: var(--space-6) 10%;
  overflow: hidden;
  /* 底色 = 主题色，叠一层上浅下深做纵深 */
  background-color: var(--cover-color, var(--accent-gold));
  background-image: linear-gradient(
    165deg,
    rgba(250, 246, 240, 0.08) 0%,
    rgba(0, 0, 0, 0.28) 100%
  );
  /* 字号按封面自身宽度缩放：卡片多宽，字就多大 */
  container-type: inline-size;
}

.text-cover__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 3rem; /* 不支持容器查询单位时的兜底 */
  font-size: clamp(2.5rem, 28cqw, 6rem);
  line-height: 1.1;
  letter-spacing: 0.04em;
  text-align: center;
  text-wrap: balance;
  color: var(--cover-ink);
  user-select: none;
}

.text-cover__line {
  width: min(140px, 45%);
  height: var(--border-medium);
  opacity: 0.75;
}

.text-cover__subtitle {
  margin: 0;
  font-family: var(--font-display);
  font-size: 0.875rem; /* 兜底 */
  font-size: clamp(0.875rem, 4.5cqw, 1.25rem);
  letter-spacing: 0.28em;
  text-indent: 0.28em; /* 抵掉末字右侧字距，视觉居中 */
  text-align: center;
  color: rgba(250, 246, 240, 0.72);
  user-select: none;
}
</style>
