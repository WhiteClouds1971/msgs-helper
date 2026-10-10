/**
 * 教学导览步骤注册表 — 单一事实源
 *
 * 每个导览是一个 { steps, ...hooks } 对象（向下兼容纯 steps[] 数组）。
 *
 * Step 字段：
 *   element  — 目标元素 ID，如 `#card-stack`
 *   popover  — { title, description, side?, align? }
 *   onEnter  — 进入步骤时执行的脚本（可选）
 *   onLeave  — 离开步骤时执行的脚本（可选）
 *
 * Tour 级钩子（均可选）：
 *   onBeforeStart   — 教学开始前执行一次
 *   onBoundaryArrow — 点击首步 ◀ 或末步 ▶（已是边界无法翻页）时执行，参数 ('left'|'right')
 *
 * 添加教程：下面和 tourKeys.js 同步追加 key，组件中 start(TourKeys.XXX) 即可。
 */
export const tourSteps = Object.freeze({
  home: Object.freeze({
    steps: Object.freeze([
      {
        element: '#card-stack',
        popover: {
          title: '操作指引',
          description: '左右拖动切换菜单，点击前置卡片进入详情。',
        },
      },
    ]),
  }),

  /** 玉玺：主页之外唯一的常驻入口，两步手势（按钮在右下，弹窗置于其上方） */
  'menu-seal': Object.freeze({
    steps: Object.freeze([
      {
        element: '#jade-seal',
        popover: {
          title: '玉玺用法',
          description: '单击打开全局搜索，长按打开控制台。',
          side: 'top',
          align: 'end',
        },
      },
    ]),
  }),

  /** 神华佗 五禽戏：技能区在图片之上，三步讲清手势与还原 */
  'shen-hua-tuo-wu-qin-xi': Object.freeze({
    steps: Object.freeze([
      {
        element: '#wqx-skills',
        popover: {
          title: '五禽戏 · 技能',
          description:
            '五张技能牌自上而下就是你的技能顺序。长按任意一张，等它浮起后上下拖动即可排序。',
        },
      },
      {
        element: '#wqx-reset',
        popover: {
          title: '移除与重置',
          description: '左滑任意技能牌可把它移除；想找回来，点这里「重置」一次还原。',
          side: 'bottom',
          align: 'end',
        },
      },
      {
        element: '#wqx-banner',
        popover: {
          title: '规则大旗',
          description: '下方是五禽戏完整牌面，上下滑动可以看全。',
          side: 'top',
        },
      },
    ]),
  }),

  /** 记录 游戏牌：模式 → 牌池 → 已记录区，三步讲清怎么记、怎么删、怎么藏 */
  'ji-lu': Object.freeze({
    steps: Object.freeze([
      {
        element: '#jlp-mode',
        popover: {
          title: '两种记法',
          description:
            '简单模式只点亮牌名；复杂模式点开牌名挑花色与点数，记下的牌落在下方列表。',
        },
      },
      {
        element: '#jlp-pool',
        popover: {
          title: '游戏牌',
          description:
            '基本、锦囊、装备分成三折，记哪一类就展开哪一类；点牌名就是记它。',
          side: 'top',
        },
      },
      {
        element: '#jlp-added',
        popover: {
          title: '已记录的牌',
          description:
            '左滑一张把它删掉；点牌面可隐藏或显示信息，右上角两枚按钮能一次全部隐藏或全部显示。',
          side: 'top',
        },
      },
    ]),
  }),
});
