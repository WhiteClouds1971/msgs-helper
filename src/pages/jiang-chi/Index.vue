<script setup>
  import { computed, defineAsyncComponent, ref, watch } from 'vue';
  import { useRoute } from 'vue-router';
  import Select from '@/ui/Select/Index.vue';
  import SearchSelect from '@/ui/SearchSelect/Index.vue';
  import Button from '@/ui/Button/Index.vue';
  import { usePageReady } from '@/composables/usePageReady';
  import { useMessage } from '@/composables/useMessage';
  import { useLocalStorage } from '@/stores/localStorage';
  import { createRecord, exportRecords } from '@/api/jiang-chi';
  import { fileStamp, saveBlob } from '@/utils/download';
  import { addHeroToCache, loadHeroes, searchHeroes } from './data.js';

  // 将池胜率统计 —— 隐藏页
  // · 不注册进 menus.js：主页无卡片、全局搜索也搜不到
  // · 路由含 6 位随机段（见 src/pages/index.js），防止无关人员直达
  // · 空白布局：无装饰、无教学导览
  usePageReady();

  /* 进页面就把武将名单拉回来（一次会话只拉一次，见 ./data.js）——
     等用户点开搜索框才拉的话，那一下会既等网络又等建索引 */
  loadHeroes();

  /**
   * 将池模式 —— 单一事实源
   *
   * value    持久化用的稳定标识（改 label 不影响已存的数据），label 才是给人看的；
   *          顺序即下拉列表顺序。
   * component 该模式专属的表单组件 —— 懒加载，只有选中它时才会去下载那一块。
   *          必须用 defineAsyncComponent 包一层：模板里 <component :is> 拿到裸函数会
   *          当成「函数式组件」去渲染（返回 Promise 直接渲染不出来），而不是异步加载器。
   *          新增一个模式：这里补一条，再去 components/ 建同名组件，别处不用改。
   */
  const MODES = Object.freeze([
    {
      label: '斗地主',
      value: 'dou-di-zhu',
      component: defineAsyncComponent(
        () => import('./components/DouDiZhuForm.vue')
      ),
    },
    {
      label: '军争',
      value: 'jun-zheng',
      component: defineAsyncComponent(
        () => import('./components/JunZhengForm.vue')
      ),
    },
    {
      label: '团战',
      value: 'tuan-zhan',
      component: defineAsyncComponent(
        () => import('./components/TuanZhanForm.vue')
      ),
    },
  ]);

  /**
   * 将池 —— 暂时是占位名（将池1 ~ 将池8），等真实划分定下来再替换
   *
   * 与 MODES 同一套规矩：value 是稳定标识、label 才是给人看的 ——
   * 以后换成「标准 / 风 / 火…」时只改 label，已存数据里的 value 不受影响。
   */
  const POOLS = Object.freeze(
    Array.from({ length: 8 }, (_, index) => ({
      label: `将池${index + 1}`,
      value: `jiang-chi-${index + 1}`,
    }))
  );

  const route = useRoute();
  const ls = useLocalStorage();

  /* ── 页面数据 ──
   上次选中的模式与将池存在「本页的页面数据」里（动态 key = 路由 fullPath）：
   刷新、重进都还在；控制台「清除本页数据」会连它们一起复位。
   两者都是一局里不怎么变的选择，记住了下次不用重挑 */
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

  /** 当前模式专属的表单组件；没选模式时为空（那一块就不占位） */
  const modeForm = computed(
    () => MODES.find(item => item.value === mode.value)?.component ?? null
  );

  /* ── 本次要新增的这条记录 ──
   武将、身份/位置、对局结果都是随用随填、点「新增」后就该清空的东西，
   所以只是本地状态，不进页面数据（页面数据里只留「模式 / 将池」这种不用重挑的选择）。
   模式 / 将池 / 武将 三项必填 —— 组件上的 required 只画那个朱砂星号，
   真正的拦截在 handleAdd 里发请求之前 */
  const hero = ref('');
  /** 身份（斗地主 / 军争）或位置（团战）—— 各模式值域不同，变量名取中性的 role */
  const role = ref('');
  /** 对局结果：赢 / 输 */
  const result = ref('');

  /* 换模式 = 换一套身份/位置，必须清空：留着上一个模式的值，
     轻则下拉显示成占位但值还在，重则把「地主」记进军争的记录里 */
  watch(mode, () => {
    role.value = '';
    result.value = '';
  });

  /* ── 提交 ── */

  const message = useMessage();

  /** 请求在飞 —— 按钮禁用，免得手快连点把一局记成两局 */
  const submitting = ref(false);

  /**
   * 身份（位置）→ 中文名 + 返回体里那对字段的前缀
   *
   * key 就是各模式表单里的 value（稳定标识），前缀与后端 RoleCounter 的列前缀
   * 一一对应（见 server/…/service/RoleCounter.java）—— 用来把接口返回的战绩
   * 翻译成「3 胜 1 负」给用户看。
   * 新增一个模式多一套身份时，这里要跟着补。
   */
  const ROLE_DISPLAY = Object.freeze({
    landlord: { label: '地主', field: 'landlord' },
    farmer: { label: '农民', field: 'farmer' },
    lord: { label: '主公', field: 'lord' },
    loyalist: { label: '忠臣', field: 'loyalist' },
    rebel: { label: '反贼', field: 'rebel' },
    traitor: { label: '内奸', field: 'traitor' },
    1: { label: '一号位', field: 'seat1' },
    2: { label: '二号位', field: 'seat2' },
    3: { label: '三号位', field: 'seat3' },
    4: { label: '四号位', field: 'seat4' },
  });

  /** 成功提示：记了一局就报这一局之后的总战绩；只登记归属就直说 */
  function describeSaved(payload, record) {
    const hero = record?.hero ?? payload.hero;
    const display = ROLE_DISPLAY[payload.role];
    if (!display) return `已登记「${hero}」的所属将池`;

    const win = record?.[`${display.field}Win`] ?? 0;
    const lose = record?.[`${display.field}Lose`] ?? 0;
    const outcome = payload.result === 'lose' ? '输' : '赢';
    return `${hero} · ${display.label} ${outcome}，累计 ${win} 胜 ${lose} 负`;
  }

  async function handleAdd() {
    if (submitting.value) return;

    // 标了必填的三项空着就不发请求：省一次往返，本地提示也比后端那句更贴上下文
    const empty = [
      [mode.value, '模式'],
      [pool.value, '将池'],
      [hero.value.trim(), '武将'],
    ].find(([value]) => !value);
    if (empty) {
      message.warning(`请先选择${empty[1]}`);
      return;
    }

    const payload = {
      mode: mode.value,
      pool: pool.value,
      hero: hero.value.trim(),
      role: role.value,
      result: result.value,
    };

    submitting.value = true;
    try {
      const record = await createRecord(payload);
      message.success(describeSaved(payload, record));

      // 刚记下的武将并进候选缓存：不刷新页面也能立刻搜到（新武将插到最前）
      addHeroToCache(record?.hero ?? payload.hero);

      // 这一局的三个字段用完就清；模式与将池留着 —— 下一局多半还是它们
      hero.value = '';
      role.value = '';
      result.value = '';
    } catch {
      // 失败提示由 @/utils/request 的拦截器统一弹（含后端返回的 400 文案），这里只管收尾
    } finally {
      submitting.value = false;
    }
  }

  /* ── 导出 ── */

  /** 导出在飞 —— 与「新增」同样的道理：连着点几下别导出好几份 */
  const exporting = ref(false);

  /**
   * 导出全量武将胜率统计（后端填好的 xlsx）
   *
   * 不挑模式 / 将池：模板里「将池」本身就是一列，一个武将在一个将池下算一条，
   * 整张表就是一份完整报表 —— 在后端筛反而会漏掉别家将池的武将。
   */
  async function handleExport() {
    if (exporting.value) return;

    exporting.value = true;
    try {
      // 文件名在前端起：导出接口回的是裸文件流，按 blob 取不到响应头里的
      // Content-Disposition（见 @/utils/request 的拆包规则），后端那份名字只是给直链用的
      saveBlob(await exportRecords(), `武将胜率统计-${fileStamp()}.xlsx`);
      message.success('已导出武将胜率统计');
    } catch {
      // 失败提示由 @/utils/request 的拦截器统一弹，这里只管收尾
    } finally {
      exporting.value = false;
    }
  }
</script>

<template>
  <div class="jiang-chi">
    <!-- 内容限宽居中：本页是「表单 + 列表」的窄栏，桌面端不让控件横向摊开 -->
    <div class="jiang-chi__inner">
      <!-- 提示：身份 / 对局留空是「登记所属将池」这条路，不是漏填 —— 放在最上方先说清楚 -->
      <p class="jiang-chi__hint">
        只输入「武将 + 将池」、不填身份与对局，可以修改该武将所在的将池
      </p>

      <div class="jiang-chi__form">
        <!-- 第一行：模式 -->
        <Select
          v-model="mode"
          class="jiang-chi__mode"
          label="模式"
          required
          placeholder="请选择模式"
          :options="MODES"
        />

        <!-- 第二行：只能从这 8 个里挑（占位名，等真实划分定下来再换） -->
        <Select
          v-model="pool"
          class="jiang-chi__pool"
          label="将池"
          required
          placeholder="请选择将池"
          :options="POOLS"
        />

        <!-- 第三行：可输入、可搜索、也可自己填值 -->
        <!-- debounce 给 0：@/ui/SearchSelect 默认那 250ms 是留给网络请求的，
             而这里是在本地缓存里搜（0.1ms），白等反而是拖手感 -->
        <SearchSelect
          v-model="hero"
          label="武将"
          required
          placeholder="搜索或直接输入武将"
          :search="searchHeroes"
          :debounce="0"
        />
      </div>

      <!-- 横线：把通用表单与模式专属表单分开（金渐变装饰线，与斗地主页标题下那条同版式） -->
      <hr class="jiang-chi__divider" />

      <!-- 模式专属表单：每个模式一个组件，跟着「模式」切换挂载
           （:key 让换模式时整块重挂载，各模式自己的字段不会串味） -->
      <component
        :is="modeForm"
        v-if="modeForm"
        :key="mode"
        v-model:role="role"
        v-model:result="result"
        class="jiang-chi__mode-form"
      />

      <!-- 操作区：表单之外的另一块，放这条记录的动作 -->
      <div class="jiang-chi__actions">
        <Button
          class="jiang-chi__add"
          :disabled="submitting"
          @click="handleAdd"
        >
          {{ submitting ? '记录中…' : '新增' }}
        </Button>
        <Button
          class="jiang-chi__export"
          variant="ghost"
          :disabled="exporting"
          @click="handleExport"
        >
          {{ exporting ? '导出中…' : '导出' }}
        </Button>
      </div>

      <main class="jiang-chi__body" />
    </div>
  </div>
</template>

<style scoped lang="less">
  .jiang-chi {
    /* #app 是 overflow: hidden 的固定高度壳：滚动改由本页承担 */
    height: 100%;
    /* 页边距：左右 = --content-padding（设计系统页面左右留白）；
     上下 = --space-4（16px）叠加刘海屏 / 底部指示条安全区 */
    padding: calc(var(--safe-area-top) + var(--space-4)) var(--content-padding)
      calc(var(--safe-area-bottom) + var(--space-4));
    background: var(--bg);
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
  }

  /* 窄栏：宽度取设计系统的移动端上限（--max-width），桌面端居中不外扩 */
  .jiang-chi__inner {
    max-width: var(--max-width);
    margin: 0 auto;
  }

  /* 顶部提示：辅助标注的字号与颜色（同五禽戏页 .wqx__hint），只占一行、不与表单抢视线 */
  .jiang-chi__hint {
    margin: 0 0 var(--space-4);
    font-size: var(--text-xs);
    line-height: var(--leading-relaxed);
    letter-spacing: 0.02em;
    color: var(--text-tertiary);
  }

  /* 表单：三行等距堆叠 */
  .jiang-chi__form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  /* 横线：竹简编绳意象的金渐变（--decorative-line），宽度收到 60% 居中，
     与斗地主页「模式专属武将技能」标题下那条同一个版式 */
  .jiang-chi__divider {
    width: 60%;
    height: var(--border-medium);
    margin: var(--space-6) auto;
    border: none;
    background: var(--decorative-line);
  }

  /* 模式专属表单：字段样式归 @/ui/RadioGroup（身份 / 位置 / 对局 值域都只有两三枚，
     摊成一行按钮比收进下拉少点一下），这里只给整块的排布 ——
     各模式组件只画字段，行距与上下留白统一由页面给 */
  .jiang-chi__mode-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    margin-bottom: var(--space-6);
  }

  /* 操作区：独立成块（与表单隔开一段），动作靠右 */
  .jiang-chi__actions {
    display: flex;
    /* stretch：幽灵按钮（视觉 32px）被拉到与主按钮同高，一行两个按钮齐平 */
    align-items: stretch;
    justify-content: flex-end;
    gap: var(--space-3);
    margin-top: var(--space-6);
  }

  /* 两个按钮的尺寸与按压反馈都归 @/ui/Button，本页只给它们统一的宽度，
     让「新增 / 导出」看着是一对 */
  .jiang-chi__add,
  .jiang-chi__export {
    min-width: 72px;
  }

  /* ── 标题占同一列宽 ──
     标题宽度本来随内容走：带必填星号的（模式* / 将池* / 武将*）比不带星号的
     （身份 / 对局）宽一个星号，控件左边线就跟着差十来像素。
     这里把标题的下限统一到 3em（在 --text-sm 下约 42px，容得下「两字 + 星号」），
     整页所有字段的控件左边线就齐了。
     只是下限不是定宽：将来出现更长的标题，它会自己长出去，不会挤坏文字 */
  .jiang-chi__inner :deep(.select-field__label),
  .jiang-chi__inner :deep(.search-select__label),
  .jiang-chi__inner :deep(.radio-field__label) {
    min-width: 3em;
  }

  /* ── 收掉控件自带的触控热区外扩 ──
     @/ui/Select 的触发框与 @/ui/Button 都靠一个绝对定位的 ::after 往上下各外扩 4px
     （幽灵按钮是 6px），把热区从 36px 补到 44px（设计系统 §3.8 的下限），视觉上不可见。
     本页是「一行一个控件、行距 16px」的窄栏，不需要这层外扩 —— 统一收进视觉框，
     行与行之间不再有看不见的 ±4 侵入。
     模式表单里的 @/ui/RadioGroup 本来就不带这层外扩，无需在此收。
     代价：这些控件的触控高度就是 36px，低于 §3.8 的下限，本页有意为之。
     （武将行的 SearchSelect 也外扩 4px，但那两条贴边窄条是「点外框外沿也能聚焦
     输入框」的入口，不属于纯热区冗余，本页保留） */
  .jiang-chi__mode :deep(.select-field__trigger)::after,
  .jiang-chi__pool :deep(.select-field__trigger)::after,
  .jiang-chi__add::after,
  .jiang-chi__export::after {
    inset: 0;
  }
</style>
