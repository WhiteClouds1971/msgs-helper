<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { planGallery } from './layout'

/**
 * ImageGallery —— 多图展示（无业务耦合的基础 UI 组件）
 *
 * 排布策略（详见 ./layout.js）：
 *   · 单图 —— 尽量一屏展示完：等比缩到完整放进容器并居中（contain）；
 *     只有缩下去会小到看不清（低于 minScale）时才改为铺满宽度、纵向滚动。
 *   · 多图 —— 逐张铺满宽度、纵向滚动看大图；恰好一屏放得下时居中显示、不滚动。
 *   · 两条硬约束：① 完整展示（永不裁切）优先于 ② 铺满宽度，任何情况下都不缩小图片去凑一屏。
 *
 * 外框取「册页装裱」意象：暖绢底 + 一条金描边 + 漆器顶光 + 一层暖投影；
 * 外框尺寸**贴合图片**（图片多高、框就多高，容器内不留空白），超出可用区时才占满并内部滚动。
 * 可选的 `caption` 会渲染成图片角上的朱砂钤印，用于标注正 / 背等结构信息。
 */
const props = defineProps({
  /** [{ src, alt?, caption?, aspect? }]，也接受纯 src 字符串数组 */
  images: { type: Array, default: () => [] },
  /** 图间距（px）—— 参与排布计算，故用数值；默认 8 = --space-2 */
  gap: { type: Number, default: 8 },
  /** 每行最多几张；默认 1 = 逐张铺满宽度纵向滚动，设 2/3 可排成网格 */
  maxPerRow: { type: Number, default: 1 },
  /** 单图 contain 的最小缩放比；低于此值改为「铺满宽度 + 纵向滚动」 */
  minScale: { type: Number, default: 0.62 },
  /** 是否绘制裱框 */
  frame: { type: Boolean, default: true },
  /** 裱边宽度（CSS 长度，可直接用 token） */
  padding: { type: String, default: 'var(--space-3)' },
  /** 多行时是否画中缝（竹简编绳） */
  divider: { type: Boolean, default: true },
})

const rootRef = ref(null)
const mountRef = ref(null)
const box = ref({ width: 0, height: 0 })
/** 外框自身 padding + border 的占位（px） */
const chrome = ref({ x: 0, y: 0 })
/** 各图真实宽高比（下标 = 图片序号）；未加载完为 undefined */
const aspects = ref([])
const failed = ref([])

const normalized = computed(() =>
  props.images.map(raw => (typeof raw === 'string' ? { src: raw } : raw || {})),
)

const plan = computed(() =>
  planGallery({
    images: normalized.value.map((image, index) => ({
      ...image,
      aspect: aspects.value[index] ?? image.aspect,
    })),
    width: box.value.width,
    height: box.value.height,
    gap: props.gap,
    maxPerRow: props.maxPerRow,
    minScale: props.minScale,
  }),
)

/** 尺寸全部已知（或已失败）才显形，避免排布跳变被看见 */
const ready = computed(() => {
  if (normalized.value.length === 0) return true
  return normalized.value.every((_, index) => aspects.value[index] != null || failed.value[index])
})

const px = value => (typeof value === 'number' && value > 0 ? `${value}px` : null)

const stackStyle = computed(() => ({
  '--gallery-gap': `${plan.value.gap}px`,
  width: px(plan.value.width),
  height: px(plan.value.height),
}))

/**
 * 外框尺寸：fit 模式贴合图片（图片多高，框就多高，容器内不留大片空白）；
 * scroll 模式占满可用区，由视口内部滚动。
 */
const mountStyle = computed(() => {
  const current = plan.value
  const base = { padding: props.padding }
  if (current.mode === 'scroll' || !current.width || !current.height) {
    return { ...base, width: '100%', height: '100%' }
  }
  return {
    ...base,
    width: `${current.width + chrome.value.x}px`,
    height: `${current.height + chrome.value.y}px`,
  }
})

const rowStyle = row => ({ height: px(row.height) })
const itemStyle = cell => ({ width: px(cell.width), height: px(cell.height) })

/* ---- 尺寸测量 ---- */
let observer = null
const imgEls = []

const num = value => parseFloat(value) || 0

/** 外框自身的 padding / border 占位；padding 可能是 var()，交给浏览器换算 */
function measureChrome() {
  const el = mountRef.value
  if (!el) return
  const cs = getComputedStyle(el)
  chrome.value = {
    x:
      num(cs.paddingLeft) +
      num(cs.paddingRight) +
      num(cs.borderLeftWidth) +
      num(cs.borderRightWidth),
    y:
      num(cs.paddingTop) +
      num(cs.paddingBottom) +
      num(cs.borderTopWidth) +
      num(cs.borderBottomWidth),
  }
}

/**
 * 量可用区。外框尺寸要反过来贴合图片，所以固定量它外面的根元素，
 * 再减去外框自身的裱边与描边 —— 量视口会形成「视口尺寸 ↔ 图片尺寸」的循环。
 */
function measure() {
  const el = rootRef.value
  if (!el) return
  const width = Math.max(0, el.clientWidth - chrome.value.x)
  const height = Math.max(0, el.clientHeight - chrome.value.y)
  if (width !== box.value.width || height !== box.value.height) {
    box.value = { width, height }
  }
}

function setImgRef(index, el) {
  if (el) imgEls[index] = el
  else delete imgEls[index]
}

function rememberAspect(index, el) {
  if (!el || !el.naturalWidth || !el.naturalHeight) return
  const next = aspects.value.slice()
  next[index] = el.naturalWidth / el.naturalHeight
  aspects.value = next
}

function onLoad(index, event) {
  rememberAspect(index, event.target)
}

function onError(index) {
  const next = failed.value.slice()
  next[index] = true
  failed.value = next
}

/** 缓存命中的图不会再触发 load，挂载后主动补读一次 */
function syncLoadedDimensions() {
  imgEls.forEach((el, index) => {
    if (el && el.complete && el.naturalWidth) rememberAspect(index, el)
  })
}

onMounted(async () => {
  measureChrome()
  measure()
  await nextTick()
  measureChrome()
  measure()
  syncLoadedDimensions()
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(measure)
    if (rootRef.value) observer.observe(rootRef.value)
  }
  window.addEventListener('resize', measure)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  window.removeEventListener('resize', measure)
})

watch(
  () => props.images,
  () => {
    aspects.value = []
    failed.value = []
    nextTick(syncLoadedDimensions)
  },
)
</script>

<template>
  <div
    ref="rootRef"
    class="gallery"
    :class="{ 'gallery--framed': frame }"
  >
    <div
      ref="mountRef"
      class="gallery__mount"
      :style="mountStyle"
    >
      <div
        class="gallery__viewport"
        :class="{ 'gallery__viewport--scroll': plan.mode === 'scroll' }"
      >
        <div
          class="gallery__stack"
          :class="{ 'is-ready': ready }"
          :style="stackStyle"
        >
          <div
            v-for="(row, rowIndex) in plan.rows"
            :key="rowIndex"
            class="gallery__row"
            :style="rowStyle(row)"
          >
            <!-- 中缝：竹简编绳意象，落在行间距里，不占布局高度 -->
            <span
              v-if="divider && rowIndex > 0"
              class="gallery__seam"
              aria-hidden="true"
            />

            <figure
              v-for="cell in row.items"
              :key="cell.index"
              class="gallery__item"
              :style="itemStyle(cell)"
            >
              <img
                :ref="el => setImgRef(cell.index, el)"
                class="gallery__img"
                :src="cell.image.src"
                :alt="cell.image.alt || ''"
                decoding="async"
                @load="onLoad(cell.index, $event)"
                @error="onError(cell.index)"
              >

              <figcaption
                v-if="cell.image.caption"
                class="seal-stamp gallery__caption"
              >
                {{ cell.image.caption }}
              </figcaption>

              <div
                v-if="failed[cell.index]"
                class="gallery__error"
              >
                图片加载失败
              </div>
            </figure>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.gallery {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
}

/* ── 裱框：暖绢底 + 漆器顶光 + 一层暖投影 ── */
.gallery__mount {
  position: relative;
  display: flex;
  /* 尺寸由脚本按图片算好后内联下发（贴合图片或占满可用区）；
     margin: auto 双向居中，内容溢出时不会像 align-items: center 那样裁掉上边 */
  margin: auto;
  max-width: 100%;
  max-height: 100%;
  overflow: hidden;
  background-color: var(--bg-surface);
  background-image: var(--card-lacquer-gradient);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

/* 收边只用一条金线（与 .card--accent 同构），不再叠第二道内裱线 */
.gallery--framed .gallery__mount {
  border: var(--border-thin) solid var(--accent-gold);
}

/* 关闭裱框时连底与投影一并去掉，只留图片排布 */
.gallery:not(.gallery--framed) .gallery__mount {
  background-color: transparent;
  background-image: none;
  box-shadow: none;
}

/* ── 视口：fit 模式裁掉溢出（排布已保证放得下），scroll 模式纵向滚动 ── */
.gallery__viewport {
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  /* 隐藏滚动条但保留滚动：触控滑动不需要滚动条，
     桌面端 overlay 滚动条也会在滑动时闪出，破坏裱框观感 */
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.gallery__viewport::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.gallery__viewport--scroll {
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

/* ── 图组：外接框，margin: auto 双向居中且溢出时不裁上边 ── */
.gallery__stack {
  display: flex;
  flex-direction: column;
  gap: var(--gallery-gap, 8px);
  margin: auto;
  opacity: 0;
  transition: opacity var(--duration-normal) var(--ease-out);
}

.gallery__stack.is-ready {
  opacity: 1;
}

.gallery__viewport--scroll .gallery__stack {
  margin: 0 auto;
}

.gallery__row {
  position: relative;
  display: flex;
  gap: var(--gallery-gap, 8px);
}

/* 中缝：位置由行间距推得，height 只画不占位 */
.gallery__seam {
  position: absolute;
  top: calc(var(--gallery-gap, 8px) / -2);
  left: 14%;
  right: 14%;
  height: var(--border-medium);
  background: var(--decorative-line);
  pointer-events: none;
}

.gallery__seam::after {
  content: '◆';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 6px;
  line-height: 1;
  color: var(--accent-gold);
}

.gallery__item {
  position: relative;
  flex: 0 0 auto;
  width: 100%;
}

/* object-fit: contain 是兜底 —— 排布保证单元格与图片同比，正常不会出现留边 */
.gallery__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.gallery__caption {
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
  padding: var(--space-1) var(--space-2);
  font-size: var(--text-xs);
  pointer-events: none;
}

.gallery__error {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-surface-hover);
  color: var(--text-tertiary);
  font-size: var(--text-xs);
}

@media (prefers-reduced-motion: reduce) {
  .gallery__stack {
    transition: none;
  }
}
</style>
