<script setup>
  import { computed, watch } from 'vue';
  import { useRoute } from 'vue-router';
  import { useLocalStorage } from '@/stores/localStorage';
  import { usePageReady } from '@/composables/usePageReady';
  import Button from '@/ui/Button/Index.vue';
  import PlayingCard from '@/ui/PlayingCard/Index.vue';
  import SkillCard from '@/ui/SkillCard/Index.vue';
  import Stepper from '@/ui/Stepper/Index.vue';
  import { weightedPick } from '@/utils/random';

  /**
   * 骆统 · 勤政
   *
   * 面杀时替骆统数牌：每使用或打出三 / 五 / 八张牌，各随机获得一张对应的牌
   * （锁定技，没有「回合内」一说 —— 这一局一路累加，所以清零点在**开局**，不在回合）。
   * 页面就两件事 —— 数（Stepper）+ 摇（三档各自一张），数到哪一档，那一档就亮起来，
   * 亮出的那张就是本次所得，照着从牌堆里摸一张即可。
   *
   * 规则文案与档位都随代码发布（SKILL / TIERS），页面数据只存「数到几」与「各档摇到了什么」：
   * 文案改了立即生效，清除就是回到开局。
   */

  const SKILL = Object.freeze({
    name: '勤政',
    types: ['锁定技'],
    description:
      '你每使用或打出三张牌时，你随机从额外牌堆获得一张【杀】或【闪】；每使用或打出五张牌时，你随机从额外牌堆获得一张【桃】或【酒】；每使用或打出八张牌时，你随机从额外牌堆获得一张【无中生有】或【决斗】。',
  });

  /** 三档：每累计 every 张牌，就从 cards 里随机拿一张（档位与候选牌随代码走） */
  const TIERS = Object.freeze([
    { every: 3, cards: Object.freeze(['杀', '闪']) },
    { every: 5, cards: Object.freeze(['桃', '酒']) },
    { every: 8, cards: Object.freeze(['无中生有', '决斗']) },
  ]);

  usePageReady();

  const route = useRoute();
  const ls = useLocalStorage();

  /* ── 页面数据（key = 路由全路径，跟着「清除本页数据」一起走）──
     qty   —— 这一局已使用 / 打出的牌数
     rolls —— 各档摇到的那张牌，记成 { <档位>: { qty, card } }：qty 是「摇它时数到了第几张」 */
  ls.load(route.fullPath, { qty: 0, rolls: {} });

  const qty = computed({
    get: () => ls.pageData.qty ?? 0,
    set: value => {
      ls.pageData.qty = value;
    },
  });

  const rolls = computed(() => ls.pageData.rolls ?? {});

  /** 摇一张：候选牌等权重，抽到哪张算哪张 */
  function rollCard(tier) {
    return (
      weightedPick(
        tier.cards.map(name => ({ name })),
        { idKey: 'name' }
      )[0]?.name ?? ''
    );
  }

  /**
   * 到档就摇一次，摇到的**记进页面数据**（记的是哪一档、数到第几张时摇的、摇到哪张）。
   *
   * 落进页面数据是为了刷新不换牌：这是替玩家从牌堆里摸的那一张，摸都摸出来了，
   * 页面一刷就变成另一张，那这一摇就不作数了。同一次计数里也顺带定住 ——
   * 页面重渲染多少回都照旧，只有「数」真的变了、且这一档在新数上又够着了一次，才重摇。
   * 回退再回同一档（3 → 4 → 3）也不重摇：摇过的就是摇过了。
   */
  function syncRolls() {
    const store = ls.pageData.rolls;
    for (const tier of TIERS) {
      const key = String(tier.every);
      const reached = qty.value > 0 && qty.value % tier.every === 0;
      if (!reached) continue;
      if (store[key]?.qty === qty.value) continue;
      store[key] = { qty: qty.value, card: rollCard(tier) };
    }
  }

  // immediate：这一局是接着上次数的（刷新 / 回到本页），先把缺的那一摇补上
  watch(qty, syncRolls, { immediate: true });

  /**
   * 三档的当前状态：到没到、到了摇出哪一张。
   *
   * gained 认「这一摇的数就是当前这个数」——不认的话，页面数据里上一次路过这一档留下的牌
   * 会被当成这一次的（摇是 syncRolls 的事，这里只负责把摇到的画出来）。
   * 0 张不算触发：0 是 3/5/8 的公倍数，不排掉一进页面就三档齐亮。
   */
  const tiers = computed(() =>
    TIERS.map(tier => {
      const reached = qty.value > 0 && qty.value % tier.every === 0;
      const roll = rolls.value[String(tier.every)];
      const gained = reached && roll?.qty === qty.value ? roll.card : '';
      return {
        every: tier.every,
        reached,
        cards: tier.cards.map(name => ({ name, gained: name === gained })),
      };
    })
  );

  /** 清除：回到开局 —— 数与摇过的牌一起清（下一局重新从 0 数、到档重新摇） */
  function clear() {
    ls.pageData.qty = 0;
    ls.pageData.rolls = {};
  }
</script>

<template>
  <div class="page">
    <SkillCard :skill="SKILL" />

    <section class="luo-tong__board">
      <Stepper
        v-model="qty"
        class="luo-tong__qty"
        label="本局已出牌数"
        suffix="张"
        :min="0"
      />

      <p class="luo-tong__hint">
        每数到 3 / 5 / 8 张就摇一次，亮着的那张就是本次所得。
      </p>

      <ul class="luo-tong__tiers">
        <li
          v-for="tier in tiers"
          :key="tier.every"
          class="lt-tier"
          :class="{ 'is-reached': tier.reached }"
        >
          <span class="lt-tier__every">每 {{ tier.every }} 张</span>

          <div class="lt-tier__cards">
            <PlayingCard
              v-for="card in tier.cards"
              :key="card.name"
              variant="row"
              :name="card.name"
              :selected="card.gained"
            />
          </div>
        </li>
      </ul>

      <div class="luo-tong__actions">
        <Button variant="ghost" :disabled="qty === 0" @click="clear">
          清除
        </Button>
      </div>
    </section>
  </div>
</template>

<style scoped lang="less">
  /* 内容超一屏：页面根元素自建滚动容器（#app 本身不滚） */
  .page {
    height: 100%;
    /* 页边距：左右 = --content-padding（16px）；上下 = --space-4 叠加安全区 */
    padding: calc(var(--safe-area-top) + var(--space-4)) var(--content-padding)
      calc(var(--safe-area-bottom) + var(--space-4));
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;

    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  /* ================================================================
   数牌板 —— 计数、三档、收尾动作归在一块面板里
   ================================================================ */
  .luo-tong__board {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-4);
    background-color: var(--bg-surface);
    border: var(--border-thin) solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
  }

  .luo-tong__qty {
    /* 计数是本页的主操作，独占一整行（标题在上、控件在下不折行） */
    gap: var(--space-3);
  }

  .luo-tong__hint {
    margin: 0;
    font-size: var(--text-xs);
    line-height: var(--leading-relaxed);
    color: var(--text-secondary);
  }

  /* ================================================================
   三档：一行一档 —— 左边「每 N 张」，右边这一档的两张候选牌
   ================================================================ */
  .luo-tong__tiers {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .lt-tier {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    border: var(--border-thin) solid var(--border-light);
    border-radius: var(--radius-md);
    transition:
      border-color var(--duration-normal) var(--ease-out),
      box-shadow var(--duration-normal) var(--ease-out);

    /* 数到这一档：金描边 + 金辉光（不上金底 —— 摇到的那枚牌签本身就是淡金底，
       两块叠在一起就分不出哪枚是答案了） */
    &.is-reached {
      border-color: var(--accent-gold);
      box-shadow: var(--shadow-glow-gold);
    }
  }

  /* 档位说明：定宽让三行的左缘对齐（「每 3 张」与「每 8 张」的位数一样，仍按等宽数字排） */
  .lt-tier__every {
    flex: none;
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    font-variant-numeric: var(--font-nums);
    letter-spacing: 0.02em;
    color: var(--text-secondary);
    transition: color var(--duration-normal) var(--ease-out);
  }

  .lt-tier.is-reached .lt-tier__every {
    color: var(--text-primary);
  }

  /* 两张候选牌签：窄屏放不下就换行，不撑破这一行 */
  .lt-tier__cards {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    min-width: 0;
  }

  .luo-tong__actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
</style>
