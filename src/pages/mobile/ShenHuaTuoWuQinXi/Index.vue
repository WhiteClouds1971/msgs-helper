<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { usePageReady } from '@/composables/usePageReady'
import { useMessage } from '@/composables/useMessage'
import { useLocalStorage } from '@/stores/localStorage'
import { useTour } from '@/composables/useTour'
import { TourKeys } from '@/constants/tourKeys'
import ImageGallery from '@/ui/ImageGallery/Index.vue'
import SkillCard from '@/ui/SkillCard/Index.vue'
import { useSkillGestures } from './useSkillGestures.js'
import bannerUrl from '@/assets/images/da-qi/五禽戏大旗.webp'

/**
 * 五禽戏技能 — 单一事实源
 *
 * 技能文案随代码发布，页面数据里只存「顺序 + 存留」的 id 数组（见下方 load）：
 * 描述改了立即生效，删掉的技能也不怕文案丢失 —— 重置就是回到这份定义的顺序。
 */
const SKILLS = Object.freeze([
  {
    id: 'hu',
    name: '虎',
    types: ['锁定技'],
    description: '当你使用指定唯一目标的牌对目标角色造成伤害时，此伤害+1。',
  },
  {
    id: 'lu',
    name: '鹿',
    types: ['锁定技'],
    description:
      '当你获得「鹿」时，你回复1点体力并弃置判定区里的所有牌。你不能成为延时锦囊牌的目标。',
  },
  {
    id: 'xiong',
    name: '熊',
    types: ['锁定技'],
    description: '每回合限一次，当你受到伤害时，此伤害-1。',
  },
  {
    id: 'yuan',
    name: '猿',
    types: ['锁定技'],
    description: '当你获得「猿」时，你选择一名其他角色，获得其装备区里的一张牌。',
  },
  {
    id: 'he',
    name: '鹤',
    types: ['锁定技'],
    description: '当你获得「鹤」时，你摸三张牌。',
  },
])

const DEFAULT_ORDER = SKILLS.map(skill => skill.id)
const SKILL_MAP = new Map(SKILLS.map(skill => [skill.id, skill]))

const route = useRoute()
const ls = useLocalStorage()
const message = useMessage()

const images = [{ src: bannerUrl, alt: '五禽戏大旗' }]

/* ── 页面数据：技能顺序（id 数组）──
   技能区在上、大旗在下，整体超一屏，故本页自建滚动容器 */
ls.load(route.fullPath, { order: [...DEFAULT_ORDER] })

/** 滤掉代码里已不存在的 id —— 展示列表与手势下标必须逐项对齐 */
const order = computed(() =>
  (ls.pageData.order ?? DEFAULT_ORDER).filter(id => SKILL_MAP.has(id)),
)

const skills = computed(() => order.value.map(id => SKILL_MAP.get(id)))

/** 顺序与存留都还是初始态 —— 用于给「重置」按钮做出反馈 */
const isInitial = computed(
  () =>
    order.value.length === DEFAULT_ORDER.length &&
    order.value.every((id, index) => id === DEFAULT_ORDER[index]),
)

/* ── 交互：长按排序 / 左滑移除（技能内容归 @/ui/SkillCard，列表结构与手势都在本页）──
   boardRef 就是模板里那个 ul：手势据此测量几何、搬动条目 */
const boardRef = ref(null)

function setOrder(ids) {
  ls.pageData.order = ids
}

useSkillGestures(() => boardRef.value, {
  onMove(from, to) {
    const next = order.value.slice()
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setOrder(next)
  },
  onRemove(index) {
    // 移除是当场可见的，不再弹轻提示（找回来的办法写在技能区提示语与空态里）
    const next = order.value.slice()
    next.splice(index, 1)
    setOrder(next)
  },
})

function handleReset() {
  if (isInitial.value) {
    message.info('技能已是初始状态')
    return
  }
  ls.reset(route.fullPath, { order: [...DEFAULT_ORDER] })
  message.success('已重置为初始五禽')
}

/* ── 首屏与教学：等大旗加载完 → 解除 Splash → 启动画面淡出后再起教学 ──
   （自动模式只教一次，之后可在控制台「教学导览」里手动再看） */
const { markReady } = usePageReady({ auto: false })
// 用 useTour()（而非模块级 startTour）：离页时它会自动销毁导览，遮罩不会跟到下一个页面
const { start: startTour } = useTour()

const galleryRef = ref(null)
const mountedAt = Date.now()
let bannerEl = null
let tourTimer = 0
let tourWaited = 0

/** 玉玺教学（首次进入任一菜单页都会演示）在挂载后 600ms 起手，本页让过这个窗口再决定 */
const SEAL_TOUR_GRACE = 900
const TOUR_WAIT_STEP = 400
const TOUR_WAIT_LIMIT = 12000

/** 屏幕上是否已有导览（玉玺教学 / 别处起的教学）—— 直接看遮罩，比问状态可靠 */
function tourOnScreen() {
  return Boolean(document.querySelector('.driver-overlay'))
}

function scheduleTour() {
  // 别人正在教学：startTour 内部会销毁当前实例（等于把它顶掉），先等它收场
  if (tourOnScreen()) {
    tourWaited += TOUR_WAIT_STEP
    if (tourWaited >= TOUR_WAIT_LIMIT) return // 等太久就作罢，控制台「教学导览」随时可手动看
    tourTimer = window.setTimeout(scheduleTour, TOUR_WAIT_STEP)
    return
  }
  startTour(TourKeys.SHEN_HUA_TUO_WU_QIN_XI, { mode: 'auto' })
}

function settleReady() {
  markReady()
  window.clearTimeout(tourTimer)
  const grace = Math.max(0, mountedAt + SEAL_TOUR_GRACE - Date.now())
  tourTimer = window.setTimeout(scheduleTour, grace)
}

onMounted(async () => {
  await nextTick()
  bannerEl = galleryRef.value?.querySelector('img') ?? null
  if (!bannerEl || bannerEl.complete) {
    settleReady()
    return
  }
  bannerEl.addEventListener('load', settleReady, { once: true })
  bannerEl.addEventListener('error', settleReady, { once: true })
})

onBeforeUnmount(() => {
  window.clearTimeout(tourTimer)
  bannerEl?.removeEventListener('load', settleReady)
  bannerEl?.removeEventListener('error', settleReady)
})
</script>

<template>
  <div class="shen-hua-tuo-wu-qin-xi">
    <!-- 技能区：单个技能交给 @/ui/SkillCard 展示，列表与手势都由本页组织 -->
    <section
      id="wqx-skills"
      class="wqx__skills"
    >
      <header class="wqx__head">
        <h1 class="wqx__title">
          五禽戏
        </h1>
        <button
          id="wqx-reset"
          class="wqx__reset"
          type="button"
          @click="handleReset"
        >
          重置
        </button>
      </header>

      <p class="wqx__hint">
        长按技能拖动排序 · 左滑移除 · 点「重置」还原
      </p>

      <!-- 技能列表：编绳串起来的技能牌；长按拖动排序 / 左滑移除由 useSkillGestures 接管。
           结构契约（手势据此定位，改类名要同步改 useSkillGestures.js）：
             li.skill-board__item[data-skill-key]  ← 被搬动 / 被移除的项
             div.skill-board__viewport             ← 裁剪层，卡片滑走后露出底下的朱砂滑出层
             .skill-board__card                    ← 卡片本体（SkillCard 根元素），位移施加在它身上 -->
      <ul
        ref="boardRef"
        class="skill-board"
      >
        <li
          v-for="skill in skills"
          :key="skill.id"
          class="skill-board__item"
          :data-skill-key="skill.id"
        >
          <span
            class="skill-board__node"
            aria-hidden="true"
          />

          <div class="skill-board__viewport">
            <span
              class="skill-board__bed"
              aria-hidden="true"
            >
              移除
            </span>

            <SkillCard
              class="skill-board__card"
              :skill="skill"
            />
          </div>
        </li>

        <li
          v-if="!skills.length"
          class="skill-board__empty"
        >
          技能已全部移除 · 点上方「重置」找回五禽
        </li>
      </ul>
    </section>

    <!-- 大旗：高度随内容（按比例铺满宽度），滚动由页面承担 -->
    <div
      id="wqx-gallery"
      ref="galleryRef"
      class="wqx__gallery"
    >
      <ImageGallery :images="images" />
    </div>
  </div>
</template>

<style scoped lang="less">
.shen-hua-tuo-wu-qin-xi {
  /* #app 是 overflow: hidden 的固定高度壳：技能 + 大旗超一屏，本页自建滚动容器 */
  height: 100%;
  padding:
    calc(var(--safe-area-top) + var(--space-4))
    var(--content-padding)
    calc(var(--safe-area-bottom) + var(--space-4));
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.wqx__skills {
  margin-bottom: var(--space-6);
}

.wqx__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.wqx__title {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: var(--font-normal);
  line-height: var(--leading-tight);
  color: var(--text-primary);
}

/* 幽灵按钮（DESIGN_SYSTEM §3.2）：金色描边、小体量；
   视觉收窄到 32px 高，触控热区用伪元素外扩到 44px（§3.8），不靠大内边距撑尺寸 */
.wqx__reset {
  position: relative;
  flex: none;
  min-height: 32px;
  padding: 0 var(--space-3);
  border: var(--border-thin) solid var(--accent-gold);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  line-height: 1;
  color: var(--accent-gold-dark);
  background: transparent;
  transition: background-color var(--duration-fast) var(--ease-out);
}

.wqx__reset::after {
  content: '';
  position: absolute;
  inset: -6px;
}

.wqx__reset:active {
  background: var(--accent-gold-bg);
}

.wqx__hint {
  margin: var(--space-1) 0 var(--space-4);
  font-size: var(--text-xs);
  letter-spacing: 0.02em;
  color: var(--text-tertiary);
}

/* ================================================================
   技能列表 —— 编绳串起的技能牌（技能内容本身由 @/ui/SkillCard 负责）
   ================================================================ */
.skill-board {
  position: relative;
  /* 左侧留给编绳：金色细线 + 每项一个菱形节点 */
  padding-left: var(--space-6);
}

/* 竹简编绳：贯穿整列的金色细线 */
.skill-board::before {
  content: '';
  position: absolute;
  left: 9px;
  top: var(--space-4);
  bottom: var(--space-4);
  width: var(--border-thin);
  background: linear-gradient(
    180deg,
    transparent 0%,
    var(--accent-gold) 16%,
    var(--accent-gold) 84%,
    transparent 100%
  );
  opacity: 0.35;
  pointer-events: none;
}

.skill-board__item {
  position: relative;
  margin-bottom: var(--space-3);
  /* 纵向滚动照常放行；横向留给左滑手势。
     缺了这行，触屏上的横向滑动会被浏览器判成平移，指针事件直接被掐断 */
  touch-action: pan-y;
}

/* 编绳节点：随技能牌一同移动 */
.skill-board__node {
  position: absolute;
  top: 50%;
  left: -18px;
  width: 6px;
  height: 6px;
  background: var(--accent-gold);
  transform: translateY(-50%) rotate(45deg);
  pointer-events: none;
}

/* 视口：裁住滑走的卡片，底下是滑出层（平时藏起来） */
.skill-board__viewport {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-md);
}

.skill-board__bed {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 var(--space-4);
  background: var(--accent-red);
  font-size: var(--text-sm);
  letter-spacing: 0.1em;
  color: var(--text-inverse);
  /* 平时不可见：卡片浮起时缩放会露出底下的颜色，露红底会很脏 */
  opacity: 0;
  transition: opacity var(--duration-fast) var(--ease-out);
}

/* 状态类 ①：左滑中 —— 滑出层才显形 */
.skill-board__item.is-swiping .skill-board__bed {
  opacity: 1;
}

/* 状态类 ②：拖起中 —— 金色描边 + 辉光（位移由手势内联写） */
.skill-board__item.is-dragging .skill-board__card {
  border-color: var(--accent-gold);
  box-shadow: var(--shadow-glow-gold);
}

.skill-board__item.is-dragging .skill-board__node {
  background: var(--accent-gold-light);
}

/* 状态类 ③：按下中 */
.skill-board__item.is-pressed .skill-board__card {
  transform: scale(0.985);
}

.skill-board__empty {
  margin-left: calc(var(--space-6) * -1);
  padding: var(--space-6) var(--space-4);
  border: var(--border-thin) solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  color: var(--text-tertiary);
  text-align: center;
}

/* 大旗高度交给内容：ImageGallery 的 height:100% 在 auto 高度容器里退化为内容高度，
   内部不再自成滚动视口，整页一起滚 */
.wqx__gallery {
  height: auto;
}
</style>
