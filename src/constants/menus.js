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
 *   · docs — 本菜单页展示的 Markdown 正文（src/assets/md/ 下的文件名，不含扩展名），
 *            文档搜索结果据此跳到对应菜单页并在正文里滚动高亮。两种写法：
 *              · 'gui-ze-cun-gui'                      —— 认领整篇
 *              · { id: 'you-xi-pai', heading: '趁火打劫' } —— 只认领该篇里这一节
 *            （多张牌/多条规则合并成一篇时，各页面按节分认领，别让认领跨页串门）
 */

import { TourKeys } from '@/constants/tourKeys';

/** 签题分类枚举 */
export const PackageName = Object.freeze({
  TOOL: '工具',
  MODE: '模式',
  DA_QI: '大旗',
  OL: 'OL',
  ANNIVERSARY: '十周年',
  MOBILE: 'M',
  XCX: '小程序',
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
    code: 'gui-ze-cun-gui',
    name: '规则&村规',
    route: '/tool/gui-ze-cun-gui',
    component: () => import('@/pages/tool/GuiZeCunGui/Index.vue'),
    // 文字封面：毛笔字主标题 + 副标题，底色取 themeColor（无图片资源）
    cover: { title: '规则村规', subtitle: '开局立矩 众行有据' },
    themeColor: ThemeColor.CRIMSON,
    packageName: PackageName.TOOL,
    // 补充检索标签（全局搜索用，也显示在结果行）：村规条目已并入本页
    tags: ['规则', '村规', '入门'],
    // 正文文件：src/assets/md/gui-ze-cun-gui.md
    docs: ['gui-ze-cun-gui'],
    // 空白布局：无装饰、无教学导览（不配 tourKey）、无持久化数据
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
  },
  {
    code: 'dou-di-zhu',
    name: '斗地主',
    route: '/mode/dou-di-zhu',
    component: () => import('@/pages/mode/DouDiZhu/Index.vue'),
    // 文字封面：毛笔字主标题 + 副标题，底色取 themeColor（无图片资源）
    cover: { title: '斗地主', subtitle: '一主二农 斗智斗勇' },
    themeColor: ThemeColor.EMBER,
    packageName: PackageName.MODE,
    // 补充检索标签（全局搜索用，也显示在结果行）
    tags: [],
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
    // 正文文件：src/assets/md/you-xi-pai.md（合并文档）—— 本页只认领「洞烛先机」一节
    docs: [{ id: 'you-xi-pai', heading: '洞烛先机' }],
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
  {
    code: 'jie-liu-bei-ji-jiang',
    name: '界刘备 激将',
    route: '/jxtp/jie-liu-bei-ji-jiang',
    component: () => import('@/pages/jxtp/JieLiuBeiJiJiang/Index.vue'),
    image: {
      src: 'src/assets/images/menus/界限突破-刘备-激将.webp',
      focalX: 50,
      focalY: 50,
      fit: 'cover',
    },
    themeColor: ThemeColor.EMBER,
    packageName: PackageName.JXTP,
    // 空白布局：无装饰、无教学导览（不配 tourKey）、无持久化数据
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
  },
  {
    code: 'mou-sun-quan-tong-ye',
    name: '谋孙权 统业',
    route: '/mobile/mou-sun-quan-tong-ye',
    component: () => import('@/pages/mobile/MouSunQuanTongYe/Index.vue'),
    image: {
      src: 'src/assets/images/menus/大旗-谋孙权-统业.webp',
      focalX: 50,
      focalY: 50,
      fit: 'cover',
    },
    themeColor: ThemeColor.EMBER,
    packageName: PackageName.MOBILE,
    // 补充检索标签（全局搜索用，也显示在结果行）：统业卡面上并出的两个技能名
    tags: ['英姿', '固政'],
    // 空白布局：无装饰、无教学导览（不配 tourKey）、无持久化数据
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
  },
  {
    code: 'mou-pang-tong-hong-tu',
    name: '谋庞统 鸿图',
    route: '/ol/mou-pang-tong-hong-tu',
    component: () => import('@/pages/ol/MouPangTongHongTu/Index.vue'),
    image: {
      src: 'src/assets/images/menus/OL-谋庞统-鸿图.webp',
      focalX: 53,
      focalY: 40,
      fit: 'cover',
    },
    themeColor: ThemeColor.EMBER,
    packageName: PackageName.OL,
    // 补充检索标签（全局搜索用，也显示在结果行）：鸿图卡面上的两个技能名
    tags: ['飞军', '潜袭'],
    // 空白布局：无装饰、无教学导览（不配 tourKey）、无持久化数据
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
  },
  {
    code: 'xia-hou-ba-bao-bian',
    name: '夏侯霸 豹变',
    route: '/jx/xia-hou-ba-bao-bian',
    component: () => import('@/pages/jx/XiaHouBaBaoBian/Index.vue'),
    image: {
      src: 'src/assets/images/menus/将星-夏侯霸-豹变.webp',
      focalX: 56,
      focalY: 43,
      fit: 'cover',
    },
    themeColor: ThemeColor.EMBER,
    packageName: PackageName.JX,
    // 补充检索标签（全局搜索用，也显示在结果行）：豹变卡面上并出的三个技能名
    tags: ['挑衅', '咆哮', '神速'],
    // 空白布局：无装饰、无教学导览（不配 tourKey）、无持久化数据
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
  },
  {
    code: 'cheng-lv-bu-qing-jiao',
    name: '承吕布 轻狡',
    route: '/jsrg/cheng-lv-bu-qing-jiao',
    component: () => import('@/pages/jsrg/ChengLvBuQingJiao/Index.vue'),
    image: {
      src: 'src/assets/images/menus/江山如故·承-吕布.webp',
      focalX: 50,
      focalY: 45,
      fit: 'cover',
    },
    themeColor: ThemeColor.CRIMSON,
    packageName: PackageName.JSRG,
    // 补充检索标签（全局搜索用，也显示在结果行）：本页两张牌面的名字
    tags: ['推心置腹', '趁火打劫'],
    // 正文文件：src/assets/md/you-xi-pai.md（合并文档）—— 本页认领其中两节
    docs: [
      { id: 'you-xi-pai', heading: '推心置腹' },
      { id: 'you-xi-pai', heading: '趁火打劫' },
    ],
    // 空白布局：无装饰、无教学导览（不配 tourKey）、无持久化数据
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
  },
  {
    code: 'ji-si-ma-yi-yin-ren',
    name: '极司马懿 隐忍',
    route: '/ji/ji-si-ma-yi-yin-ren',
    component: () => import('@/pages/ji/SiMaYiYinRen/Index.vue'),
    image: {
      src: 'src/assets/images/menus/极-司马懿-隐忍.webp',
      focalX: 53,
      focalY: 45,
      fit: 'cover',
    },
    themeColor: ThemeColor.STEEL_BLUE,
    packageName: PackageName.XCX,
    // 空白布局：无装饰、无教学导览（不配 tourKey）、无持久化数据
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
    tags: ['奸雄', '行殇', '明鉴'],
  },
  {
    code: 'mou-jiang-wei-ran-ji',
    name: '谋姜维 燃己',
    route: '/ol/mou-jiang-wei-ran-ji',
    component: () => import('@/pages/ol/MouJiangWeiRanJi/Index.vue'),
    image: {
      src: 'src/assets/images/menus/OL-谋姜维-燃己.webp',
      focalX: 50,
      focalY: 50,
      fit: 'cover',
    },
    themeColor: ThemeColor.EMBER,
    packageName: PackageName.OL,
    // 补充检索标签（全局搜索用，也显示在结果行）：燃己卡面上的两个技能名
    tags: ['困奋', '诈降'],
    // 空白布局：无装饰、无教学导览（不配 tourKey）、无持久化数据
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
  },
  {
    code: 'guan-xing-zhang-bao-fu-hun',
    name: '关兴＆张苞 父魂',
    route: '/yjcm/guan-xing-zhang-bao-fu-hun',
    component: () => import('@/pages/yjcm/GuanXingZhangBaoFuHun/Index.vue'),
    image: {
      src: 'src/assets/images/menus/一将-关兴张苞-父魂.webp',
      focalX: 50,
      focalY: 50,
      fit: 'cover',
    },
    themeColor: ThemeColor.CRIMSON,
    packageName: PackageName.YJCM,
    // 补充检索标签（全局搜索用，也显示在结果行）：父魂卡面上的两个技能名
    tags: ['武圣', '咆哮'],
    // 空白布局：无装饰、无教学导览（不配 tourKey）、无持久化数据
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
  },
  {
    code: 'he-qi-qi-zhou',
    name: '贺齐 绮胄',
    route: '/yjcm/he-qi-qi-zhou',
    component: () => import('@/pages/yjcm/HeQiQiZhou/Index.vue'),
    image: {
      src: 'src/assets/images/menus/一将-贺齐-绮胄.webp',
      focalX: 50,
      focalY: 50,
      fit: 'cover',
    },
    themeColor: ThemeColor.STEEL_BLUE,
    packageName: PackageName.YJCM,
    // 补充检索标签（全局搜索用，也显示在结果行）：绮胄卡面上的四个技能名
    tags: ['短兵', '英姿', '奋威', '澜疆'],
    // 空白布局：无装饰、无教学导览（不配 tourKey）、无持久化数据
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
  },
];

export default menus;
