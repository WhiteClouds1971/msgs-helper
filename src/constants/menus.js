/**
 * 面杀辅助工具菜单 — 单一事实源
 *
 * 每个条目代表一个工具/武将卡片入口，定义其展示元数据。
 * 菜单顺序即为默认排序。
 *
 * 卡片封面二选一（HomePageCard 按 cover 优先）：
 *   · cover — 文字封面 { title, subtitle }，底色取本条目 themeColor，无图片资源
 *   · image — 位图封面，src 必须是 src/assets/images/menus/ 下的文件名
 *
 * 可选检索/关联字段（全局搜索用）：
 *   · tags — 补充检索标签，参与模糊匹配，并作为标签显示在结果行
 *   · docs — 本菜单页展示的 Markdown 文档 id 列表（src/assets/md/ 下的文件名，不含扩展名），
 *            文档搜索结果据此跳到对应菜单页并在正文里滚动高亮
 */

/** 签题分类枚举 */
export const PackageName = Object.freeze({
  TOOL: '工具',
  OL: 'OL',
  ANNIVERSARY: '十周年',
  MOBILE: 'M',
  DA_QI: '大旗',
});

/** 菜单布局枚举（值对应 App.vue 的 layoutMap 键名） */
export const MenuLayout = Object.freeze({
  BACKGROUND: 'BackgroundLayout',
  BLANK: 'BlankLayout',
});

/** 主题色枚举 */
export const ThemeColor = Object.freeze({
  ROSE: '#D87093', // 蔷薇粉
  CRIMSON: '#8B0000', // 殿前朱
  STEEL_BLUE: '#4682B4', // 翠鸾青
  FOREST: '#228B22', // 竹翠绿
  ORCHID: '#DA70D6', // 婀娜紫
  JADE: '#2E8B57', // 玉瓷青
  EMBER: '#FF4500', // 炙龙赤
});

const menus = [
  {
    code: 'cun-gui',
    name: '村规',
    route: '/tool/cun-gui',
    component: () => import('@/pages/tool/CunGui/Index.vue'),
    // 文字封面：毛笔字主标题 + 副标题，底色取 themeColor
    cover: { title: '村规', subtitle: '入乡随俗 众议成规' },
    themeColor: ThemeColor.CRIMSON,
    packageName: PackageName.TOOL,
    // 正文文件：src/assets/md/cun-gui.md
    docs: ['cun-gui'],
    tags: ['规则', '约定'],
    // 空白布局：无装饰、无教学导览（不配 tourKey）、无持久化数据
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
  },
  {
    code: 'xia-hou-yuan-shen-su',
    name: '夏侯渊 神速',
    route: '/da-qi/xia-hou-yuan-shen-su',
    component: () => import('@/pages/da-qi/XiaHouYuanShenSu/Index.vue'),
    image: {
      src: 'src/assets/images/menus/大旗-夏侯渊-神速.webp',
      focalX: 50,
      focalY: 50,
      fit: 'cover',
    },
    themeColor: ThemeColor.STEEL_BLUE,
    packageName: PackageName.DA_QI,
    // 空白布局：无装饰、无教学导览（不配 tourKey）、无持久化数据
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
  },
];

export default menus;
