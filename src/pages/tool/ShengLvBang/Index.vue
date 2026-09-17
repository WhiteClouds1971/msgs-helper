<script setup>
  import { computed, ref, watch } from 'vue';
  import { useRoute } from 'vue-router';
  import Select from '@/ui/Select/Index.vue';
  import Tabs from '@/ui/Tabs/Index.vue';
  import Table from '@/ui/Table/Index.vue';
  import { usePageReady } from '@/composables/usePageReady';
  import { useLocalStorage } from '@/stores/localStorage';
  import { listHeroStats, listRoleStats } from '@/api/jiang-chi';
  import {
    MODE_OPTIONS,
    POOL_OPTIONS,
    labelOf,
    roleLabelOf,
    rolesOf,
  } from '@/pages/jiang-chi/modes.js';
  import { formatRate } from '@/pages/jiang-chi/rates.js';

  /**
   * 胜率榜 —— 「这个将池 + 这个模式 + 这个身份（位置）下，各武将打得怎么样」
   *
   * 数据全在后端（同一个 /jiang-chi 接口组，口径见 api/jiang-chi.js），本页只做三件事：
   * 挑口径（模式 / 将池两个下拉）、切身份（页签）、把数字画出来。
   *
   * 两个接口分工：
   *   · role-stats —— 按将池问一次，回三个模式各身份的汇总（条数是死的，切模式 / 切身份不必再问）。
   *     这里只用它画页签下那一行「这个身份的历史胜率」
   *   · hero-stats —— 按 (将池, 模式, 身份) 问，回该身份下<b>全部</b>武将的战绩（胜率从高到低，
   *     只算现在还留在该将池里的）。切页签就得重问一次
   *
   * 值域（模式 / 将池 / 身份）取 @/pages/jiang-chi/modes.js —— 与记录页同一份常量，
   * 那边记一局，这边就是对得上的数。
   *
   * 版式：<b>整页不滚</b> —— 下拉、页签、历史胜率始终在视野里，武将多了滚的是表格自己
   * （表头吸顶，见 @/ui/Table 的 fill）。
   */
  usePageReady();

  const route = useRoute();
  const ls = useLocalStorage();

  /* ── 页面数据 ──
   上次选中的模式与将池留在「本页的页面数据」里（动态 key = 路由 fullPath）：
   刷新、重进都还在；控制台「清除本页数据」会连它们一起复位。
   身份（页签）不进页面数据：它跟着模式走，本就是个看一遍就换的东西 */
  ls.load(route.fullPath, { mode: '', pool: '' });

  /** 页面数据里的一个字段 ⇄ 组件的 v-model */
  function pageField(key) {
    return computed({
      get: () => ls.pageData[key] ?? '',
      set: value => {
        ls.pageData[key] = value;
      },
    });
  }

  const mode = pageField('mode');
  const pool = pageField('pool');

  /* ── 身份（位置）页签 ──
   页签就是当前模式的全部身份 / 位置（斗地主两档、军争四档、团战四个座位） */
  const roleItems = computed(() => rolesOf(mode.value));

  /** 当前选中的身份（位置）；空串 = 还没得选（没挑模式） */
  const role = ref('');

  /* 换模式 = 换一整套身份，必须重挑：留着上一个模式的值，
   轻则对不上号（页签都不亮），重则拿着「地主」去查军争的数 */
  watch(
    roleItems,
    items => {
      if (!items.some(item => item.value === role.value)) {
        role.value = items[0]?.value ?? '';
      }
    },
    { immediate: true }
  );

  /* ── 历史胜率（该将池下各身份，一次全拉） ──
   口径与记录页「身份 / 位置」选项后面那个百分比完全一致：该身份的胜场 ÷
   该身份自己的场数，各身份各算各的（见 @/pages/jiang-chi/rates.js 与后端 JiangChiRoleStatService）。

   **这是历史口径**：不按 in_pool 过滤 —— 换过将池的武将在这个池子里留下的对局照样算进去。
   与下方表格（只列仍在将池中的武将）是两套范围，数字对不上是正常的，别去「对齐」它们 */
  const roleStats = ref([]);

  /** 已经问过第几次 —— 慢响应回来时用户可能早换了将池，只认最后一次的结果 */
  let statsSeq = 0;

  async function refreshRoleStats() {
    const seq = ++statsSeq;
    const currentPool = pool.value;

    // 没选将池就没有口径可言：清空、也不发请求
    if (!currentPool) {
      roleStats.value = [];
      return;
    }

    try {
      const stats = await listRoleStats(currentPool);
      if (seq === statsSeq) roleStats.value = stats;
    } catch {
      // 失败提示由 @/utils/request 的拦截器弹；这里只管收尾 ——
      // 留着上一个将池的数是错的，宁可什么都没有
      if (seq === statsSeq) roleStats.value = [];
    }
  }

  /* 首屏：将池是从页面数据里恢复的，记住过就立刻拉一次；换将池 = 换一套口径，必须重拉 */
  refreshRoleStats();
  watch(pool, () => refreshRoleStats());

  /**
   * 当前页签这个身份的历史战绩；这个将池下压根没这条（不认识的身份）时为 null。
   *
   * 注意<b>一场没打过</b>不是 null：后端照样回一条（win / lose / games 都是 0），
   * 只是 rate 为 null —— 那种情况按「暂无历史胜率」画（见模板里的 v-if="roleRate"），
   * 别画成「0 胜 0 负 0 场」再接一个空的百分比。
   */
  const currentStat = computed(
    () =>
      roleStats.value.find(
        stat => stat?.mode === mode.value && stat?.role === role.value
      ) ?? null
  );

  /** 历史胜率文字（如 66.67%）；一场没打过或汇总还没回来时是空串 —— 模板据此二选一 */
  const roleRate = computed(() => formatRate(currentStat.value?.rate));

  /* ── 武将战绩（按 将池 + 模式 + 身份 问，切页签重问一次） ──
   不传 limit：这个口径下有多少武将就要多少（后端默认不截断），
   条数本来就被「某个将池 + 某个身份」框住了。

   **只列现在还待在这个将池里的武将**（后端按 in_pool = 1 过滤）：换过将池的武将
   在这个池子留下的是历史战绩，拿来和池子里的现任比没有意义 —— 那些场次只进上面那行历史胜率 */
  const heroes = ref([]);
  const loading = ref(false);

  /** 与 statsSeq 同一个道理：连点几下页签时，只认最后一次的结果 */
  let heroSeq = 0;

  async function refreshHeroes() {
    const seq = ++heroSeq;

    // 三样缺一不可 —— 口径不完整时不问、也不沿用上一套数
    if (!pool.value || !mode.value || !role.value) {
      heroes.value = [];
      loading.value = false;
      return;
    }

    loading.value = true;
    try {
      const list = await listHeroStats({
        pool: pool.value,
        mode: mode.value,
        role: role.value,
      });
      if (seq === heroSeq) heroes.value = list ?? [];
    } catch {
      // 失败提示由 @/utils/request 的拦截器拦下弹了，这里只管收尾
      if (seq === heroSeq) heroes.value = [];
    } finally {
      if (seq === heroSeq) loading.value = false;
    }
  }

  refreshHeroes();
  watch([pool, mode, role], () => refreshHeroes());

  /**
   * 表格列 —— 就三列：武将、该身份下的总场数、胜率。
   *
   * 三列一律左对齐（列名与数据同一侧，扫一列时视线不用来回跳）；
   * 「总场数」「胜率」给足固定宽度，武将列只拿剩下的 —— 不定宽的话三列平分，
   * 武将那一列会空出一大截，两列数字却挤在一起。
   *
   * 宽度写 rem 而不是 em：这两列的表头字号是 --text-xs（12px），em 会按表头的字号算，
   * 写 7em 实际只有 84px —— 数字那一列「100.00%」正好顶到边。rem 与字号无关，说是多少就是多少。
   */
  const COLUMNS = Object.freeze([
    { key: 'hero', label: '武将' },
    { key: 'games', label: '总场数', width: '6.5rem' },
    { key: 'rate', label: '胜率', width: '6.5rem' },
  ]);

  /** 表格空态：第一次加载与切页签时都是空的，两种语气要分得开 */
  const emptyText = computed(() =>
    loading.value ? '统计中…' : '该身份下还没有武将战绩'
  );

  /* 页面各处要用的中文名：模式 / 将池取常量，身份取当前模式那一套 */
  const modeLabel = computed(() => labelOf(MODE_OPTIONS, mode.value));
  const poolLabel = computed(() => labelOf(POOL_OPTIONS, pool.value));
  const roleLabel = computed(() => roleLabelOf(mode.value, role.value));
</script>

<template>
  <div class="sheng-lv-bang">
    <!-- 内容限宽居中：本页是「下拉 + 表格」的窄栏，桌面端不让表格横向摊开 -->
    <div class="sheng-lv-bang__inner">
      <!-- 口径两个下拉：模式定身份，将池定这一套数据的统计范围 -->
      <div class="sheng-lv-bang__form">
        <Select
          v-model="mode"
          label="模式"
          placeholder="请选择模式"
          :options="MODE_OPTIONS"
        />

        <Select
          v-model="pool"
          label="将池"
          placeholder="请选择将池"
          :options="POOL_OPTIONS"
        />
      </div>

      <!-- 横线：把「挑口径」与「看数据」分开（金渐变装饰线，与记录页那条同版式） -->
      <hr class="sheng-lv-bang__divider" />

      <!-- 身份 / 位置页签：页签即当前模式下的全部身份，切谁看谁的数据。
           fill：页签条与下方面板一起撑满剩余高度，滚的是面板里那张表 -->
      <Tabs
        v-if="roleItems.length"
        v-model="role"
        class="sheng-lv-bang__tabs"
        label="身份（位置）"
        fill
        :items="roleItems"
      >
        <template #default>
          <div class="sheng-lv-bang__panel">
            <!-- 先交代这个身份在这个将池下打得怎么样：历史胜率与原始战绩。
                 这个数是**历史累计**（role-stats 不按 in_pool 过滤）——
                 换过将池的武将留在这里的对局照样算进去，与下方表格的口径不同，故写明 -->
            <p class="sheng-lv-bang__rate">
              <template v-if="roleRate">
                {{ poolLabel }} · {{ modeLabel }} 的「{{ roleLabel }}」历史胜率
                <span class="sheng-lv-bang__rate-value">
                  {{ roleRate }}
                </span>
                （{{ currentStat.win }} 胜 {{ currentStat.lose }} 负，共
                {{ currentStat.games }} 将次，含已离开该将池的武将）
              </template>
              <template v-else>
                「{{ roleLabel }}」在该将池下还没有战绩，暂无历史胜率
              </template>
            </p>

            <!-- 该身份下的全部武将（只算还留在该将池里的），胜率高的在前；
                 人多的时候滚的是这张表自己，不带动整页 -->
            <Table
              class="sheng-lv-bang__table"
              fill
              :columns="COLUMNS"
              :rows="heroes"
              row-key="hero"
              :empty-text="emptyText"
            >
              <template #cell-rate="{ value }">
                {{ formatRate(value) }}
              </template>
            </Table>

            <p class="sheng-lv-bang__note">
              表内只列目前仍在将池中的武将；总场数 = 该武将在该身份下的胜场 +
              败场，胜率 = 胜场 ÷ 总场数。
            </p>
          </div>
        </template>
      </Tabs>

      <!-- 没挑模式就没身份可切：不画空页签条，直说要先做什么 -->
      <p v-else class="sheng-lv-bang__placeholder">请先选择模式与将池</p>
    </div>
  </div>
</template>

<style scoped lang="less">
  .sheng-lv-bang {
    /* #app 是 overflow: hidden 的固定高度壳 */
    height: 100%;
    /* 页边距：左右 = --content-padding（设计系统页面左右留白）；
     上下 = --space-4（16px）叠加刘海屏 / 底部指示条安全区 */
    padding: calc(var(--safe-area-top) + var(--space-4)) var(--content-padding)
      calc(var(--safe-area-bottom) + var(--space-4));
    /* 整页不滚（滚动交给表格内部，见 @/ui/Table 的 fill）：
       下拉、页签、历史胜率这一行始终留在视野里，一页武将也不会把版式顶跑 */
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* 窄栏：宽度取设计系统的移动端上限（--max-width），桌面端居中不外扩 */
  .sheng-lv-bang__inner {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    width: 100%;
    max-width: var(--max-width);
    margin: 0 auto;
  }

  /* 两个下拉等距堆叠（高度固定，不参与伸缩） */
  .sheng-lv-bang__form {
    display: flex;
    flex: none;
    flex-direction: column;
    gap: var(--space-4);
  }

  /* 横线：竹简编绳意象的金渐变（--decorative-line），宽度收到 60% 居中。
     上下留白比记录页收一档：本页高度要留给表格 */
  .sheng-lv-bang__divider {
    flex: none;
    width: 60%;
    height: var(--border-medium);
    margin: var(--space-4) auto;
    border: none;
    background: var(--decorative-line);
  }

  /* 页签这一块吃掉下拉与横线之外的全部高度（撑开由 @/ui/Tabs 的 fill 负责），
     面板里的三块再自己分：说明与脚注定高，表格拿走剩下的 */
  .sheng-lv-bang__panel {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
  }

  /* 这一行说明：定高，不参与伸缩 */
  .sheng-lv-bang__rate {
    flex: none;
    margin: var(--space-3) 0 0;
    font-size: var(--text-xs);
    line-height: var(--leading-relaxed);
    letter-spacing: 0.02em;
    color: var(--text-secondary);
  }

  /* 胜率本身是这句话的落脚点：比周围大一档、回到浓墨，并给数字等宽 */
  .sheng-lv-bang__rate-value {
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    font-variant-numeric: var(--font-nums);
    color: var(--text-primary);
  }

  /* 表格：拿走面板里剩下的全部高度，多出来的行在表格内部滚（min-height: 0 是前提，
     否则 flex 子项的下限是内容高度，表格会顶破面板、把整页撑出滚动条） */
  .sheng-lv-bang__table {
    flex: 1;
    min-height: 0;
    margin-top: var(--space-3);
  }

  /* 表格口径说明：垫在表下，比正文再退一档（定高，不参与伸缩） */
  .sheng-lv-bang__note {
    flex: none;
    margin: var(--space-2) 0 0;
    font-size: var(--text-xs);
    line-height: var(--leading-relaxed);
    letter-spacing: 0.02em;
    color: var(--text-secondary);
  }

  /* 还没挑模式时的占位：居中、淡墨，不与下面的内容抢视线 */
  .sheng-lv-bang__placeholder {
    flex: none;
    margin: 0;
    padding: var(--space-8) 0;
    font-size: var(--text-sm);
    letter-spacing: 0.02em;
    text-align: center;
    color: var(--text-secondary);
  }
</style>
