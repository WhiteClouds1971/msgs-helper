<script setup>
import { usePageReady } from '@/composables/usePageReady'

// 自动模式：页面无图片，即刻解除 Splash
usePageReady()
</script>

<template>
  <div class="not-found">
    <span class="not-found__seal seal-stamp">未寻得</span>

    <h1 class="not-found__title">
      此间无物
    </h1>

    <p class="not-found__verse">
      曲径通幽处，禅房花木深
    </p>

    <router-link
      to="/"
      class="not-found__cta"
    >
      返回主页
    </router-link>
  </div>
</template>

<style scoped>
/* ================================================================
   404 页面 — 国风竖排居中布局
   设计基调：宣纸留白 + 印章 + 书法标题 + 古诗意境
   ================================================================ */

.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--space-4);
  text-align: center;
}

/* ---- 印章 — 全局 .seal-stamp + 局部尺寸强化 ---- */
.not-found__seal {
  margin-bottom: var(--space-8);
  /* 覆盖全局 .seal-stamp 的默认小尺寸，适配 404 页面视觉权重 */
  font-size: var(--text-lg);
  padding: var(--space-2) var(--space-3);
}

/* ---- 主标题 — 毛笔书法体 ---- */
.not-found__title {
  margin: 0 0 var(--space-6);
  font-family: var(--font-display);
  font-size: var(--text-4xl);
  font-weight: var(--font-normal);
  color: var(--text-primary);
  line-height: var(--leading-tight);
  text-wrap: var(--text-wrap-heading);
}

/* ---- 古诗引述 — 淡墨次文字 ---- */
.not-found__verse {
  margin: 0 0 var(--space-12);
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
  text-wrap: var(--text-wrap-body);
}

/* ---- 返回主页 CTA — 金色幽灵按钮 ---- */
.not-found__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 140px;
  min-height: 44px;
  padding: var(--space-3) var(--space-6);
  background: var(--bg-surface);
  color: var(--accent-gold);
  border: var(--border-medium) solid var(--accent-gold);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  text-decoration: none;
  cursor: pointer;
  user-select: none;
  transition:
    box-shadow var(--duration-normal) var(--ease-enter),
    transform var(--duration-fast) var(--ease-out);
  -webkit-tap-highlight-color: var(--tap-highlight);
}

.not-found__cta:hover {
  box-shadow: var(--shadow-glow-gold);
  transform: translateY(-1px);
}

.not-found__cta:active {
  transform: translateY(0);
}

.not-found__cta:focus-visible {
  outline: 2px solid var(--accent-gold);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* ---- 无障碍：尊重用户动效偏好 ---- */
@media (prefers-reduced-motion: reduce) {
  .not-found__cta {
    transition: none;
  }
}
</style>
