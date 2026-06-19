<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  touchPos: {
    type: Object,
    default: () => ({ x: 0, y: 0, active: false }),
  },
})

/* ================================================================
   Canvas 引用
   ================================================================ */
const canvasRef = ref(null)

/* ================================================================
   常量
   ================================================================ */
const TEXT_CHARS = [
  '谋', '策', '弈', '略', '战',
  '势', '霸', '锋', '阵', '武',
  '义', '忠', '魂', '志', '道',
  '墨', '韵', '禅',
  '杀', '闪', '桃', '酒',
]
const BLOB_COUNT = 5
const INK_DOT_COUNT = 18
const TEXT_COUNT = 20 // 数量不绑定字符池，允许复用

/* ================================================================
   运行时状态（非响应式，rAF 直接读写）
   ================================================================ */
let ctx = null
let animId = null
let frameCount = 0
let width = 0
let height = 0
let dpr = 1

/** @type {Array<{x:number, y:number, baseRadius:number, radius:number, opacity:number, speedX:number, speedY:number, breatheFreq:number, breathePhase:number, subs:Array<{ox:number, oy:number, sr:number}>}>} */
let blobs = []

/** @type {Array<{x:number, y:number, radius:number, opacity:number, blur:number, speedX:number, speedY:number}>} */
let inkDots = []

/** @type {Array<{char:string, x:number, y:number, fontSize:number, opacity:number, speedX:number, speedY:number, wobble:number, wobblePhase:number, rotation:number}>} */
let texts = []

/** @type {Array<{x:number, y:number, radius:number, opacity:number, maxRadius:number}>} */
let ripples = []

// 主题色
let colorInk = '44, 44, 44'
let isDark = false
let prefersReducedMotion = false

// 触摸边沿检测
let wasTouchActive = false

/* ================================================================
   工具函数
   ================================================================ */
function rand(min, max) {
  return min + Math.random() * (max - min)
}

/* ================================================================
   墨染云雾 Blob 工厂
   每个 blob 由 3-4 个重叠径向渐变组成，模拟不规则墨迹
   ================================================================ */
function createBlob() {
  return {
    x: rand(0, width),
    y: rand(0, height),
    baseRadius: rand(180, 420),
    radius: 0,
    opacity: rand(0.06, 0.14), // ↑ 原来是 0.015-0.045，太淡
    speedX: rand(0.02, 0.07) * (Math.random() > 0.5 ? 1 : -1),
    speedY: rand(0.01, 0.05) * (Math.random() > 0.5 ? 1 : -1),
    breatheFreq: rand(0.0006, 0.0018),
    breathePhase: rand(0, Math.PI * 2),
    subs: Array.from({ length: Math.floor(rand(2, 4)) }, () => ({
      ox: rand(-80, 80),
      oy: rand(-80, 80),
      sr: rand(0.25, 0.65),
    })),
  }
}

/* ================================================================
   墨点溅散 — 模拟毛笔蘸墨后自然溅落纸面的斑点
   ================================================================ */
function createInkDot() {
  return {
    x: rand(0, width),
    y: rand(0, height),
    radius: rand(2, 18),
    opacity: rand(0.04, 0.14),
    blur: rand(0, 4), // 0=锐利飞白，>0=湿墨晕边
    speedX: rand(0.01, 0.04) * (Math.random() > 0.5 ? 1 : -1),
    speedY: rand(0.01, 0.04) * (Math.random() > 0.5 ? 1 : -1),
  }
}

/** 墨点 — 小斑点用纯圆，大斑点用径向渐变模拟湿墨晕染 */
function drawInkDot(d) {
  if (d.blur > 0) {
    const r = d.radius + d.blur
    const grad = ctx.createRadialGradient(d.x, d.y, d.radius * 0.4, d.x, d.y, r)
    grad.addColorStop(0, `rgba(${colorInk}, ${d.opacity})`)
    grad.addColorStop(1, `rgba(${colorInk}, 0)`)
    ctx.fillStyle = grad
    ctx.fillRect(d.x - r, d.y - r, r * 2, r * 2)
  } else {
    ctx.beginPath()
    ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${colorInk}, ${d.opacity})`
    ctx.fill()
  }
}

/* ================================================================
   书法文字工厂
   水墨类字（墨韵禅）更淡、更小 — 画中题跋
   谋略气势类更浓、更大 — 碑文拓片
   四边随机出生，漂向对侧 — 营造"身陷墨阵"包围感
   ================================================================ */
const LIGHT_CHARS = new Set(['墨', '韵', '禅'])

/** 从屏幕四边之一随机生成出生坐标与速度方向 */
function spawnFromEdge() {
  const edge = Math.floor(Math.random() * 4)
  const baseSpeed = rand(0.03, 0.09)
  let x, y, sx, sy

  switch (edge) {
    case 0: // 底部 → 上浮
      x = rand(width * 0.05, width * 0.95)
      y = height + rand(30, 100)
      sx = rand(-0.12, 0.12)
      sy = -baseSpeed
      break
    case 1: // 顶部 → 下沉（少数，模拟落墨）
      x = rand(width * 0.05, width * 0.95)
      y = -rand(30, 100)
      sx = rand(-0.12, 0.12)
      sy = baseSpeed * 0.6
      break
    case 2: // 左侧 → 右漂
      x = -rand(30, 80)
      y = rand(height * 0.1, height * 0.9)
      sx = baseSpeed
      sy = rand(-0.08, 0.08)
      break
    case 3: // 右侧 → 左漂
      x = width + rand(30, 80)
      y = rand(height * 0.1, height * 0.9)
      sx = -baseSpeed
      sy = rand(-0.08, 0.08)
      break
  }

  return { x, y, sx, sy }
}

function makeTextProps(char) {
  const isLight = LIGHT_CHARS.has(char)
  return {
    char,
    fontSize: isLight ? rand(20, 34) : rand(26, 56),
    opacity: isLight ? rand(0.08, 0.14) : rand(0.12, 0.24),
    wobble: rand(0.04, 0.18),
    wobblePhase: rand(0, Math.PI * 2),
    rotation: rand(-3, 3),
  }
}

function createText() {
  const char = TEXT_CHARS[Math.floor(Math.random() * TEXT_CHARS.length)]
  const { x, y, sx, sy } = spawnFromEdge()
  return { ...makeTextProps(char), x, y, speedX: sx, speedY: sy }
}

function recycleText(t) {
  let char
  do {
    char = TEXT_CHARS[Math.floor(Math.random() * TEXT_CHARS.length)]
  } while (char === t.char)
  const { x, y, sx, sy } = spawnFromEdge()
  Object.assign(t, makeTextProps(char), { x, y, speedX: sx, speedY: sy })
}

/* ================================================================
   主题色读取
   ================================================================ */
function updateColors() {
  const theme = document.documentElement.dataset.theme
  if (theme === 'dark') {
    isDark = true
  } else if (theme === 'light') {
    isDark = false
  } else {
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  colorInk = isDark ? '200, 190, 170' : '44, 44, 44'
}

/* ================================================================
   Canvas 尺寸同步
   ================================================================ */
function resize() {
  const canvas = canvasRef.value
  if (!canvas) return

  dpr = Math.min(window.devicePixelRatio || 1, 2)
  width = window.innerWidth
  height = window.innerHeight

  canvas.width = width * dpr
  canvas.height = height * dpr
  canvas.style.width = width + 'px'
  canvas.style.height = height + 'px'

  ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
}

/* ================================================================
   绘制函数
   ================================================================ */

/** 墨染云雾 */
function drawBlob(b) {
  b.radius = b.baseRadius * (1 + Math.sin(frameCount * b.breatheFreq + b.breathePhase) * 0.1)

  const r = b.radius
  const grad = ctx.createRadialGradient(b.x, b.y, r * 0.15, b.x, b.y, r)
  grad.addColorStop(0, `rgba(${colorInk}, ${b.opacity})`)
  grad.addColorStop(0.55, `rgba(${colorInk}, ${b.opacity * 0.35})`)
  grad.addColorStop(1, `rgba(${colorInk}, 0)`)
  ctx.fillStyle = grad
  ctx.fillRect(b.x - r, b.y - r, r * 2, r * 2)

  // 子墨团 — 不规则边缘
  for (const sub of b.subs) {
    const sx = b.x + sub.ox
    const sy = b.y + sub.oy
    const sr = r * sub.sr
    const sgrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr)
    sgrad.addColorStop(0, `rgba(${colorInk}, ${b.opacity * 0.6})`)
    sgrad.addColorStop(1, `rgba(${colorInk}, 0)`)
    ctx.fillStyle = sgrad
    ctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2)
  }
}

/** 书法文字 — 字体栈含降级，即使 Ma Shan Zheng 未加载也能用楷体 */
function drawText(t) {
  ctx.save()
  ctx.translate(t.x, t.y)
  ctx.rotate((t.rotation * Math.PI) / 180)
  ctx.font = `${t.fontSize}px "Ma Shan Zheng", "STKaiti", "KaiTi", "楷体", serif`
  ctx.fillStyle = `rgba(${colorInk}, ${t.opacity})`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(t.char, 0, 0)
  ctx.restore()
}

/** 墨洇涟漪（触摸时） */
function drawRipple(rp) {
  const grad = ctx.createRadialGradient(rp.x, rp.y, rp.radius * 0.3, rp.x, rp.y, rp.radius)
  grad.addColorStop(0, `rgba(${colorInk}, ${rp.opacity * 0.4})`)
  grad.addColorStop(0.6, `rgba(${colorInk}, ${rp.opacity * 0.12})`)
  grad.addColorStop(1, `rgba(${colorInk}, 0)`)
  ctx.fillStyle = grad
  ctx.fillRect(rp.x - rp.radius, rp.y - rp.radius, rp.radius * 2, rp.radius * 2)
}

/** 底部墨深 — 山水画"近深远淡" */
function drawBottomDepth() {
  const bottomAlpha = isDark ? 0.08 : 0.12
  const grad = ctx.createLinearGradient(0, height * 0.6, 0, height)
  grad.addColorStop(0, `rgba(${colorInk}, 0)`)
  grad.addColorStop(1, `rgba(${colorInk}, ${bottomAlpha})`)
  ctx.fillStyle = grad
  ctx.fillRect(0, height * 0.6, width, height * 0.4)
}

/* ================================================================
   渲染循环
   ================================================================ */
function render() {
  if (prefersReducedMotion) {
    ctx.clearRect(0, 0, width, height)
    for (const b of blobs) drawBlob(b)
    for (const d of inkDots) drawInkDot(d)
    for (const t of texts) drawText(t)
    drawBottomDepth()
    return
  }

  frameCount++
  ctx.clearRect(0, 0, width, height)

  // ── 1. 墨染云雾 ──
  for (const b of blobs) {
    b.x += b.speedX
    b.y += b.speedY
    if (b.x < -b.baseRadius) b.x = width + b.baseRadius
    if (b.x > width + b.baseRadius) b.x = -b.baseRadius
    if (b.y < -b.baseRadius) b.y = height + b.baseRadius
    if (b.y > height + b.baseRadius) b.y = -b.baseRadius
    drawBlob(b)
  }

  // ── 2. 墨点溅散 — 极缓漂移 ──
  for (const d of inkDots) {
    d.x += d.speedX
    d.y += d.speedY
    if (d.x < -20) d.x = width + 20
    if (d.x > width + 20) d.x = -20
    if (d.y < -20) d.y = height + 20
    if (d.y > height + 20) d.y = -20
    drawInkDot(d)
  }

  // ── 3. 书法文字 — 四向漂移 ──
  for (const t of texts) {
    t.x += t.speedX + Math.sin(frameCount * 0.005 + t.wobblePhase) * t.wobble
    t.y += t.speedY + Math.cos(frameCount * 0.005 + t.wobblePhase) * t.wobble * 0.5
    // 任意一边超出屏幕 → 回收重生
    if (t.y < -80 || t.y > height + 80 || t.x < -80 || t.x > width + 80) {
      recycleText(t)
    }
    drawText(t)
  }

  // ── 4. 底部墨深 ──
  drawBottomDepth()

  // ── 5. 触摸涟漪 ──
  if (props.touchPos.active && !wasTouchActive) {
    ripples.push({
      x: props.touchPos.x,
      y: props.touchPos.y,
      radius: 0,
      opacity: 0.18,
      maxRadius: 120,
    })
  }
  wasTouchActive = props.touchPos.active

  for (let i = ripples.length - 1; i >= 0; i--) {
    const rp = ripples[i]
    rp.radius += 1.0
    rp.opacity = rp.opacity * 0.983 - 0.0005
    if (rp.opacity <= 0 || rp.radius > rp.maxRadius) {
      ripples.splice(i, 1)
      continue
    }
    drawRipple(rp)
  }
  if (ripples.length > 6) ripples.length = 6

  animId = requestAnimationFrame(render)
}

/* ================================================================
   生命周期
   ================================================================ */
let themeObserver = null
let resizeObserver = null

onMounted(() => {
  prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  updateColors()
  resize()

  // —— 初始化墨团 ——
  for (let i = 0; i < BLOB_COUNT; i++) {
    blobs.push(createBlob())
  }

  // —— 初始化墨点溅散 ——
  for (let i = 0; i < INK_DOT_COUNT; i++) {
    inkDots.push(createInkDot())
  }

  // —— 初始化文字（四边随机出生，立即铺满全屏） ——
  // 第一遍：先全部按出生边放置；第二遍：把一半的文字随机扔到屏幕内部，开局不空洞
  for (let i = 0; i < TEXT_COUNT; i++) {
    const t = createText()
    // 半数文字直接放到屏幕内部已可见，避免开场全部从边缘涌入
    if (i < TEXT_COUNT / 2) {
      t.x = rand(width * 0.05, width * 0.95)
      t.y = rand(height * 0.05, height * 0.95)
    }
    texts.push(t)
  }

  // —— 立即启动渲染（不等待字体） ——
  // 字体栈已有降级：STKaiti / KaiTi 也是书法体，在 Ma Shan Zheng 加载完成前先用
  animId = requestAnimationFrame(render)

  // —— 后台加载毛笔字体 ——
  document.fonts.ready.then(() => {
    // 字体就绪后无需额外处理，drawText 下一次调用就会用上新字体
  })

  // —— 主题切换观察 ——
  themeObserver = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.attributeName === 'data-theme') updateColors()
    }
  })
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })

  // —— 视口变化观察 ——
  resizeObserver = new ResizeObserver(() => {
    resize()
    for (const b of blobs) {
      if (b.x > width) b.x = rand(0, width)
      if (b.y > height) b.y = rand(0, height)
    }
    for (const d of inkDots) {
      if (d.x > width) d.x = rand(0, width)
      if (d.y > height) d.y = rand(0, height)
    }
    for (const t of texts) {
      if (t.x < -40 || t.x > width + 40 || t.y < -40 || t.y > height + 40) {
        t.x = rand(width * 0.05, width * 0.95)
        t.y = rand(height * 0.05, height * 0.95)
      }
    }
  })
  resizeObserver.observe(document.body)
})

onBeforeUnmount(() => {
  if (animId) cancelAnimationFrame(animId)
  if (themeObserver) themeObserver.disconnect()
  if (resizeObserver) resizeObserver.disconnect()
})
</script>

<template>
  <canvas
    ref="canvasRef"
    class="dynamic-bg"
  />
</template>

<style scoped>
.dynamic-bg {
  position: absolute;
  inset: 0;
  z-index: 1; /* 高于 ::before 的墨洇遮罩，确保不被 backdrop-filter 影响 */
  pointer-events: none;
}
</style>
