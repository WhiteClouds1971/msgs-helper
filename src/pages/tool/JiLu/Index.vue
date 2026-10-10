<script setup>
  import { computed, ref } from 'vue';
  import { useRoute } from 'vue-router';
  import { usePageReady } from '@/composables/usePageReady';
  import { usePageTour } from '@/composables/usePageTour';
  import { useMessage } from '@/composables/useMessage';
  import { useLocalStorage } from '@/stores/localStorage';
  import { TourKeys } from '@/constants/tourKeys';
  import Button from '@/ui/Button/Index.vue';
  import Collapse from '@/ui/Collapse/Index.vue';
  import ConfirmDialog from '@/ui/ConfirmDialog/Index.vue';
  import Drawer from '@/ui/Drawer/Index.vue';
  import PlayingCard from '@/ui/PlayingCard/Index.vue';
  import RadioGroup from '@/ui/RadioGroup/Index.vue';
  import {
    CARD_GROUPS,
    DEFAULT_OPEN_GROUP,
    RANKS,
    SUIT_BY_KEY,
    SUITS,
  } from './cards.js';
  import { useSwipeDelete } from './useSwipeDelete.js';

  /**
   * 记录 · 游戏牌
   *
   * 面杀时把「已经出过哪些牌」记下来，两种记法：
   *   · 简单模式 —— 点牌名点亮，再点一下取消；只记牌名，不落列表
   *   · 复杂模式 —— 点牌名开弹框挑花色与点数，记下的牌落在页面最下方的列表，
   *                 左滑删一张、点牌面藏一张、右上角一键全藏全显
   *
   * 两套数据各存各的（picked / cards），来回切模式不互相清：
   * 简单模式点亮的那些牌名，切到复杂模式照样在。
   */

  usePageReady();

  /** 页面教学：模式 → 牌池 → 已记录区（第二次进入本页才教，调度规则见 usePageTour） */
  usePageTour(TourKeys.JI_LU);

  const route = useRoute();
  const ls = useLocalStorage();
  const message = useMessage();

  /* ── 页面数据（key = 路由全路径，跟着「清除本页数据」一起走）──
     picked —— 简单模式点亮的牌名 code
     cards  —— 复杂模式记下的牌：{ id, code, name, suit, rank, hidden } */
  ls.load(route.fullPath, { mode: 'simple', picked: [], cards: [] });
  const page = ls.pageData;

  const MODE_OPTIONS = Object.freeze([
    { label: '简单模式', value: 'simple' },
    { label: '复杂模式', value: 'complex' },
  ]);

  const mode = computed({
    get: () => page.mode,
    set: value => {
      page.mode = value;
    },
  });

  const modeHint = computed(() =>
    page.mode === 'simple' ? '点牌名点亮，再点一下取消' : '点牌名后挑花色与点数',
  );

  const emptyText = computed(() =>
    page.mode === 'simple'
      ? '简单模式只点亮牌名，不落到列表 —— 切到复杂模式，记下的牌都列在这里。'
      : '还没有记录的牌 —— 点上面的牌名记一张。',
  );

  /* ── 牌池：三组牌名各占一折，各点各的展开 ──
     进来只摊开锦囊牌（最常记的一类），另两折收着 ——
     44 张一次全铺开太占屏，记哪一类再展开哪一类 */
  const openGroups = ref([DEFAULT_OPEN_GROUP]);
  const poolItems = CARD_GROUPS.map(group => ({
    value: group.key,
    title: group.title,
    hint: `${group.cards.length} 张`,
  }));

  /** 折叠框的插槽按 item 回调，据此取回这一折的牌名 */
  function groupOf(value) {
    return CARD_GROUPS.find(group => group.key === value);
  }

  const pickedSet = computed(() => new Set(page.picked));

  /** 每张牌名记了几次 —— 复杂模式下贴在牌池格子右上角 */
  const counts = computed(() => {
    const map = new Map();
    page.cards.forEach(card => map.set(card.code, (map.get(card.code) ?? 0) + 1));
    return map;
  });

  function countOf(code) {
    return counts.value.get(code) ?? 0;
  }

  /* ── 牌池点一下 ── */
  function onPick(card) {
    if (page.mode === 'simple') {
      const at = page.picked.indexOf(card.code);
      if (at >= 0) page.picked.splice(at, 1);
      else page.picked.push(card.code);
      return;
    }
    openPicker(card);
  }

  /* ── 复杂模式：挑花色与点数 ──
     两样都不选也能直接记（不做必填、不查重 —— 同一张牌记两次就是两张），
     点已选中的那一枚即撤回该选择。 */
  const pickerOpen = ref(false);
  const draft = ref(null);
  const draftSuit = ref(null);
  const draftRank = ref(null);

  const draftSuitObj = computed(() => (draftSuit.value ? SUIT_BY_KEY[draftSuit.value] : null));

  function openPicker(card) {
    draft.value = card;
    draftSuit.value = null;
    draftRank.value = null;
    pickerOpen.value = true;
  }

  let seed = 0;

  /** 记录项的 id：时间戳 + 自增序号，够用且不用引依赖 */
  function nextId() {
    seed += 1;
    return `c${Date.now().toString(36)}${seed.toString(36)}`;
  }

  function confirmPick() {
    if (!draft.value) return;
    page.cards.push({
      id: nextId(),
      code: draft.value.code,
      name: draft.value.label,
      suit: draftSuit.value,
      rank: draftRank.value,
      hidden: false,
    });
    pickerOpen.value = false;
  }

  function suitOf(card) {
    return card.suit ? SUIT_BY_KEY[card.suit] : null;
  }

  /* ── 已记录区：左滑删 / 点一下藏 ── */
  const listRef = ref(null);
  const swipe = useSwipeDelete(() => listRef.value, {
    onRemove(index) {
      page.cards.splice(index, 1);
    },
  });

  function onCardTap(index) {
    // 左滑过的那一下会紧接着来一次 click，那不是点按
    if (swipe.shouldIgnoreClick()) return;
    const card = page.cards[index];
    if (card) card.hidden = !card.hidden;
  }

  const allHidden = computed(
    () => page.cards.length > 0 && page.cards.every(card => card.hidden),
  );

  /** 一键全藏 / 全显：看当前是不是已经全藏着了 */
  function toggleAllHidden() {
    const next = !allHidden.value;
    page.cards.forEach(card => {
      card.hidden = next;
    });
  }

  /* ── 清空：两套记录一起清（复杂模式记下的牌 + 简单模式点亮的牌名）──
     收不回来的动作，先问一句，且把要清掉的东西在问句里点清 */
  const clearOpen = ref(false);

  const hasRecord = computed(() => page.cards.length > 0 || page.picked.length > 0);

  const clearSummary = computed(() => {
    const parts = [];
    if (page.cards.length) parts.push(`${page.cards.length} 张牌`);
    if (page.picked.length) parts.push(`${page.picked.length} 个点亮的牌名`);
    return parts.length ? `将清掉 ${parts.join('、')}，清掉后找不回来。` : '当前没有记录。';
  });

  function clearAll() {
    page.cards = [];
    page.picked = [];
    clearOpen.value = false;
    message.success('已清空记录');
  }
</script>

<template>
  <div class="ji-lu">
    <RadioGroup
      id="jlp-mode"
      v-model="mode"
      class="jlp__mode"
      label="模式"
      :options="MODE_OPTIONS"
    />

    <p class="jlp__hint">{{ modeHint }}</p>

    <!-- 牌池：基本 / 锦囊 / 装备各一折；点标题行展开或收起 -->
    <Collapse
      id="jlp-pool"
      v-model="openGroups"
      type="multiple"
      :items="poolItems"
    >
      <template #default="{ item }">
        <ul class="jlp-grid">
          <li
            v-for="card in groupOf(item.value).cards"
            :key="card.code"
            class="jlp-pick"
          >
            <button
              class="jlp-pick__btn"
              type="button"
              @click="onPick(card)"
            >
              <PlayingCard
                as="span"
                class="jlp-pick__card"
                :name="card.label"
                :selected="pickedSet.has(card.code)"
              />
            </button>

            <!-- 复杂模式：这张牌名记了几次 -->
            <span
              v-if="mode === 'complex' && countOf(card.code)"
              class="jlp-pick__count"
            >{{ countOf(card.code) }}</span>
          </li>
        </ul>
      </template>
    </Collapse>

    <!-- 已记录：复杂模式记下的每一张；左滑删、点牌面藏 -->
    <section
      id="jlp-added"
      class="jlp-added"
    >
      <header class="jlp-added__head">
        <h2 class="jlp-added__title">
          已记录
          <span
            v-if="page.cards.length"
            class="jlp-added__count"
          >{{ page.cards.length }}</span>
        </h2>

        <div class="jlp-added__actions">
          <Button
            variant="ghost"
            :disabled="!page.cards.length"
            @click="toggleAllHidden"
          >
            {{ allHidden ? '全部显示' : '全部隐藏' }}
          </Button>
          <Button
            variant="ghost"
            :disabled="!hasRecord"
            @click="clearOpen = true"
          >
            清空
          </Button>
        </div>
      </header>

      <!-- 列表结构契约对齐 useSwipeDelete.js：li.jlp-card / __viewport / __card -->
      <ul
        ref="listRef"
        class="jlp-cards"
      >
        <li
          v-for="(card, index) in page.cards"
          :key="card.id"
          class="jlp-card"
        >
          <span
            class="jlp-card__bed"
            aria-hidden="true"
          >删除</span>

          <button
            class="jlp-card__card"
            type="button"
            :aria-label="card.hidden ? `显示「${card.name}」的信息` : `隐藏「${card.name}」的信息`"
            @click="onCardTap(index)"
          >
            <PlayingCard
              as="span"
              class="jlp-card__face"
              variant="row"
              :name="card.name"
              :suit="suitOf(card)"
              :rank="card.rank"
              :hidden="card.hidden"
            />
          </button>
        </li>

        <li
          v-if="!page.cards.length"
          class="jlp-cards__empty"
        >
          {{ emptyText }}
        </li>
      </ul>
    </section>

    <!-- 复杂模式的记录弹框：点数一行、花色一行、下面是这张牌现在的样子 -->
    <Drawer
      v-model:open="pickerOpen"
      title="记录牌"
      :description="draft ? `正在记录「${draft.label}」` : ''"
      max-height="70dvh"
    >
      <div class="jlp-picker">
        <p class="jlp-picker__label">点数</p>
        <div
          class="jlp-chips is-rank"
          role="group"
          aria-label="点数"
        >
          <button
            v-for="rank in RANKS"
            :key="rank"
            class="jlp-chip"
            type="button"
            :class="{ 'is-picked': draftRank === rank }"
            :aria-pressed="draftRank === rank"
            @click="draftRank = draftRank === rank ? null : rank"
          >
            {{ rank }}
          </button>
        </div>

        <p class="jlp-picker__label">花色</p>
        <div
          class="jlp-chips is-suit"
          role="group"
          aria-label="花色"
        >
          <button
            v-for="suit in SUITS"
            :key="suit.key"
            class="jlp-chip"
            type="button"
            :class="[`is-${suit.tone}`, { 'is-picked': draftSuit === suit.key }]"
            :aria-pressed="draftSuit === suit.key"
            @click="draftSuit = draftSuit === suit.key ? null : suit.key"
          >
            <span class="jlp-chip__pip">{{ suit.pip }}</span>{{ suit.label }}
          </button>
        </div>

        <div class="jlp-picker__preview">
          <PlayingCard
            variant="row"
            :name="draft?.label"
            :suit="draftSuitObj"
            :rank="draftRank"
          />
        </div>
      </div>

      <template #footer>
        <div class="jlp-picker__actions">
          <Button
            variant="ghost"
            @click="pickerOpen = false"
          >
            取消
          </Button>
          <Button @click="confirmPick">记录这张</Button>
        </div>
      </template>
    </Drawer>

    <ConfirmDialog
      v-model:open="clearOpen"
      title="清空记录"
      :description="clearSummary"
      confirm-text="清空"
      @confirm="clearAll"
    />
  </div>
</template>

<style scoped lang="less">
  /* ================================================================
   页面容器 —— #app 不滚，本页自建滚动容器
   ================================================================ */
  .ji-lu {
    height: 100%;
    padding: calc(var(--safe-area-top) + var(--space-4)) var(--content-padding)
      calc(var(--safe-area-bottom) + var(--space-4));
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
  }

  .jlp__mode {
    margin-bottom: var(--space-2);
  }

  .jlp__hint {
    margin: 0 0 var(--space-4);
    font-size: var(--text-xs);
    line-height: var(--leading-relaxed);
    letter-spacing: 0.02em;
    color: var(--text-secondary);
  }

  /* ================================================================
   牌池 —— 每一折里三组牌名铺成四列小方块
   ================================================================ */
  /* 四列铺开：一排四个牌名，窄屏上也放得下三字以上的长名（不折行）；
     行距比列距紧一档 —— 44 张牌名要一眼扫过去，纵向省下来的都是滚动的路 */
  .jlp-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--space-1) var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .jlp-pick {
    position: relative;
    display: flex;
    min-width: 0;
  }

  /* 格子整块可点：按钮不带自己的面，牌面就是那一面 */
  .jlp-pick__btn {
    display: flex;
    flex: 1;
    min-width: 0;
    padding: 0;
    background: none;
    border: none;
    cursor: pointer;
    -webkit-tap-highlight-color: var(--tap-highlight);

    @media (hover: hover) {
      &:hover .jlp-pick__card {
        border-color: var(--accent-gold-light);
      }
    }

    &:active .jlp-pick__card {
      transform: scale(0.97);
    }

    /* 焦点环画在牌面上（设计系统 §3.6） */
    &:focus-visible .jlp-pick__card {
      outline: 2px solid var(--accent-gold);
      outline-offset: 2px;
    }
  }

  .jlp-pick__card {
    flex: 1;
    min-width: 0;
  }

  /* 记了几次 —— 压在格子右上角的一枚小金印 */
  .jlp-pick__count {
    position: absolute;
    top: -6px;
    right: -6px;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 var(--space-1);
    font-family: var(--font-body);
    font-size: var(--text-xs);
    line-height: 1;
    font-variant-numeric: var(--font-nums);
    color: var(--text-inverse);
    background: var(--accent-gold-dark);
    border-radius: var(--radius-full);
    pointer-events: none;
  }

  /* ================================================================
   已记录 —— 一行一张，左滑删
   ================================================================ */
  .jlp-added {
    margin-top: var(--space-6);
  }

  .jlp-added__head {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
  }

  .jlp-added__title {
    display: flex;
    align-items: baseline;
    gap: var(--space-1);
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-xl);
    font-weight: var(--font-normal);
    color: var(--text-primary);
  }

  .jlp-added__count {
    font-family: var(--font-body);
    font-size: var(--text-sm);
    font-variant-numeric: var(--font-nums);
    color: var(--text-secondary);
  }

  .jlp-added__actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-left: auto;
  }

  /* 已记录的牌：一行两张 ——
     一位一行会把「♠A 火杀」摊成又长又空的横条；再窄下去，
     最长的牌名（雌雄双股剑、爪黄飞雷+1）带上角标就装不下一行、要折成两行。
     两列正好把「角标 + 五六个字」放进一行，牌面内容居中，长短不齐也还是齐的 */
  .jlp-cards {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .jlp-card {
    position: relative;
    /* 牌面滑走时被这里裁住，露出底下的朱砂滑出层 */
    overflow: hidden;
    border-radius: var(--radius-md);
    /* 纵向滚动照常放行，横向留给左滑。缺了它，触屏上的横向滑动会被
       浏览器判成平移并掐断指针事件流，左滑整个失效 */
    touch-action: pan-y;
  }

  /* 滑出层：牌面滑走才露出来的朱砂底 */
  .jlp-card__bed {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 var(--space-1);
    background: var(--accent-red);
    font-size: var(--text-xs);
    letter-spacing: 0.1em;
    color: var(--text-inverse);
    /* 平时不可见：牌面浮起缩放时会漏出底下的颜色，露红底会很脏 */
    opacity: 0;
    transition: opacity var(--duration-fast) var(--ease-out);
  }

  /* 左滑中 —— 滑出层才显形（状态类由 useSwipeDelete 挂） */
  .jlp-card.is-swiping .jlp-card__bed {
    opacity: 1;
  }

  /* 牌面撑满这一格（内容由牌面自己居中） */
  .jlp-card__card {
    display: flex;
    width: 100%;
    padding: 0;
    background: none;
    border: none;
    cursor: pointer;
    -webkit-tap-highlight-color: var(--tap-highlight);

    /* 焦点环画在牌面上（设计系统 §3.6）——牌签被 li 裁着，
       环得往里画，不然整圈都会被裁掉 */
    &:focus-visible .jlp-card__face {
      outline: 2px solid var(--accent-gold);
      outline-offset: -2px;
    }
  }

  .jlp-card__face {
    flex: 1;
    min-width: 0;
  }

  /* 空态自己占满一整行（外面是三列网格，不然会被挤在第一个格子里） */
  .jlp-cards__empty {
    grid-column: 1 / -1;
    padding: var(--space-6) var(--space-4);
    border: var(--border-thin) solid var(--border);
    border-radius: var(--radius-md);
    font-size: var(--text-xs);
    line-height: var(--leading-relaxed);
    color: var(--text-secondary);
    text-align: center;
  }

  /* ================================================================
   记录弹框 —— 点数一行、花色一行、预览一张
   ================================================================ */
  .jlp-picker {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .jlp-picker__label {
    margin: var(--space-2) 0 0;
    font-size: var(--text-xs);
    font-weight: var(--font-medium);
    letter-spacing: 0.08em;
    color: var(--text-secondary);

    &:first-child {
      margin-top: 0;
    }
  }

  .jlp-chips {
    display: grid;
    gap: var(--space-2);
  }

  /* 点数 13 枚摊两行，花色 4 枚一行 */
  .jlp-chips.is-rank {
    grid-template-columns: repeat(7, minmax(0, 1fr));
  }

  .jlp-chips.is-suit {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  /* 与 @/ui/RadioGroup 的选项同一个面：未选中淡墨，选中就落一枚金印 */
  .jlp-chip {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-1);
    min-width: 0;
    min-height: var(--control-height);
    padding: 0 var(--space-1);
    font-family: var(--font-body);
    font-size: var(--text-base);
    line-height: var(--leading-normal);
    color: var(--text-secondary);
    background-color: var(--bg-surface);
    background-image: var(--card-lacquer-gradient);
    border: var(--border-thin) solid var(--border);
    border-radius: var(--radius-md);
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: var(--tap-highlight);
    transition:
      transform var(--duration-fast) var(--ease-out),
      border-color var(--duration-fast) var(--ease-out),
      background-color var(--duration-fast) var(--ease-out),
      color var(--duration-fast) var(--ease-out),
      box-shadow var(--duration-fast) var(--ease-out);

    /* 视觉 36px、热区补到 44px（设计系统 §3.8）—— 向上下的空隙里扩，
       左右留 0，免得七列挨着时互相侵入 */
    &::after {
      content: '';
      position: absolute;
      inset: calc(-1 * var(--control-hit-pad)) 0;
    }

    @media (hover: hover) {
      &:hover:not(.is-picked) {
        border-color: var(--accent-gold-light);
        background-color: var(--bg-surface-hover);
        color: var(--text-primary);
      }
    }

    &:active {
      transform: scale(0.97);
    }

    &:focus-visible {
      outline: 2px solid var(--accent-gold);
      outline-offset: 2px;
    }

    /* 选中：金描边 + 淡金底 + 金辉光，字色回到浓墨（不靠金色写字：
       --accent-gold 在 Light 模式只有 3.0:1，设计系统 §4.1） */
    &.is-picked {
      color: var(--text-primary);
      font-weight: var(--font-medium);
      background-color: var(--accent-gold-bg);
      border-color: var(--accent-gold);
      box-shadow: var(--shadow-glow-gold);
    }
  }

  /* 花色字形随牌色：黑桃梅花是墨，红桃方片是朱砂 */
  .jlp-chip__pip {
    font-size: var(--text-sm);
    line-height: 1;
    font-variant-emoji: text;
  }

  .jlp-chip.is-ink .jlp-chip__pip {
    color: var(--text-primary);
  }

  .jlp-chip.is-red .jlp-chip__pip {
    color: var(--accent-red);
  }

  .jlp-picker__preview {
    display: flex;
    justify-content: center;
    margin-top: var(--space-3);
  }

  /* 预览一张：够看就行，别铺满整屏 */
  .jlp-picker__preview > * {
    width: min(200px, 100%);
  }

  .jlp-picker__actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-3);
  }
</style>
