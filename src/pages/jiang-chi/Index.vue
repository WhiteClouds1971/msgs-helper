<script setup>
  import { computed, defineAsyncComponent, ref, watch } from 'vue';
  import { useRoute } from 'vue-router';
  import Select from '@/ui/Select/Index.vue';
  import SearchSelect from '@/ui/SearchSelect/Index.vue';
  import Button from '@/ui/Button/Index.vue';
  import { usePageReady } from '@/composables/usePageReady';
  import { useLocalStorage } from '@/stores/localStorage';
  import { searchHeroes } from './data.js';

  // 将池胜率统计 —— 隐藏页
  // · 不注册进 menus.js：主页无卡片、全局搜索也搜不到
  // · 路由含 6 位随机段（见 src/pages/index.js），防止无关人员直达
  // · 空白布局：无装饰、无教学导览
  usePageReady();

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
   字段都标了必填（只做标记，提交校验等「新增」落地时再一起做） */
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
</script>

<template>
  <div class="jiang-chi">
    <!-- 内容限宽居中：本页是「表单 + 列表」的窄栏，桌面端不让控件横向摊开 -->
    <div class="jiang-chi__inner">
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
        <SearchSelect
          v-model="hero"
          label="武将"
          required
          placeholder="搜索或直接输入武将"
          :search="searchHeroes"
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
        <Button class="jiang-chi__add">新增</Button>
        <Button class="jiang-chi__export" variant="ghost">导出</Button>
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

  /* 模式专属表单：字段样式归 @/ui/Select，这里只给整块的排布 ——
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
  .jiang-chi__inner :deep(.search-select__label) {
    min-width: 3em;
  }

  /* ── 收掉控件自带的触控热区外扩 ──
     @/ui/Select 的触发框与 @/ui/Button 都靠一个绝对定位的 ::after 往上下各外扩 4px
     （幽灵按钮是 6px），把热区从 36px 补到 44px（设计系统 §3.8 的下限），视觉上不可见。
     本页是「一行一个控件、行距 16px」的窄栏，不需要这层外扩 —— 统一收进视觉框，
     行与行之间不再有看不见的 ±4 侵入。
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
