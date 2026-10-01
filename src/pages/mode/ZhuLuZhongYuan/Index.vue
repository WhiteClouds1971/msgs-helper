<script setup>
import { ref } from 'vue'
import MdViewer from '@/ui/MdViewer/Index.vue'
import { usePageReady } from '@/composables/usePageReady'
import { useKeywordHighlight } from '@/composables/useKeywordHighlight'
// 正文随包发布：?raw 静态导入，无需请求、离线可用、改文件即热更
import zhuLuZhongYuanMd from '@/assets/md/zhu-lu-zhong-yuan.md?raw'

/**
 * 模式专属武将技能（本模式下须替换使用的武将）与斗地主同例：已整体并入「勘误 › 武将」，
 * 本页只在原处留一条跳转链接，武将卡与它那一节正文都归勘误页（src/assets/md/kan-wu.md）。
 *
 * 落点借全局搜索那套「落点身份」参数（keyword + section + hit）：勘误页据此滚到
 * 「武将」那一块并闪一下，不必为这一条链接另造一套锚点（见 useKeywordHighlight）。
 *
 * 域名动态替换：这里只记路径，href 由 router-link 在运行时按当前站点拼 ——
 * 换域名、换端口、换部署子路径都不用改代码，更不写死 localhost。
 */
const kanWuWuJiang = {
  path: '/tool/kan-wu',
  query: { keyword: '武将', section: '武将', hit: 0 },
}

// 空白布局页面：无装饰、无教学导览、无持久化数据
usePageReady()

// 全局搜索跳转落地：按 URL 上的 keyword 在正文里滚动并高亮
const pageRef = ref(null)
useKeywordHighlight(pageRef)
</script>

<template>
  <div
    ref="pageRef"
    class="mode-zhu-lu-zhong-yuan"
  >
    <MdViewer
      class="mode-zhu-lu-zhong-yuan__doc"
      :content="zhuLuZhongYuanMd"
    />

    <section class="mode-zhu-lu-zhong-yuan__section">
      <h2 class="mode-zhu-lu-zhong-yuan__section-title">
        模式专属武将技能
      </h2>

      <!-- 武将卡已移到勘误页：这里只留一条去路 -->
      <p class="mode-zhu-lu-zhong-yuan__link">
        本模式下须替换使用的武将，见
        <RouterLink
          class="mode-zhu-lu-zhong-yuan__link-a"
          :to="kanWuWuJiang"
        >
          勘误 · 武将
        </RouterLink>
      </p>
    </section>
  </div>
</template>

<style scoped lang="less">
.mode-zhu-lu-zhong-yuan {
  /* #app 是 overflow: hidden 的固定高度壳：滚动改由本页承担 */
  height: 100%;
  /* 页边距：左右 = --content-padding（设计系统页面左右留白）；
     上下 = --space-4（16px，标准 padding）叠加刘海屏 / 底部指示条安全区 */
  padding:
    calc(var(--safe-area-top) + var(--space-4))
    var(--content-padding)
    calc(var(--safe-area-bottom) + var(--space-4));
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

/* 正文限宽：桌面端不让汉字行宽过长（移动端本就窄，不生效） */
.mode-zhu-lu-zhong-yuan__doc {
  max-width: 34em;
  margin: 0 auto;
}

/* 模式专属武将技能：正文之后另起一块，与正文同一栏宽，居中不跑偏 */
.mode-zhu-lu-zhong-yuan__section {
  max-width: 34em;
  margin: var(--space-12) auto 0;
}

/* 模块标题沿用正文一级标题的排面（毛笔字 + 居中 + 编绳金线）：
   它与顶部的「逐鹿中原」同级，其下的去路走正文 */
.mode-zhu-lu-zhong-yuan__section-title {
  margin: 0 0 var(--space-6);
  font-family: var(--font-display);
  /* Ma Shan Zheng 只有 400，加粗只会得到伪粗体 */
  font-weight: var(--font-normal);
  font-size: var(--text-3xl);
  line-height: var(--leading-tight);
  text-align: center;
  text-wrap: var(--text-wrap-heading);
}

.mode-zhu-lu-zhong-yuan__section-title::after {
  content: '';
  display: block;
  width: 60%;
  height: var(--border-medium);
  margin: var(--space-4) auto 0;
  background: var(--decorative-line);
}

/* 去路：一句正文 + 一个链接，居中收在标题下面 */
.mode-zhu-lu-zhong-yuan__link {
  margin: 0;
  color: var(--text-secondary);
  text-align: center;
  text-wrap: var(--text-wrap-body);
}

/* 链接回到正文链接的样子（全局 reset 抹掉了下划线，此处按 MdViewer 同一套还原）：
   深金而非亮金 —— 亮金在 Light 模式下只有 3.0:1，承载不了文字 */
.mode-zhu-lu-zhong-yuan__link-a {
  color: var(--accent-gold-dark);
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: var(--transition-color);
}

.mode-zhu-lu-zhong-yuan__link-a:active {
  color: var(--text-primary);
}

.mode-zhu-lu-zhong-yuan__link-a:focus-visible {
  outline: 2px solid var(--accent-gold);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
</style>
