<script setup>
  import { ref } from 'vue';
  import {
    PopoverContent,
    PopoverPortal,
    PopoverRoot,
    PopoverTrigger,
  } from 'reka-ui';
  import historyIcon from '@/assets/icons/li_shi.svg?raw';
  import {
    HISTORY_LIMIT,
    entryPoolLabel,
    entrySummary,
    formatRecordedTime,
  } from '../history.js';

  /**
   * 记录历史 —— 页首那枚历史图标 + 点开的浮动列表
   *
   * 列表画的是「本页刚新增的那几局」（见 ../history.js），点一条就请页面去撤回它：
   * 这里只报告「用户点了哪一条」，撤回前的那道二次确认不归它管
   * （弹窗是 @/ui/ConfirmDialog，页面自己挂）。
   *
   * 面板从图标左侧摊开：图标在本页右上角，浮层锚在它的右下（side=bottom + align=end），
   * 右缘对齐图标、向左伸展 —— 顶到屏幕边时 reka 会自己把它推回可视区里。
   * 列表是滚动容器（最多 50 条），面板本身不滚：标题固定，条数多了滚条目那一块。
   *
   * 结构契约（供测试与页面布局引用）：
   *   .record-history__icon    —— 那枚图标按钮（PopoverTrigger）
   *   .record-history__panel   —— 浮层里的面板（底色 / 描边 / 尺寸都在这层）
   *   .record-history__list    —— 条目列表（滚动容器）
   *   .record-history__entry   —— 单条记录（整条可点）
   */
  defineProps({
    /** 历史记录，新的在前（见 ../history.js 的 useRecordHistory） */
    entries: { type: Array, default: () => [] },
  });

  const emit = defineEmits(['undo']);

  /** 浮层开合（受控在本组件里：点一条之后要自己收起来） */
  const open = ref(false);

  /**
   * 选了某一条 —— 先收起浮层再报告
   *
   * 顺序不能反：二次确认弹窗是模态的（带遮罩），浮层要是还开着，
   * 它会浮在遮罩之上，看上去像两个弹窗叠着。
   */
  function pick(entry) {
    open.value = false;
    emit('undo', entry);
  }
</script>

<template>
  <PopoverRoot v-model:open="open">
    <PopoverTrigger as-child>
      <!-- 与页首那枚导出图标同一副长相：只留图标本身，无底色无描边，
           靠灰度与提示文字连成一体；无字可读，故给 aria-label -->
      <button
        class="record-history__icon"
        :class="{ 'is-open': open }"
        type="button"
        :aria-expanded="open"
        aria-label="历史记录（可撤回）"
        title="历史记录（可撤回）"
      >
        <span
          class="record-history__glyph"
          aria-hidden="true"
          v-html="historyIcon"
        />
      </button>
    </PopoverTrigger>

    <PopoverPortal>
      <PopoverContent
        class="record-history__content"
        side="bottom"
        align="end"
        :side-offset="8"
        :collision-padding="16"
      >
        <div class="record-history__panel">
          <p class="record-history__caption">
            最近记录
            <span class="record-history__caption-hint">
              （可撤回，最多留存 {{ HISTORY_LIMIT }} 条）
            </span>
          </p>

          <ul v-if="entries.length" class="record-history__list">
            <li
              v-for="entry in entries"
              :key="entry.id"
              class="record-history__item"
            >
              <button
                class="record-history__entry"
                type="button"
                :aria-label="`撤回 ${entry.hero} ${entrySummary(entry)}`"
                @click="pick(entry)"
              >
                <span class="record-history__row">
                  <span class="record-history__hero">{{ entry.hero }}</span>
                  <span class="record-history__time">
                    {{ formatRecordedTime(entry.at) }}
                  </span>
                </span>

                <span class="record-history__meta">
                  {{ entrySummary(entry) }}
                  <template v-if="entryPoolLabel(entry)">
                    · {{ entryPoolLabel(entry) }}
                  </template>
                </span>
              </button>
            </li>
          </ul>

          <p v-else class="record-history__empty">
            还没有可撤回的记录 —— 记下一局就会出现在这里
          </p>
        </div>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

<style scoped lang="less">
  /* ================================================================
     图标按钮 —— 页首那枚「附带动作」的长相：没有底色也没有描边，
     与旁边的提示文字同一档灰度，只有 hover / 打开才浮到金色
     ================================================================ */
  .record-history__icon {
    /* 与导出图标同大一档：旁边没有文字作陪，18px 在窄栏里显得空 */
    --icon-size: 22px;

    position: relative;
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    color: var(--text-tertiary);
    background: none;
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    -webkit-tap-highlight-color: var(--tap-highlight);
    transition:
      color var(--duration-fast) var(--ease-out),
      transform var(--duration-fast) var(--ease-out);

    /* 视觉 32px、热区 44px（四周各补 6px）—— 只有图标、没有文字的按钮不能省热区（设计系统 §3.8） */
    &::after {
      content: '';
      position: absolute;
      inset: -6px;
    }

    &:hover,
    &.is-open {
      color: var(--accent-gold);
    }

    &:active {
      transform: scale(0.92);
    }

    &:focus-visible {
      outline: 2px solid var(--accent-gold);
      outline-offset: 2px;
    }
  }

  .record-history__glyph {
    display: flex;
    flex: none;
    width: var(--icon-size, 22px);
    height: var(--icon-size, 22px);

    :deep(svg) {
      width: 100%;
      height: 100%;
    }
  }

  /* ================================================================
     浮层面板 —— 竹简展开：贴图标右缘、向左摊开
     ================================================================ */
  .record-history__panel {
    display: flex;
    flex-direction: column;
    /* 面板宽度收到 320px：本页是窄栏，再宽就顶到屏幕边了 */
    width: min(320px, calc(100vw - 2 * var(--content-padding)));
    /* 封顶：条目最多 50 条，再多也不让浮层长过半屏（列表自己滚） */
    max-height: min(50dvh, 360px);
    padding: var(--space-2);
    background: var(--bg-surface);
    border: var(--border-thin) solid var(--border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    /* 从图标那一侧展开 */
    transform-origin: top right;
  }

  /* 入场状态挂在 reka 的 content 上：它才是带 data-state 的那个元素 */
  .record-history__content[data-state='open'] .record-history__panel {
    animation: record-history-in var(--duration-fast) var(--ease-enter) both;
  }

  .record-history__content[data-state='closed'] .record-history__panel {
    animation: record-history-out var(--duration-instant) var(--ease-out) both;
  }

  @keyframes record-history-in {
    from {
      opacity: 0;
      transform: translateY(-4px) scale(0.98);
    }

    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes record-history-out {
    from {
      opacity: 1;
      transform: scale(1);
    }

    to {
      opacity: 0;
      transform: scale(0.98);
    }
  }

  /* ================================================================
     标题行 —— 一句话说清这块是什么，不抢条目的视线
     ================================================================ */
  .record-history__caption {
    display: flex;
    align-items: baseline;
    gap: var(--space-1);
    margin: 0;
    padding: var(--space-1) var(--space-2) var(--space-2);
    font-family: var(--font-body);
    font-size: var(--text-xs);
    font-weight: var(--font-medium);
    letter-spacing: 0.02em;
    color: var(--text-secondary);
  }

  .record-history__caption-hint {
    font-weight: var(--font-normal);
    color: var(--text-tertiary);
  }

  /* ================================================================
     条目列表 —— 滚动容器（条目多了滚这一块，标题与面板不动）
     ================================================================ */
  .record-history__list {
    /* flex: 1 + min-height: 0：容器是 flex 列，不写这两行它宁撑破面板也不滚 */
    flex: 1;
    min-height: 0;
    margin: 0;
    padding: 0;
    list-style: none;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
  }

  /* 条目之间的分隔线：一条微边框，不用整块底色 */
  .record-history__item + .record-history__item {
    border-top: var(--border-thin) solid var(--border-light);
  }

  /* 单条记录 —— 整条可点（点下去就是要撤回它，确认在弹窗里做） */
  .record-history__entry {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    width: 100%;
    padding: var(--space-2);
    font-family: var(--font-body);
    text-align: left;
    background: none;
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    -webkit-tap-highlight-color: var(--tap-highlight);
    transition: background-color var(--duration-fast) var(--ease-out);

    &:hover {
      background: var(--bg-surface-hover);
    }

    &:active {
      background: var(--accent-gold-bg);
    }

    &:focus-visible {
      outline: 2px solid var(--accent-gold);
      outline-offset: -2px;
    }
  }

  .record-history__row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-2);
  }

  /* 武将名 —— 毛笔体，与列表里的「谁」这一档相称 */
  .record-history__hero {
    flex: 1;
    min-width: 0;
    font-family: var(--font-display);
    font-size: var(--text-lg);
    line-height: var(--leading-tight);
    color: var(--text-primary);
  }

  /* 记录时间（UTC+8）—— 数字等宽，一列排下来对得齐 */
  .record-history__time {
    flex: none;
    font-size: var(--text-xs);
    font-variant-numeric: tabular-nums;
    color: var(--text-tertiary);
  }

  /* 模式 · 身份 · 对局结果 · 将池 */
  .record-history__meta {
    font-size: var(--text-xs);
    line-height: var(--leading-normal);
    color: var(--text-secondary);
  }

  /* ================================================================
     空态 —— 还没记过（或刚被撤空）
     ================================================================ */
  .record-history__empty {
    margin: 0;
    padding: var(--space-4) var(--space-3);
    font-size: var(--text-xs);
    line-height: var(--leading-relaxed);
    text-align: center;
    color: var(--text-tertiary);
  }

  /* ================================================================
     Reduced Motion — 无障碍退化
     ================================================================ */
  @media (prefers-reduced-motion: reduce) {
    .record-history__content[data-state='open'] .record-history__panel,
    .record-history__content[data-state='closed'] .record-history__panel {
      animation: none;
    }

    .record-history__icon,
    .record-history__entry {
      transition: none;
    }
  }
</style>
