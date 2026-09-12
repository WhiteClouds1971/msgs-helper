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

import { TourKeys } from '@/constants/tourKeys';

/** 签题分类枚举 */
export const PackageName = Object.freeze({
  TOOL: '工具',
  DA_QI: '大旗',
  OL: 'OL',
  ANNIVERSARY: '十周年',
  MOBILE: 'M',
  JXTP: '界限突破',
  SHZL: '神话再临',
  YJCM: '一将',
  JX: '将星',
  JSRG: '江山如故',
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
    code: 'shen-hua-tuo-wu-qin-xi',
    name: '神华佗 五禽戏',
    route: '/mobile/shen-hua-tuo-wu-qin-xi',
    component: () => import('@/pages/mobile/ShenHuaTuoWuQinXi/Index.vue'),
    image: {
      src: 'src/assets/images/menus/大旗-神华佗-五禽戏.webp',
      focalX: 50,
      focalY: 50,
      fit: 'cover',
    },
    themeColor: ThemeColor.FOREST,
    packageName: PackageName.MOBILE,
    // 补充检索标签（全局搜索用，也显示在结果行）：神华佗的常用别称
    tags: ['华佗'],
    // 教学导览：五禽戏技能区手势（首次进入自动教一次，之后走控制台「教学导览」）
    tourKey: TourKeys.SHEN_HUA_TUO_WU_QIN_XI,
    // 空白布局：无装饰；有教学导览与页面数据（技能顺序存 route.fullPath）
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
  },
  {
    // 合并自原「夏侯渊 神速」「洞烛先机」两个菜单（页面同时展示两张原图）
    code: 'guo-jia',
    name: '转郭嘉',
    route: '/jsrg/guo-jia',
    component: () => import('@/pages/jsrg/GuoJia/Index.vue'),
    image: {
      src: 'src/assets/images/menus/江山如故·转-郭嘉.webp',
      focalX: 50,
      focalY: 50,
      fit: 'cover',
    },
    themeColor: ThemeColor.EMBER,
    packageName: PackageName.JSRG,
    // 补充检索标签（全局搜索用，也显示在结果行）：原两个菜单名
    tags: ['洞烛先机', '神速'],
    // 正文文件：src/assets/md/dong-zhu-xian-ji.md
    docs: ['dong-zhu-xian-ji'],
    // 空白布局：无装饰、无教学导览（不配 tourKey）、无持久化数据
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
  },
  {
    code: 'sun-ce',
    name: '界孙策 魂姿',
    route: '/shzl/sun-ce',
    component: () => import('@/pages/shzl/SunCe/Index.vue'),
    image: {
      src: 'src/assets/images/menus/大旗-孙策-魂姿.webp',
      focalX: 50,
      focalY: 50,
      fit: 'cover',
    },
    themeColor: ThemeColor.STEEL_BLUE,
    packageName: PackageName.SHZL,
    // 补充检索标签（全局搜索用，也显示在结果行）：江东的小霸王
    // 空白布局：无装饰、无教学导览（不配 tourKey）、无持久化数据
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
  },
  {
    code: 'shen-si-ma-yi-ji-lue',
    name: '神司马懿 极略',
    route: '/shzl/shen-si-ma-yi-ji-lue',
    component: () => import('@/pages/shzl/ShenSiMaYiJiLue/Index.vue'),
    image: {
      src: 'src/assets/images/menus/大旗-神司马懿-极略.webp',
      focalX: 50,
      focalY: 50,
      fit: 'cover',
    },
    themeColor: ThemeColor.ORCHID,
    packageName: PackageName.SHZL,
    tags: ['鬼才', '放逐', '集智', '制衡', '完杀'],
    // 空白布局：无装饰、无教学导览（不配 tourKey）、无持久化数据
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
  },
  {
    code: 'liu-xie-mi-zhao',
    name: '刘协 密诏',
    route: '/jx/liu-xie-mi-zhao',
    component: () => import('@/pages/jx/LiuXieMiZhao/Index.vue'),
    image: {
      src: 'src/assets/images/menus/大旗-刘协-密诏.webp',
      focalX: 50,
      focalY: 50,
      fit: 'cover',
    },
    themeColor: ThemeColor.ORCHID,
    packageName: PackageName.JX,
    // 补充检索标签（全局搜索用，也显示在结果行）：汉献帝 —— 刘协的常用别称
    tags: ['汉献帝'],
    // 空白布局：无装饰、无教学导览（不配 tourKey）、无持久化数据
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
  },
  {
    code: 'mou-dong-zhuo-zhi-bing',
    name: '谋董卓 执柄',
    route: '/ol/mou-dong-zhuo-zhi-bing',
    component: () => import('@/pages/ol/MouDongZhuoZhiBing/Index.vue'),
    image: {
      src: 'src/assets/images/menus/OL-谋董卓-执柄.webp',
      focalX: 50,
      focalY: 50,
      fit: 'cover',
    },
    themeColor: ThemeColor.EMBER,
    packageName: PackageName.OL,
    // 补充检索标签（全局搜索用，也显示在结果行）：谋董卓的两个技能名
    tags: ['焚城', '崩坏'],
    // 空白布局：无装饰、无教学导览（不配 tourKey）、无持久化数据
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
  },
  {
    code: 'guan-suo-zheng-nan',
    name: '关索 征南',
    route: '/ol/guan-suo-zheng-nan',
    component: () => import('@/pages/ol/GuanSuoZhengNan/Index.vue'),
    image: {
      src: 'src/assets/images/menus/OL-关索-征南.webp',
      focalX: 50,
      focalY: 50,
      fit: 'cover',
    },
    themeColor: ThemeColor.EMBER,
    packageName: PackageName.OL,
    // 补充检索标签（全局搜索用，也显示在结果行）：关索的三个技能名
    tags: ['武圣', '当先', '制蛮'],
    // 空白布局：无装饰、无教学导览（不配 tourKey）、无持久化数据
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
  },
  {
    code: 'shen-cao-cao-fei-ying',
    name: '神曹操 飞影',
    route: '/shzl/shen-cao-cao-fei-ying',
    component: () => import('@/pages/shzl/ShenCaoCaoFeiYing/Index.vue'),
    image: {
      src: 'src/assets/images/menus/大旗-神曹操-飞影.webp',
      focalX: 50,
      focalY: 50,
      fit: 'cover',
    },
    themeColor: ThemeColor.CRIMSON,
    packageName: PackageName.SHZL,
    // 空白布局：无装饰、无教学导览（不配 tourKey）、无持久化数据
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
  },
  {
    code: 'si-ma-hui-jian-jie',
    name: '司马徽 荐杰',
    route: '/ol/si-ma-hui-jian-jie',
    component: () => import('@/pages/ol/SiMaHuiJianJie/Index.vue'),
    image: {
      src: 'src/assets/images/menus/OL-司马徽-荐杰.webp',
      focalX: 50,
      focalY: 50,
      fit: 'cover',
    },
    themeColor: ThemeColor.STEEL_BLUE,
    packageName: PackageName.OL,
    // 补充检索标签（全局搜索用，也显示在结果行）：司马徽的三个技能名
    tags: ['火计', '连环', '业炎'],
    // 空白布局：无装饰、无教学导览（不配 tourKey）、无持久化数据
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
  },
  {
    code: 'jie-zhao-yun-long-dan',
    name: '界赵云 龙胆',
    route: '/ol/jie-zhao-yun-long-dan',
    component: () => import('@/pages/ol/JieZhaoYunLongDan/Index.vue'),
    image: {
      src: 'src/assets/images/menus/OL-界赵云-龙胆.webp',
      focalX: 50,
      focalY: 50,
      fit: 'cover',
    },
    themeColor: ThemeColor.CRIMSON,
    packageName: PackageName.JXTP,
    // 空白布局：无装饰、无教学导览（不配 tourKey）、无持久化数据
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
  },
  {
    code: 'jie-cao-cao-jian-xiong',
    name: '界曹操 奸雄',
    route: '/jxtp/jie-cao-cao-jian-xiong',
    component: () => import('@/pages/jxtp/JieCaoCaoJianXiong/Index.vue'),
    image: {
      src: 'src/assets/images/menus/界限突破-曹操-奸雄.webp',
      focalX: 50,
      focalY: 50,
      fit: 'cover',
    },
    themeColor: ThemeColor.CRIMSON,
    packageName: PackageName.JXTP,
    // 补充检索标签（全局搜索用，也显示在结果行）：界曹操的另一技能与常用别称
    tags: ['护驾', '魏武帝'],
    // 空白布局：无装饰、无教学导览（不配 tourKey）、无持久化数据
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
  },
];

export default menus;
