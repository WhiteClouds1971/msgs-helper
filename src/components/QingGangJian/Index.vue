<script setup>
import { ref } from 'vue'

const isExpanded = ref(true)
</script>

<template>
  <div
    class="reel"
    :class="{ 'is-expanded': isExpanded }"
    @click="isExpanded = !isExpanded"
  >
    <!-- 圆盘 — 收起态仅此可见 -->
    <div class="reel__disc">
      <svg class="reel__disc-svg" viewBox="0 0 1024 1024">
        <path d="M275.2 494.933333a18.346667 18.346667 0 0 1-8.106667 0 22.613333 22.613333 0 0 1-11.093333-13.226666 18.346667 18.346667 0 0 1 0-8.106667 20.053333 20.053333 0 0 1 6.4-14.933333 15.36 15.36 0 0 1 6.826667-4.693334 21.333333 21.333333 0 0 1 16.213333 0 15.36 15.36 0 0 1 6.826667 4.693334 20.053333 20.053333 0 0 1 6.4 14.933333 18.346667 18.346667 0 0 1 0 8.106667 22.613333 22.613333 0 0 1-11.52 11.52 17.493333 17.493333 0 0 1-11.946667 1.706666z"/>
        <path d="M444.586667 839.253333a362.666667 362.666667 0 1 1 362.666666-362.666666 363.093333 363.093333 0 0 1-362.666666 362.666666z m0-682.666666a320 320 0 1 0 320 320 320 320 0 0 0-320-320z"/>
        <path d="M438.186667 332.373333a22.613333 22.613333 0 0 1-15.36-6.4 24.32 24.32 0 0 1-4.693334-6.826666 26.88 26.88 0 0 1 0-8.106667 29.44 29.44 0 0 1 0-8.533333 24.32 24.32 0 0 1 4.693334-6.826667 22.613333 22.613333 0 0 1 30.293333 0 38.826667 38.826667 0 0 1 4.693333 6.826667 30.293333 30.293333 0 0 1 0 8.533333 27.733333 27.733333 0 0 1 0 8.106667 38.826667 38.826667 0 0 1-4.693333 6.826666 22.613333 22.613333 0 0 1-14.933333 6.4zM609.28 486.4a20.48 20.48 0 0 1-21.333333-21.333333 21.333333 21.333333 0 0 1 5.973333-14.933334 21.76 21.76 0 0 1 23.466667-4.693333 24.32 24.32 0 0 1 6.826666 4.693333 21.76 21.76 0 0 1 6.4 14.933334 23.466667 23.466667 0 0 1-6.4 15.36 23.04 23.04 0 0 1-6.826666 4.266666 18.346667 18.346667 0 0 1-8.106667 1.706667zM438.186667 657.493333a21.76 21.76 0 0 1-15.36-5.973333 23.04 23.04 0 0 1-5.973334-15.36 21.333333 21.333333 0 0 1 5.973334-14.933333 21.76 21.76 0 0 1 36.693333 14.933333 23.466667 23.466667 0 0 1-6.4 15.36 22.186667 22.186667 0 0 1-14.933333 5.973333zM920.746667 839.253333H426.666667a21.333333 21.333333 0 0 1-21.333334-21.333333 21.333333 21.333333 0 0 1 21.333334-21.333333h494.08a21.333333 21.333333 0 0 1 21.333333 21.333333 21.333333 21.333333 0 0 1-21.333333 21.333333z"/>
      </svg>
    </div>

    <!-- 胶卷尾巴 + 台词 + 菜单 -->
    <div class="reel__tail">
      <div class="reel__film">
        <span class="reel__text">面杀辅助</span>
      </div>

      <div class="reel__menu">
        <button class="reel__menu-item">
          <span class="reel__menu-dot" />
          <span class="reel__menu-label">语音</span>
        </button>
        <button class="reel__menu-item">
          <span class="reel__menu-dot" />
          <span class="reel__menu-label">搜索</span>
        </button>
        <button class="reel__menu-item">
          <span class="reel__menu-dot" />
          <span class="reel__menu-label">设置</span>
        </button>
        <button class="reel__menu-item">
          <span class="reel__menu-dot" />
          <span class="reel__menu-label">关于</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.reel {
  --_disc-size: 56px;
  --_film-h: 32px;
  --_film-w: 160px;
}

/* ═══════════════ Container ═══════════════ */
.reel {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

/* ═══════════════ 圆盘 ═══════════════ */
.reel__disc {
  width: var(--_disc-size);
  height: var(--_disc-size);
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 2px 6px rgba(120, 100, 80, 0.15));
}

.reel__disc-svg {
  display: block;
  width: 100%;
  height: 100%;
  fill: var(--accent-gold);
  opacity: 0.85;
}

/* ═══════════════ 尾巴容器 ═══════════════ */
.reel__tail {
  display: flex;
  align-items: center;
  overflow: hidden;
  max-width: 0;
  transition: max-width 350ms var(--ease-ink);
}

.is-expanded .reel__tail {
  max-width: 400px;
}

/* ═══════════════ 胶卷 ═══════════════ */
.reel__film {
  position: relative;
  height: var(--_film-h);
  width: var(--_film-w);
  background:
    linear-gradient(180deg, #f5efe0 0%, #faf6f0 40%, #faf6f0 60%, #e8dcc8 100%);
  border-top: 1.5px solid var(--accent-gold-light);
  border-bottom: 1.5px solid var(--accent-gold-light);
  display: flex;
  align-items: center;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 200ms var(--ease-ink);
}

.is-expanded .reel__film {
  opacity: 1;
  transition-delay: 100ms;
}

/* 胶卷齿孔 */
.reel__film::before,
.reel__film::after {
  content: '';
  position: absolute;
  left: 6px;
  right: 6px;
  height: 3px;
  pointer-events: none;
}

.reel__film::before {
  top: 2px;
  background: repeating-linear-gradient(
    90deg,
    rgba(184, 134, 11, 0.35) 0px 4px,
    transparent 4px 12px
  );
}

.reel__film::after {
  bottom: 2px;
  background: repeating-linear-gradient(
    90deg,
    rgba(184, 134, 11, 0.35) 0px 4px,
    transparent 4px 12px
  );
}

/* 台词 */
.reel__text {
  position: relative;
  z-index: 1;
  white-space: nowrap;
  font-family: var(--font-display);
  font-size: var(--text-sm);
  color: var(--text-primary);
  padding: 0 var(--space-3);
}

/* ═══════════════ 菜单 ═══════════════ */
.reel__menu {
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin-left: var(--space-2);
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 200ms var(--ease-enter);
}

.is-expanded .reel__menu {
  opacity: 1;
  transition-delay: 200ms;
}

.reel__menu-item {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 1px 0;
}

/* 连线点 */
.reel__menu-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--accent-gold);
  flex-shrink: 0;
}

/* 标签 */
.reel__menu-label {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  white-space: nowrap;
}

.reel__menu-item:hover .reel__menu-label {
  color: var(--accent-gold);
}

/* ═══════════════ Reduced motion ═══════════════ */
@media (prefers-reduced-motion: reduce) {
  .reel__tail {
    transition: none;
  }
  .reel__film,
  .reel__menu {
    transition: none;
  }
}
</style>
