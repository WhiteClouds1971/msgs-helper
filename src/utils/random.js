/**
 * 通用加权随机工具库
 *
 * 核心函数 `weightedPick` 从候选池中按权重随机抽取指定数量的项，
 * 支持放回/不放回两种采样模式、排除项过滤、自定义权重与标识字段、随机种子。
 *
 * 不依赖外部库，内置 mulberry32 高质量 PRNG。
 */

// ─── 内置 PRNG ────────────────────────────────────────────────

/**
 * hashSeed — 将任意 seed 转为 32 位整数
 */
function hashSeed(seed) {
  const s = String(seed)
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return h
}

/**
 * mulberry32 — 高质量 32 位 PRNG
 * 返回一个 () => number 函数，每次调用产生 [0, 1) 的均匀伪随机数
 */
function mulberry32(seed) {
  let state = hashSeed(seed)
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ─── 工具函数 ──────────────────────────────────────────────────

/**
 * 从对象中提取值，支持 key 字符串或 extractor 函数
 */
function extract(item, keyOrFn) {
  if (typeof keyOrFn === 'function') return keyOrFn(item)
  return item?.[keyOrFn]
}

// ─── 核心函数 ──────────────────────────────────────────────────

/**
 * 加权随机采样（weighted random sampling）
 *
 * @param {Array} pool - 候选池，每项为普通对象
 * @param {Object} [opts] - 配置项
 * @param {number} [opts.count=1]        - 抽取数量
 * @param {boolean} [opts.unique=true]   - 不放回采样（默认不放回）
 * @param {string} [opts.weightKey='weight'] - 权重字段名
 * @param {number} [opts.defaultWeight=1]    - 未设置权重时的默认值
 * @param {string} [opts.idKey='id']     - 标识字段名（用于 exclude 和去重匹配）
 * @param {Array} [opts.exclude=[]]      - 排除项列表，按 idKey 匹配
 * @param {string|number} [opts.seed]    - 随机种子（不传则使用 Math.random）
 * @returns {Array} 抽取结果数组；候选不足时可能少于 count
 *
 * @example
 * // 等权重抽 1 张
 * weightedPick([{ des: '【杀】' }, { des: '【闪】' }])
 * // => [{ des: '【杀】' }]
 *
 * @example
 * // 按 probability 字段加权，抽取 2 项（不放回）
 * weightedPick([
 *   { name: 'A', probability: 5 },
 *   { name: 'B', probability: 2 },
 *   { name: 'C', probability: 1 },
 * ], { count: 2, weightKey: 'probability' })
 *
 * @example
 * // 放回采样 + 排除特定项
 * weightedPick(pool, { count: 3, unique: false, exclude: [{ id: 'banned' }] })
 */
export function weightedPick(pool, opts = {}) {
  const {
    count = 1,
    unique = true,
    weightKey = 'weight',
    defaultWeight = 1,
    idKey = 'id',
    exclude = [],
    seed,
  } = opts

  if (!pool?.length || count <= 0) return []

  const rng = seed != null ? mulberry32(seed) : Math.random

  // ── 过滤排除项 ──
  let candidates
  if (exclude.length > 0) {
    const excludeIds = new Set(
      exclude.map(item => extract(item, idKey)).filter(v => v != null)
    )
    candidates = pool.filter(
      item => !excludeIds.has(extract(item, idKey))
    )
  } else {
    candidates = [...pool]
  }

  if (candidates.length === 0) return []

  // ── 规范化：为每项附加权重和标识 ──
  candidates = candidates.map(item => ({
    _origin: item,
    _weight: extract(item, weightKey) ?? defaultWeight,
    _id: extract(item, idKey),
  }))

  const result = []
  // 不放回时操作副本
  let available = unique ? [...candidates] : null

  for (let i = 0; i < count; i++) {
    const currentPool = unique ? available : candidates

    // 无剩余候选
    if (!currentPool.length) break

    // 计算总权重
    const totalWeight = currentPool.reduce((sum, it) => sum + it._weight, 0)
    if (totalWeight <= 0) break

    // 轮盘赌选择
    let rand = rng() * totalWeight
    let selected = null
    for (const item of currentPool) {
      rand -= item._weight
      if (rand < 0) {
        selected = item
        break
      }
    }

    // 浮点误差兜底
    if (!selected) selected = currentPool[currentPool.length - 1]

    result.push(selected._origin)

    // 不放回：移除已选项
    if (unique) {
      const idx = available.indexOf(selected)
      if (idx !== -1) available.splice(idx, 1)
    }
  }

  return result
}

/**
 * Fisher-Yates 洗牌（带可选种子）
 *
 * @param {Array} array - 原数组（不修改原数组）
 * @param {string|number} [seed] - 随机种子
 * @returns {Array} 打乱后的新数组
 */
export function shuffle(array, seed) {
  const result = [...array]
  const rng = seed != null ? mulberry32(seed) : Math.random

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * 从数组中随机取 n 个元素（等权重、不放回）
 * weightedPick 的便捷简写
 *
 * @param {Array} array
 * @param {number} n
 * @param {string|number} [seed]
 * @returns {Array}
 */
export function sample(array, n = 1, seed) {
  return weightedPick(array, { count: n, unique: true, seed })
}
