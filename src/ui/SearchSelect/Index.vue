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
   * 刚聚焦还没打字时给全量候选（方便浏览挑选），一旦开始打字就按输入过滤；
   * 每次展开都会重新取一次，候选背后的数据在两次展开之间变了也看得见。
   * 清空输入框 = 清空取值。
   *
   * 候选面板是滚动容器（条目多时靠划），所以「点一下」与「拖着滚」必须分得开：
   * 按下只记落点，抬手时位移没超过阈值（TAP_SLOP）才算选中 —— 真机上一碰就选中
   * 会让列表永远滚不动，还会顺手 blur 掉输入框（软键盘跟着退）。
   * 抬手选中之后，浏览器补发的那一下兼容 click 还要再吃掉（见 swallowGhostClick）——
   * 否则面板一收起，那一下会砸在原本被面板盖住的按钮上。
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

  /**
   * 选中一行（候选或「使用原文」）：回填文字、收起、交出焦点（收键盘）
   *
   * @param {object} row 选中的那一行
   * @param {{x: number, y: number}} [point] 抬手落点（触屏 / 笔才有）——
   *   给了它就顺手埋下幽灵点击的拦截，见 swallowGhostClick
   */
  function pick(row, point) {
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
    if (point) swallowGhostClick(point);
  }

  /* ── 候选面板上的指针手势 ──────────────────────────────────────
   手指在候选列表上划是在滚列表，不是挑条目 —— 两者都从「按在某个条目上」起步，
   只能靠抬手时的位移分辨。按下就选中（原先是 @pointerdown.prevent="pick(row)"）
   在真机上有两个后果：列表永远滚不动；一碰就 pick → 收起候选 + blur 输入框，
   软键盘跟着一起退。浏览器的做法是滚动手势一开始就把指针标成 pointercancel
   （那时直接作废），但这不保证每家都发，所以抬手时再核一次位移兜底。 */
  /** 抬手位移不超过这么多像素，才算「点了一下」；超过就是在滚列表 */
  const TAP_SLOP = 8;
  /** 本次按下的落点：哪一行、哪根指针、从哪儿起手（抬手时据此判是不是同一次点选） */
  let press = null;
  /** 面板上正按着指针（按下还没抬）——此刻的 blur 是「碰面板」带出来的，不是离开组件 */
  let panelTouched = false;

  function handlePanelPointerDown() {
    panelTouched = true;
  }

  /** 抬手 / 指针被浏览器收走做滚动手势：本次按下作废 */
  function endPanelGesture() {
    press = null;
    panelTouched = false;
  }

  function handleOptionPointerDown(event, index) {
    // 面板上的按下记两次（这里一次、面板自己一次）：Vue 会按挂载时间戳跳过
    // 「祖先元素上、挂载时间晚于本次事件」的监听，冒泡那一次有可能收不到
    panelTouched = true;
    press = {
      index,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
  }

  function handleOptionPointerUp(event, row, index) {
    const start = press;
    // 抬手即作废本次按下：选不选中，这次面板交互都结束了
    press = null;
    // 起手与抬手不在同一行（手指滑到别的条目上才抬）或换了根手指 → 不是点选
    if (!start || start.index !== index || start.pointerId !== event.pointerId)
      return;
    if (
      Math.abs(event.clientX - start.x) > TAP_SLOP ||
      Math.abs(event.clientY - start.y) > TAP_SLOP
    )
      return;
    // 落点一并交给 pick：紧随其后的补发 click 要靠它认（见 swallowGhostClick）
    pick(row, { x: event.clientX, y: event.clientY });
  }

  /* ── 幽灵点击（ghost click）──────────────────────────────────────
   抬手选中之后，浏览器还会照老规矩补发一串兼容鼠标事件
   （mousedown / mouseup / click），落点是「补发的那一刻，这个坐标下面是谁」——
   而我们在 pointerup 就已经把面板收掉了，于是这一串会砸在面板原本盖住的按钮上：
   记录页上就是「选好了武将，下面的身份 / 对局 / 新增也跟着被点了一下」。
   条目 pointerdown 上的 preventDefault 能压住多数浏览器的补发（Chrome 上实测连
   click 都不会发），但 WebKit 不保证认这条 —— 所以抬手选中的同时，
   在捕获阶段埋一次性的 click 拦截兜底。

   只认「落点与抬手点重合、且 500ms 以内」的第一下：补发的那一下坐标与抬手点几乎
   重合，而用户真要接着去点别处，坐标差着几十上百像素，不会被误吃；
   点回本组件自己的（比如又点了一下输入框）也照常放行。 */
  /** 认领半径（px）：抬手点周围这么大一圈内的下一击，才当成补发 */
  const GHOST_SLOP = 16;
  /** 认领时限（ms）：超过这么久就不再怀疑是补发 */
  const GHOST_WINDOW = 500;

  /**
   * 吃掉紧接着补发的那一下 click
   *
   * @param {{x: number, y: number}} point 抬手时的落点（视口坐标）
   */
  function swallowGhostClick(point) {
    let timer = null;

    function release() {
      clearTimeout(timer);
      document.removeEventListener('click', handler, true);
    }

    function handler(event) {
      const near =
        Math.abs(event.clientX - point.x) <= GHOST_SLOP &&
        Math.abs(event.clientY - point.y) <= GHOST_SLOP;
      release();
      if (!near || boxRef.value?.contains(event.target)) return;
      // 压住默认行为（label 会据此激活它关联的单选框），也别让它再往上冒
      event.preventDefault();
      event.stopPropagation();
    }

    document.addEventListener('click', handler, true);
    timer = setTimeout(release, GHOST_WINDOW);
  }

  /** 鼠标划过才跟着高亮：触屏没有 hover，拖动途中改高亮会顺手把条目 scrollIntoView
      进可视区，跟手指抢滚动位置 */
  function handleOptionPointerMove(event, index) {
    if (event.pointerType === 'touch' || event.pointerType === 'pen') return;
    activeIndex.value = index;
  }

  /* ── 交互 ── */
  function handleFocus() {
    if (props.disabled) return;
    open.value = true;
    dirty.value = false;
    // 每次展开都重新拉一遍（keyword 为空 = 取全部/热门）。
    // 不能只在首次拉：候选背后可能是会变的数据（比如将池页刚记了一个新武将），
    // 拉过一次就再也不刷的话，再点开看到的还是老列表，非得重新打字才更新。
    if (props.search) scheduleSearch('', true);
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
    // 手指正按在候选面板上：这一下 blur 是「碰面板」带出来的（有的浏览器不认
    // pointerdown 上的 preventDefault，照样按老规矩把焦点收走），不是「离开组件」。
    // 面板照旧开着 —— 否则本想滚列表，却把候选和软键盘一起关了
    if (panelTouched) return;
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

  onMounted(() => {
    document.addEventListener('pointerdown', handleDocumentPointerDown, true);
    // 抬手落在条目之外（面板边缘、页面别处）也要把本次按下作废：否则 press 一直挂着，
    // 之后每一次 blur 都会被当成「碰面板」放过去。冒泡阶段加，才晚于条目自己的 pointerup
    document.addEventListener('pointerup', endPanelGesture);
    document.addEventListener('pointercancel', endPanelGesture);
  });

  onBeforeUnmount(() => {
    document.removeEventListener(
      'pointerdown',
      handleDocumentPointerDown,
      true
    );
    document.removeEventListener('pointerup', endPanelGesture);
    document.removeEventListener('pointercancel', endPanelGesture);
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

      <!-- 面板本身就是滚动容器（max-height + overflow-y）：按下时不许改焦点，
           否则有的浏览器会当场 blur 掉输入框，列表还没滚就塌了 -->
      <ul
        v-if="open"
        :id="listId"
        class="search-select__panel"
        role="listbox"
        @pointerdown="handlePanelPointerDown"
        @mousedown.prevent
      >
        <li
          v-for="(row, index) in rows"
          :id="`${listId}-${index}`"
          :key="row.custom ? '__custom__' : row.value"
          class="search-select__option"
          :class="{ 'is-custom': row.custom }"
          role="option"
          :aria-selected="index === activeIndex"
          :data-active="index === activeIndex || undefined"
          @pointerdown.prevent="handleOptionPointerDown($event, index)"
          @pointerup="handleOptionPointerUp($event, row, index)"
          @pointermove="handleOptionPointerMove($event, index)"
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
