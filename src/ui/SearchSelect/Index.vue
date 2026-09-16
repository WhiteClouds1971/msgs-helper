<script setup>
  import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    ref,
    useId,
    watch,
  } from 'vue';

  /**
   * SearchSelect —— 可输入、可联网搜索、也可自己填值的下拉选择（无业务耦合的基础 UI 组件）
   *
   * 与 @/ui/Select 的分工：Select 只能从给定选项里挑；本组件多三件事 ——
   *   · 输入即过滤 —— 候选随输入实时收窄（对着 options 本地过滤）
   *   · 后端搜索   —— 传了 search 就改用它取候选（组件只认
   *                    async (keyword) => [{ label, value }]，
   *                    怎么请求、要不要打后端由使用方决定；输入按 debounce 防抖）
   *   · 手动填值   —— allowCustom 打开时，候选里没有的也能用：列表末行
   *                    「使用「xxx」」点一下即采纳，或直接回车 / 失焦采纳
   *                    （命中选项就采纳选项的 value，否则采纳原文）
   *
   * 刚聚焦还没打字时给全量候选（方便浏览挑选），一旦开始打字就按输入过滤。
   * 清空输入框 = 清空取值。
   *
   * 结构契约（供测试与使用方布局引用）：
   *   .search-select            —— 根元素（标题 + 输入框 的横向组合）
   *   .search-select__label     —— 字段标题（不传 label 则不渲染）
   *   .search-select__box       —— 输入框外框（label 元素：点外框任意处都能聚焦输入框）
   *   .search-select__input     —— 真正的输入框（role="combobox"）
   *   .search-select__panel     —— 候选浮层（role="listbox"）
   *   .search-select__option    —— 单条候选（role="option"）
   *   .search-select__empty     —— 无候选 / 搜索中的占位行
   */
  const props = defineProps({
    /** v-model 绑定值；手动填值时就是输入框里的文字 */
    modelValue: { type: [String, Number], default: '' },
    /** 本地候选：[{ label, value }] 或纯字符串数组 */
    options: { type: Array, default: () => [] },
    /** 后端搜索：async (keyword) => [{ label, value }]；给了它就不再本地过滤 */
    search: { type: Function, default: null },
    /** 字段标题；留空则不渲染标题行 */
    label: { type: String, default: '' },
    /** 必填：标题后加朱砂星号，并透出 aria-required */
    required: { type: Boolean, default: false },
    /** 空值时的占位文案 */
    placeholder: { type: String, default: '请选择' },
    /** 禁用 */
    disabled: { type: Boolean, default: false },
    /** 允许手动填值（候选外的内容也能用） */
    allowCustom: { type: Boolean, default: true },
    /** 无候选时的提示文案 */
    emptyText: { type: String, default: '无匹配项' },
    /** 后端搜索的防抖时长（ms） */
    debounce: { type: Number, default: 250 },
  });

  const emit = defineEmits(['update:modelValue']);

  const inputId = useId();
  const listId = `${inputId}-list`;

  /** 候选统一成 { label, value }：允许直接喂字符串数组 */
  function normalize(list) {
    return (list ?? []).map(item =>
      typeof item === 'string' ? { label: item, value: item } : item
    );
  }

  const localOptions = computed(() => normalize(props.options));

  /** 值 → 显示文字：优先取同值选项的 label，找不到就显示值本身（手动填的） */
  function labelOf(value) {
    if (value === '' || value === undefined || value === null) return '';
    const hit = localOptions.value.find(option => option.value === value);
    return hit ? hit.label : String(value);
  }

  /** 输入框里的文字 */
  const keyword = ref(labelOf(props.modelValue));
  /** 是否展开候选 */
  const open = ref(false);
  /** 本次聚焦后是否手打过字 —— 没打字时给全量候选，方便浏览 */
  const dirty = ref(false);
  /** 高亮的下标 */
  const activeIndex = ref(-1);
  /** 后端搜索结果；没传 search 时恒为 null */
  const remoteList = ref(null);
  const loading = ref(false);

  const boxRef = ref(null);
  const inputRef = ref(null);
  let searchTimer = null;
  let requestSeq = 0;
  /** 是否是「选中后主动失焦」——那种 blur 不能再拿旧值回填文字 */
  let pickingBlur = false;

  /* 外部改值（含控制台清除本页数据后的重挂载）→ 同步输入框文字 */
  watch(
    () => props.modelValue,
    value => {
      if (dirty.value) return;
      keyword.value = labelOf(value);
    }
  );

  /** 候选：传了 search 用后端结果，否则本地过滤 */
  const candidates = computed(() => {
    if (props.search) return remoteList.value ?? [];
    const all = localOptions.value;
    if (!dirty.value) return all;
    const key = keyword.value.trim().toLowerCase();
    if (!key) return all;
    return all.filter(option =>
      String(option.label).toLowerCase().includes(key)
    );
  });

  /** 输入内容是否已是一条现成候选（大小写不敏感）*/
  const exactHit = computed(() => {
    const key = keyword.value.trim().toLowerCase();
    if (!key) return null;
    return (
      candidates.value.find(
        option => String(option.label).toLowerCase() === key
      ) ?? null
    );
  });

  /** 该不该给「使用原文」这一行：允许手动填 + 打过字 + 有内容 + 候选里没有一模一样的 */
  const showCustom = computed(
    () =>
      props.allowCustom &&
      dirty.value &&
      keyword.value.trim() !== '' &&
      !exactHit.value
  );

  /** 列表里真正要画的行：候选 + 可选的「使用原文」 */
  const rows = computed(() => {
    const list = candidates.value.map(option => ({ ...option, custom: false }));
    if (showCustom.value) {
      list.push({
        label: keyword.value.trim(),
        value: keyword.value.trim(),
        custom: true,
      });
    }
    return list;
  });

  /* 候选一变（打字 / 展开 / 远端返回）→ 高亮回到第一条 */
  watch([rows, open], () => {
    activeIndex.value = open.value && rows.value.length ? 0 : -1;
  });

  /* 高亮项滚进可视区（键盘操作时列表可能很长） */
  watch(activeIndex, async index => {
    if (index < 0 || !open.value) return;
    await nextTick();
    const el = boxRef.value?.querySelectorAll('.search-select__option')[index];
    el?.scrollIntoView?.({ block: 'nearest' });
  });

  /* ── 后端搜索 ──────────────────────────────────────────────
   每次请求带序号，回来的旧响应直接丢弃（防抖 + 竞态双保险） */
  function runSearch(term) {
    const seq = ++requestSeq;
    loading.value = true;
    Promise.resolve(props.search(term))
      .then(result => {
        if (seq === requestSeq) remoteList.value = normalize(result);
      })
      .catch(() => {
        // 请求失败不打断输入：当作没有候选，用户仍可手动填值
        if (seq === requestSeq) remoteList.value = [];
      })
      .finally(() => {
        if (seq === requestSeq) loading.value = false;
      });
  }

  function scheduleSearch(term, immediate = false) {
    if (!props.search) return;
    clearTimeout(searchTimer);
    if (immediate) {
      runSearch(term);
      return;
    }
    searchTimer = setTimeout(() => runSearch(term), props.debounce);
  }

  /* ── 取值 ── */
  function commit(value) {
    if (value === props.modelValue) return;
    emit('update:modelValue', value);
  }

  /** 选中一行（候选或「使用原文」）：回填文字、收起、交出焦点（收键盘） */
  function pick(row) {
    keyword.value = row.label;
    dirty.value = false;
    open.value = false;
    activeIndex.value = -1;
    // 主动失焦只为收键盘：此刻 props.modelValue 还是旧值，
    // blur 处理器若照常按旧值回填，会把刚选中的文字冲掉
    pickingBlur = true;
    inputRef.value?.blur();
    pickingBlur = false;
    commit(row.value);
  }

  /* ── 交互 ── */
  function handleFocus() {
    if (props.disabled) return;
    open.value = true;
    dirty.value = false;
    // 首次展开：远端列表还没拿过就先拉一批（keyword 为空 = 取全部/热门）
    if (props.search && remoteList.value === null) scheduleSearch('', true);
  }

  function handleInput(event) {
    keyword.value = event.target.value;
    dirty.value = true;
    open.value = true;
    scheduleSearch(keyword.value);
    // 清空输入框 = 清空取值
    if (keyword.value.trim() === '') commit('');
  }

  function handleBlur() {
    if (pickingBlur) return;
    open.value = false;
    activeIndex.value = -1;
    const text = keyword.value.trim();

    if (text && dirty.value) {
      // 手打的内容恰好是某条候选 → 采纳它的 value；否则才当作用户自己的值
      const hit = candidates.value.find(
        option => String(option.label).toLowerCase() === text.toLowerCase()
      );
      if (hit) {
        keyword.value = hit.label;
        dirty.value = false;
        commit(hit.value);
        return;
      }
      if (props.allowCustom) {
        keyword.value = text;
        dirty.value = false;
        commit(text);
        return;
      }
    }

    // 没打字 / 不允许手动填：回到当前值的显示文字
    dirty.value = false;
    keyword.value = labelOf(props.modelValue);
  }

  function move(step) {
    const total = rows.value.length;
    if (!total) {
      activeIndex.value = -1;
      return;
    }
    const next = activeIndex.value + step;
    activeIndex.value = next < 0 ? total - 1 : next >= total ? 0 : next;
  }

  function handleKeydown(event) {
    if (props.disabled) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open.value) {
        open.value = true;
        return;
      }
      move(event.key === 'ArrowDown' ? 1 : -1);
      return;
    }

    if (event.key === 'Enter') {
      if (!open.value) {
        event.preventDefault();
        open.value = true;
        return;
      }
      event.preventDefault();
      const row = rows.value[activeIndex.value];
      if (row) {
        pick(row);
        return;
      }
      // 一条候选都没有：回车即采纳输入内容（手动填值的快捷路径）
      const text = keyword.value.trim();
      if (props.allowCustom && text) {
        keyword.value = text;
        dirty.value = false;
        open.value = false;
        commit(text);
      }
      return;
    }

    if (event.key === 'Escape' && open.value) {
      event.preventDefault();
      open.value = false;
      dirty.value = false;
      keyword.value = labelOf(props.modelValue);
    }
  }

  /** 点到组件外面就收起（捕获阶段，先于内部 blur 收尾） */
  function handleDocumentPointerDown(event) {
    if (!open.value) return;
    if (boxRef.value?.contains(event.target)) return;
    open.value = false;
  }

  onMounted(() =>
    document.addEventListener('pointerdown', handleDocumentPointerDown, true)
  );

  onBeforeUnmount(() => {
    document.removeEventListener(
      'pointerdown',
      handleDocumentPointerDown,
      true
    );
    clearTimeout(searchTimer);
  });
</script>

<template>
  <div class="search-select">
    <label v-if="label" :for="inputId" class="search-select__label">
      {{ label }}
      <span v-if="required" class="search-select__required" aria-hidden="true">
        *
      </span>
    </label>

    <!-- 外框是 label：点边框内的任何地方（含补出来的热区）都能聚焦输入框 -->
    <label
      ref="boxRef"
      :for="inputId"
      class="search-select__box"
      :class="{ 'is-disabled': disabled }"
    >
      <input
        :id="inputId"
        ref="inputRef"
        class="search-select__input"
        type="text"
        role="combobox"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        :placeholder="placeholder"
        :disabled="disabled"
        :value="keyword"
        :aria-expanded="open"
        :aria-controls="listId"
        :aria-activedescendant="
          activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
        "
        :aria-required="required || undefined"
        @focus="handleFocus"
        @blur="handleBlur"
        @input="handleInput"
        @keydown="handleKeydown"
      />

      <span class="search-select__icon" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>

      <ul v-if="open" :id="listId" class="search-select__panel" role="listbox">
        <li
          v-for="(row, index) in rows"
          :id="`${listId}-${index}`"
          :key="row.custom ? '__custom__' : row.value"
          class="search-select__option"
          :class="{ 'is-custom': row.custom }"
          role="option"
          :aria-selected="index === activeIndex"
          :data-active="index === activeIndex || undefined"
          @pointerdown.prevent="pick(row)"
          @pointermove="activeIndex = index"
        >
          {{ row.custom ? `使用「${row.label}」` : row.label }}
        </li>

        <li v-if="!rows.length" class="search-select__empty">
          {{ loading ? '搜索中…' : emptyText }}
        </li>
      </ul>
    </label>
  </div>
</template>

<style scoped lang="less">
  /* ================================================================
   字段容器：标题与控件同一行（与 @/ui/Select 同一套排布）
   ================================================================ */
  .search-select {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
  }

  .search-select__label {
    /* 与控件同行后不参与伸缩，免得长标题把输入框挤窄 */
    flex: none;
    display: inline-flex;
    align-items: baseline;
    gap: var(--space-1);
    font-family: var(--font-body);
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    letter-spacing: 0.02em;
    color: var(--text-secondary);
  }

  /* 必填标记：朱砂星号 */
  .search-select__required {
    font-family: var(--font-body);
    font-size: var(--text-sm);
    line-height: 1;
    color: var(--accent-red);
  }

  /* ================================================================
   输入框外框 —— 与 Select 的触发按钮同一副漆器面
   ================================================================ */
  .search-select__box {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    /* 占满标题之外的全部宽度 */
    flex: 1;
    min-width: 0;
    /* 固定 --control-height（border-box，含上下描边）：与 @/ui/Select 的触发按钮、
       @/ui/Button 同高。必须用 height 而不是 min-height —— 内层输入框占 34px，
       min-height 下外框会算成 34 + 2px 描边 = 38px，比其他行高 2px */
    height: var(--control-height);
    padding: 0 var(--space-2);
    background-color: var(--bg-surface);
    background-image: var(--card-lacquer-gradient);
    border: var(--border-thin) solid var(--border);
    border-radius: var(--radius-md);
    cursor: text;
    transition:
      border-color var(--duration-fast) var(--ease-out),
      box-shadow var(--duration-fast) var(--ease-out);

    /* 触控热区（设计系统 §3.8）：上下各外扩 4px 的透明窄条，视觉仍是 --control-height。
       不能像按钮那样铺一整块蒙层 —— 那会盖住输入框，点文字定位不了光标、也框选不了；
       拆成贴上下沿的两条，输入框自己那一块照旧可点。
       两条都是外框（label）的一部分，点上去等于点 label → 聚焦输入框。
       尺寸与 @/ui/Select 的触发按钮取同一份数据（--control-hit-pad）：伪元素的包含块是
       padding box，4px 之外还要补掉 1px 描边，热区才凑满 44px。 */
    &::before,
    &::after {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      height: var(--control-hit-pad);
    }

    &::before {
      bottom: calc(-1 * var(--control-hit-pad));
    }

    &::after {
      top: calc(-1 * var(--control-hit-pad));
    }

    &:focus-within {
      border-color: var(--accent-gold);
      box-shadow: var(--shadow-glow-gold);
    }

    &.is-disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .search-select__input {
    flex: 1;
    min-width: 0;
    /* 与外框内容区等高（36 - 上下描边 = 34px）：DOM 里不再有比外框更高的元素，
       量到的、看到的都是同一个数 */
    align-self: stretch;
    padding: 0;
    font-family: var(--font-body);
    font-size: var(--text-base);
    line-height: var(--leading-normal);
    color: var(--text-primary);
    background: transparent;
    border: none;
    outline: none;
    -webkit-tap-highlight-color: var(--tap-highlight);

    &::placeholder {
      color: var(--text-tertiary);
    }
  }

  .search-select__icon {
    flex: none;
    display: inline-flex;
    color: var(--text-tertiary);
    pointer-events: none;
  }

  .search-select__box:focus-within .search-select__icon {
    color: var(--accent-gold-dark);
  }

  /* ================================================================
   候选浮层 —— 贴着输入框展开，宽度与输入框一致
   ================================================================ */
  .search-select__panel {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    z-index: var(--z-dropdown);
    max-height: 240px;
    padding: var(--space-1);
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    background: var(--bg-surface);
    border: var(--border-thin) solid var(--border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    cursor: default;
    animation: search-select-in var(--duration-fast) var(--ease-enter) both;
  }

  @keyframes search-select-in {
    from {
      opacity: 0;
      transform: translateY(-4px) scale(0.99);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .search-select__option {
    display: flex;
    align-items: center;
    /* 候选条目与输入框同高（--control-height），与 @/ui/Select 的条目也一致 */
    min-height: var(--control-height);
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-sm);
    font-family: var(--font-body);
    font-size: var(--text-base);
    color: var(--text-primary);
    cursor: pointer;
    user-select: none;

    /* 指针划过 / 键盘高亮：淡金底 + 深金字 */
    &[data-active] {
      background: var(--accent-gold-bg);
      color: var(--accent-gold-dark);
    }

    /* 「使用原文」这行是手动填值的入口，用朱砂色与普通候选区分开 */
    &.is-custom {
      color: var(--accent-red);

      &[data-active] {
        background: var(--accent-red-bg);
        color: var(--accent-red);
      }
    }
  }

  .search-select__empty {
    padding: var(--space-2);
    font-size: var(--text-sm);
    color: var(--text-tertiary);
    text-align: center;
  }

  /* ================================================================
   Reduced Motion — 无障碍退化
   ================================================================ */
  @media (prefers-reduced-motion: reduce) {
    .search-select__panel {
      animation: none;
    }
  }
</style>
