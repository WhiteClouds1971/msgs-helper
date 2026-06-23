# Voice 仪表盘 — Console Zone 集成

**日期**: 2026-06-23 | **状态**: approved

## 目标

在 Console（尚书台）中新增 Voice Zone，放置语音仪表盘组件。第一阶段仅实现外观，不接入功能。

## 架构

```
consoleItems.js
├── Zone.FEATURES  (现有)
└── Zone.VOICE     (新增)
     └── VoiceDashboard.vue  (新建)
```

## 文件变更

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/constants/consoleItems.js` | 修改 | 新增 `Zone.VOICE`，追加 voice-dashboard 条目 |
| `src/components/Console/Index.vue` | 修改 | `zoneCodes` 追加 `'voice'` |
| `src/components/Console/components/VoiceDashboard.vue` | 新建 | 纯外观仪表盘 |
| `src/assets/icons/voice-on.svg` | 新建 | 语音开图标 |
| `src/assets/icons/voice-off.svg` | 新建 | 语音关图标 |
| `src/assets/icons/play.svg` | 新建 | 播放图标 |
| `src/assets/icons/pause.svg` | 新建 | 暂停图标 |
| `src/assets/icons/shuffle.svg` | 新建 | 随机播放图标 |
| `src/assets/icons/repeat-single.svg` | 新建 | 单曲循环图标 |
| `src/assets/icons/repeat-all.svg` | 新建 | 列表循环图标 |

## 组件规格

### VoiceDashboard.vue

横向单行布局，满列宽（colSpan: 6），高度 1 个方格单位（~80px）。

```
┌──────────────────────────────────────────────────────┐
│  🔊  语音仪表                                ▶️  🔄   │
└──────────────────────────────────────────────────────┘
```

**元素（从左到右）**：

1. **喇叭图标** — 初始显示 `voice-on.svg`，`--text-tertiary` 着色，表示未激活
2. **占位文字** — `"语音仪表"`，`--text-tertiary`，`--font-display` 字体
3. **spacer** — `flex: 1` 撑开左右
4. **播放按钮** — 圆形（直径约 2em），`play.svg`，`--bg-surface-hover` 底色
5. **播放模式图标** — `repeat-all.svg`，`--text-tertiary`

**状态**：全静态。所有图标使用 `?raw` 导入，`v-html` 渲染。颜色通过 `:deep(svg)` 的 `fill: currentColor` 控制。

### consoleItems 条目

```js
{
  id: 'voice-dashboard',
  zone: Zone.VOICE,
  colSpan: 6,
  tip: '语音仪表',
  component: defineAsyncComponent(() => import('@/components/Console/components/VoiceDashboard.vue')),
}
```

### Index.vue 改动

`zoneCodes` 数组末尾追加 `'voice'`，自动渲染在 features zone 下方（zone 之间由 `.console-zone:not(:first-child)` 的 `border-top` 分隔）。

## 非目标

- 不接入 Pinia store
- 不处理点击/切换事件
- 不做文字滚动动画
- 不弹出剧本列表
