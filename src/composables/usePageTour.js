import { onBeforeUnmount, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useLocalStorage } from '@/stores/localStorage'
import { StorageKeys } from '@/constants/storageKeys'
import { TourKeys } from '@/constants/tourKeys'
import { useTour } from '@/composables/useTour'

/**
 * usePageTour — 页面级「自动教学」的统一入口
 *
 * 主页不走这里（主页的教学逻辑自成一套，保持原样）；其余页面要自动教一次，
 * 都用它调度，保证三条硬规则：
 *
 *   1. **玉玺教程优先，且先到先算**。菜单页首次进入时玉玺教程会自动演示（它由
 *      JadeSeal 在挂载 600ms 后拉起，与页面教学是同一条时间线上的竞速）。只要
 *      玉玺教程还没教过，本页教学这次就不上场 —— 既不与它抢（抢会把它顶掉，
 *      反过来它也会把本页教学顶掉），也不消耗本页教学次数。
 *   2. **同屏只有一个教程**。调度那一刻若屏幕上已有教程（比如玉玺教程还开着），
 *      同样跳过 —— 不抢、也不排队，教学次数留着。
 *   3. **页面教学从「第二次路由进入本页」起才加载**。首次进入整个让给玉玺教程，
 *      也避免用户刚点开搜索/控制台时被本页教学糊一脸。
 *
 * 跳过的这几条路径都不会调用 startTour，所以 `msgs-tour` 里本页的 count 保持 0，
 * 下次进入本页会自动补上。
 *
 * 用法：
 *   const bannerReady = ref(false)                        // 页面资源就绪信号（可选）
 *   usePageTour(TourKeys.XXX, { ready: bannerReady })     // 就绪后再调度
 *   usePageTour(TourKeys.XXX)                             // 不等资源：挂载后 delay 直接调度
 *
 * 进入次数按路由 path 记在 StorageKeys.PAGE_VISITS：以「组件挂载」为一次进入
 * （清除本页数据会让页面重挂载，也算一次，无伤大雅）。
 */
export function usePageTour(tourKey, options = {}) {
  /** 第几次进入本页才允许加载页面教学 */
  const MIN_VISITS = 2
  const delay = options.delay ?? 600

  const route = useRoute()
  const ls = useLocalStorage()
  const { start } = useTour()

  let timer = 0
  let scheduled = false
  let stopReadyWatch = null

  function countVisit() {
    ls.load(StorageKeys.PAGE_VISITS, {})
    const visits = ls.cache[StorageKeys.PAGE_VISITS]
    const count = (visits[route.path] ?? 0) + 1
    visits[route.path] = count
    return count
  }

  /**
   * 玉玺教程是否「还没教、且即将在本页亮起」
   *
   * 只有菜单页（路由注册表里带 meta.code 的项）首次进入才会自动演示玉玺教程；
   * 它优先级更高，本页教学此时必须让位 —— 否则两边几乎同时起手，谁后起谁赢，
   * 输的一方次数已经被记掉，第二次进入就没有教学了。
   */
  function sealTourPending() {
    if (!route.meta?.code) return false
    ls.load(StorageKeys.TOUR, {})
    const taught = ls.cache[StorageKeys.TOUR]?.[TourKeys.MENU_SEAL.key]?.count ?? 0
    return taught < TourKeys.MENU_SEAL.count
  }

  function schedule() {
    if (scheduled) return
    scheduled = true
    window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      // 已经有人在教（玉玺优先）：本次让位，不消耗教学次数
      if (document.querySelector('.driver-overlay')) return
      start(tourKey, { mode: 'auto' })
    }, delay)
  }

  onMounted(() => {
    if (countVisit() < MIN_VISITS) return
    // 玉玺教程优先：它还没教过，这次整个让给它（本页教学次数不消耗）
    if (sealTourPending()) return

    if (options.ready) {
      stopReadyWatch = watch(
        () => options.ready.value === true,
        ready => {
          if (ready) schedule()
        },
        { immediate: true },
      )
      return
    }

    schedule()
  })

  onBeforeUnmount(() => {
    window.clearTimeout(timer)
    stopReadyWatch?.()
  })
}
