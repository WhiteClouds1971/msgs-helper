<script setup>
import { computed } from 'vue'
import yuXiSrc from '@/assets/icons/yu_xi.svg'
import yuXiBorderSrc from '@/assets/icons/yu_xi_bian_kuang.svg'

const props = defineProps({
  size: { type: Number, default: 80 },
  showLine: { type: Boolean, default: false },
  subtitle: { type: String, default: '' },
})

const borderSize = computed(() => props.size * 1.2 + 12)
</script>

<template>
  <div
    class="splash-screen"
    :style="{ '--s-seal': size + 'px', '--s-border': borderSize + 'px' }"
  >
    <!-- ================================================================
        Stage
        ================================================================ -->
    <div class="splash-screen__stage">
      <!-- 边框（静止常驻，底层） -->
      <img
        :src="yuXiBorderSrc"
        class="splash-screen__border"
        alt=""
      >

      <!--
        朱砂墨迹 — inline SVG，缩放 96% 内缩使 stroke 完全落入边框内部
        fill="none" + stroke-dasharray 动画
      -->
      <svg
        class="splash-screen__ink-svg"
        viewBox="0 0 800 800"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g
          transform="translate(-90.185012,884.789411) scale(0.123666,-0.123666)"
          fill="none"
          stroke-width="260"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            class="splash-screen__ink-path"
            pathLength="100"
            d="M2467 5606 c-57 -21 -103 -61 -128 -113 l-24 -48 -7 -700 c-3 -385 -8 -1069 -10 -1521 l-3 -820 30 -50 c22 -36 44 -56 81 -75 51 -26 58 -26 305 -33 140 -3 802 -11 1471 -17 1114 -10 1221 -10 1265 5 56 19 114 73 137 126 17 41 20 210 36 1575 17 1508 17 1495 -4 1535 -26 49 -65 88 -110 112 -39 20 -64 20 -1375 29 -1714 10 -1619 11 -1664 -5z"
          />
        </g>
      </svg>

      <!-- 传国玉玺（静止居中） -->
      <img
        :src="yuXiSrc"
        class="splash-screen__seal"
        alt=""
      >
    </div>

    <!-- 装饰线 -->
    <div
      v-if="showLine"
      class="splash-screen__line decorative-line--knotted"
    />

    <!-- 副标题 -->
    <p
      v-if="subtitle"
      class="splash-screen__subtitle"
    >
      {{ subtitle }}
    </p>

    <slot />
  </div>
</template>

<style scoped lang="less">
.splash-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  transform: translateY(-20%);
}

/* ── Stage ── */
.splash-screen__stage {
  position: relative;
  width: var(--s-border);
  height: var(--s-border);
}

/* ── 边框（静止，底层） ── */
.splash-screen__border {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  user-select: none;
  pointer-events: none;
}

/* ── 朱砂墨迹 overlay ── */
.splash-screen__ink-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
  /* 整体缩 4%，使 stroke 完全落入边框内部通道 */
  transform: scale(0.96);
  transform-origin: center;

  .splash-screen__ink-path {
    stroke: var(--accent-red);
    stroke-dasharray: 100;
    animation: ink-draw 3s linear infinite;
  }
}

@keyframes ink-draw {
  0%   { stroke-dashoffset: 100; }
  98%  { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: 100; }
}

/* ── 玉玺（静止居中） ── */
.splash-screen__seal {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--s-seal);
  height: var(--s-seal);
  transform: translate(-50%, -50%) rotate(-1.5deg);
  z-index: 1;
  filter: drop-shadow(0 2px 6px rgba(120, 100, 80, 0.18));
  user-select: none;
  pointer-events: none;
}

/* ── 装饰线 ── */
.splash-screen__line {
  width: 140px;
  height: var(--border-medium);
  background: var(--decorative-line);
  border: none;
  position: relative;
  margin-top: -6px;
  opacity: 0.6;

  &::before {
    content: '◆';
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    font-size: 6px;
    color: var(--accent-gold);
    line-height: 1;
  }
}

/* ── 副标题 ── */
.splash-screen__subtitle {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  text-indent: 0.2em;
  letter-spacing: 0.2em;
  user-select: none;
}

/* ── 无障碍 ── */
@media (prefers-reduced-motion: reduce) {
  .splash-screen__ink-path {
    animation: none;
    stroke-dashoffset: 0;
  }

  .splash-screen__seal {
    transform: translate(-50%, -50%);
  }
}
</style>
