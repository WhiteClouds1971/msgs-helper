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
  HEROES: '武将',
  DA_QI: '大旗',
  YOU_XI_PAI: '游戏牌',
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
    code: 'sheng-lv-bang',
    name: '胜率榜',
    route: '/tool/sheng-lv-bang',
    component: () => import('@/pages/tool/ShengLvBang/Index.vue'),
    // 文字封面：毛笔字主标题 + 副标题，底色取 themeColor（无图片资源）
    cover: { title: '胜率榜', subtitle: '明辨强弱 择将而战' },
    themeColor: ThemeColor.STEEL_BLUE,
    packageName: PackageName.TOOL,
    // 补充检索标签（全局搜索用，也显示在结果行）：本页的口径与常见叫法
    tags: ['胜率', '排行', '武将统计', '将池'],
    // 空白布局：无装饰、无教学导览（不配 tourKey）；有页面数据（模式 / 将池存 route.fullPath）
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
  },
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
    code: 'zhu-lu-zhong-yuan',
    name: '逐鹿中原',
    route: '/mode/zhu-lu-zhong-yuan',
    component: () => import('@/pages/mode/ZhuLuZhongYuan/Index.vue'),
    // 文字封面：毛笔字主标题 + 副标题，底色取 themeColor（无图片资源）
    cover: { title: '逐鹿中原', subtitle: '暗置六将 以分定鼎' },
    themeColor: ThemeColor.CRIMSON,
    packageName: PackageName.MODE,
    // 补充检索标签（全局搜索用，也显示在结果行）：本模式的核心机制与常见叫法
    tags: ['暗将', '计分', '群雄'],
    // 正文文件：src/assets/md/zhu-lu-zhong-yuan.md（规则，整篇）
    docs: ['zhu-lu-zhong-yuan'],
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
    themeColor: ThemeColor.JADE,
    packageName: PackageName.MODE,
    // 补充检索标签（全局搜索用，也显示在结果行）
    tags: [],
    // 正文文件：src/assets/md/dou-di-zhu.md（规则，整篇）
    docs: ['dou-di-zhu'],
    // 空白布局：无装饰、无教学导览（不配 tourKey）、无持久化数据
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
  },
  {
    code: 'pai-wei',
    name: '排位',
    route: '/mode/pai-wei',
    component: () => import('@/pages/mode/PaiWei/Index.vue'),
    // 文字封面：毛笔字主标题 + 副标题，底色取 themeColor（无图片资源）
    cover: { title: '排位', subtitle: '四人成席 两两为盟' },
    themeColor: ThemeColor.FOREST,
    packageName: PackageName.MODE,
    // 补充检索标签（全局搜索用，也显示在结果行）：本模式的常见叫法与人数
    tags: ['排位赛', '2v2', '团战'],
    // 正文文件：src/assets/md/pai-wei.md（规则，整篇）
    docs: ['pai-wei'],
    // 空白布局：无装饰、无教学导览（不配 tourKey）、无持久化数据
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
  },
  {
    code: 'ji-lu',
    name: '记录',
    route: '/tool/ji-lu',
    component: () => import('@/pages/tool/JiLu/Index.vue'),
    // 文字封面：毛笔字主标题 + 副标题，底色取 themeColor（无图片资源）
    cover: { title: '记录', subtitle: '落牌成册 心中有数' },
    themeColor: ThemeColor.JADE,
    packageName: PackageName.TOOL,
    // 补充检索标签（全局搜索用，也显示在结果行）：本页的常见叫法
    tags: ['记牌', '牌池', '游戏牌', '花色点数'],
    // 教学导览：模式切换 / 牌池 / 已记录区三步（首次进入自动教一次，之后走控制台「教学导览」）
    tourKey: TourKeys.JI_LU,
    // 空白布局：无装饰；有教学导览与页面数据（模式 / 点亮的牌 / 记录存 route.fullPath）
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
  },
  {
    code: 'luo-tong',
    name: '骆统',
    route: '/heroes/luo-tong',
    component: () => import('@/pages/heroes/LuoTong/Index.vue'),
    image: {
      src: 'src/assets/images/menus/武将-骆统-勤政.webp',
      focalX: 46,
      focalY: 41,
      fit: 'cover',
    },
    themeColor: ThemeColor.JADE,
    packageName: PackageName.HEROES,
    // 补充检索标签（全局搜索用，也显示在结果行）：骆统的技能名
    tags: ['勤政'],
    // 空白布局：无装饰、无教学导览（不配 tourKey）；有页面数据（本回合出牌数存 route.fullPath）
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
  },
  {
    code: 'shen-hua-tuo',
    name: '神华佗',
    route: '/heroes/shen-hua-tuo',
    component: () => import('@/pages/heroes/ShenHuaTuo/Index.vue'),
    image: {
      src: 'src/assets/images/menus/武将-神华佗-五禽戏.webp',
      focalX: 50,
      focalY: 50,
      fit: 'cover',
    },
    themeColor: ThemeColor.FOREST,
    packageName: PackageName.HEROES,
    // 补充检索标签（全局搜索用，也显示在结果行）：神华佗的常用别称
    tags: ['五禽戏'],
    // 教学导览：五禽戏技能区手势（首次进入自动教一次，之后走控制台「教学导览」）
    tourKey: TourKeys.SHEN_HUA_TUO_WU_QIN_XI,
    // 空白布局：无装饰；有教学导览与页面数据（技能顺序存 route.fullPath）
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
  },
  {
    // 合并自原「夏侯渊 神速」「洞烛先机」两个菜单（页面同时展示两张原图）
    code: 'zhuan-guo-jia',
    name: '转郭嘉',
    route: '/da-qi/zhuan-guo-jia',
    component: () => import('@/pages/da-qi/ZhuanGuoJia/Index.vue'),
    image: {
      src: 'src/assets/images/menus/大旗-转郭嘉-.webp',
      focalX: 50,
      focalY: 50,
      fit: 'cover',
    },
    themeColor: ThemeColor.EMBER,
    packageName: PackageName.DA_QI,
    // 补充检索标签（全局搜索用，也显示在结果行）：原两个菜单名
    tags: ['洞烛先机', '神速'],
    // 正文文件：src/assets/md/you-xi-pai.md（合并文档）—— 本页只认领「洞烛先机」一节
    docs: [{ id: 'you-xi-pai', heading: '洞烛先机' }],
    // 空白布局：无装饰、无教学导览（不配 tourKey）、无持久化数据
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
  },
  {
    code: 'shen-si-ma-yi',
    name: '神司马懿',
    route: '/da-qi/shen-si-ma-yi',
    component: () => import('@/pages/da-qi/ShenSiMaYi/Index.vue'),
    image: {
      src: 'src/assets/images/menus/大旗-神司马懿-极略.webp',
      focalX: 50,
      focalY: 50,
      fit: 'cover',
    },
    themeColor: ThemeColor.ORCHID,
    packageName: PackageName.DA_QI,
    tags: ['极略', '鬼才', '放逐', '集智', '制衡', '完杀'],
    // 空白布局：无装饰、无教学导览（不配 tourKey）、无持久化数据
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
  },
  {
    code: 'si-ma-hui',
    name: '司马徽',
    route: '/da-qi/si-ma-hui',
    component: () => import('@/pages/da-qi/SiMaHui/Index.vue'),
    image: {
      src: 'src/assets/images/menus/大旗-司马徽-荐杰.webp',
      focalX: 50,
      focalY: 50,
      fit: 'cover',
    },
    themeColor: ThemeColor.STEEL_BLUE,
    packageName: PackageName.DA_QI,
    // 补充检索标签（全局搜索用，也显示在结果行）：司马徽的三个技能名
    tags: ['荐杰', '火计', '连环', '业炎'],
    // 空白布局：无装饰、无教学导览（不配 tourKey）、无持久化数据
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
  },
  {
    code: 'xia-hou-ba',
    name: '夏侯霸',
    route: '/da-qi/xia-hou-ba',
    component: () => import('@/pages/da-qi/XiaHouBa/Index.vue'),
    image: {
      src: 'src/assets/images/menus/大旗-夏侯霸-豹变.webp',
      focalX: 56,
      focalY: 43,
      fit: 'cover',
    },
    themeColor: ThemeColor.EMBER,
    packageName: PackageName.DA_QI,
    // 补充检索标签（全局搜索用，也显示在结果行）：豹变卡面上并出的三个技能名
    tags: ['豹变', '挑衅', '咆哮', '神速'],
    // 空白布局：无装饰、无教学导览（不配 tourKey）、无持久化数据
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
  },
  {
    code: 'cheng-lv-bu',
    name: '承吕布',
    route: '/da-qi/cheng-lv-bu',
    component: () => import('@/pages/da-qi/ChengLvBu/Index.vue'),
    image: {
      src: 'src/assets/images/menus/大旗-承吕布-.webp',
      focalX: 50,
      focalY: 45,
      fit: 'cover',
    },
    themeColor: ThemeColor.CRIMSON,
    packageName: PackageName.DA_QI,
    // 补充检索标签（全局搜索用，也显示在结果行）：本页两张牌面的名字
    tags: ['轻狡', '推心置腹', '趁火打劫'],
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
    code: 'he-qi',
    name: '贺齐',
    route: '/da-qi/he-qi',
    component: () => import('@/pages/da-qi/HeQi/Index.vue'),
    image: {
      src: 'src/assets/images/menus/大旗-贺齐-绮胄.webp',
      focalX: 50,
      focalY: 50,
      fit: 'cover',
    },
    themeColor: ThemeColor.STEEL_BLUE,
    packageName: PackageName.DA_QI,
    // 补充检索标签（全局搜索用，也显示在结果行）：绮胄卡面上的四个技能名
    tags: ['绮胄', '短兵', '英姿', '奋威', '澜疆'],
    // 空白布局：无装饰、无教学导览（不配 tourKey）、无持久化数据
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
  },
  {
    code: 'nan-hua-lao-xian',
    name: '南华老仙',
    route: '/da-qi/nan-hua-lao-xian',
    component: () => import('@/pages/da-qi/NanHuaLaoXian/Index.vue'),
    image: {
      src: 'src/assets/images/menus/大旗-南华老仙-逍遥仙游.webp',
      focalX: 50,
      focalY: 45,
      fit: 'cover',
    },
    themeColor: ThemeColor.STEEL_BLUE,
    packageName: PackageName.DA_QI,
    // 补充检索标签（全局搜索用，也显示在结果行）：本页牌面名
    tags: ['天书'],
    // 空白布局：无装饰、无教学导览（不配 tourKey）、无持久化数据
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
  },
  {
    code: 'ji-kang',
    name: '嵇康',
    route: '/da-qi/ji-kang',
    component: () => import('@/pages/da-qi/JiKang/Index.vue'),
    image: {
      src: 'src/assets/images/menus/大旗-嵇康-峻峰孤松.webp',
      focalX: 50,
      focalY: 51,
      fit: 'cover',
    },
    themeColor: ThemeColor.STEEL_BLUE,
    packageName: PackageName.DA_QI,
    // 补充检索标签（全局搜索用，也显示在结果行）：绝响卡面上的四种弦
    tags: ['和弦', '柔弦', '烈弦', '激弦'],
    // 空白布局：无装饰、无教学导览（不配 tourKey）、无持久化数据
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
  },
  {
    code: 'mo-sun-quan',
    name: '魔孙权',
    route: '/da-qi/mo-sun-quan',
    component: () => import('@/pages/da-qi/MoSunQuan/Index.vue'),
    image: {
      src: 'src/assets/images/menus/大旗-魔孙权-隳坠的英谋.webp',
      focalX: 51,
      focalY: 52,
      fit: 'cover',
    },
    themeColor: ThemeColor.STEEL_BLUE,
    packageName: PackageName.DA_QI,
    // 补充检索标签（全局搜索用，也显示在结果行）：本页牌面名
    tags: ['权御'],
    // 空白布局：无装饰、无教学导览（不配 tourKey）、无持久化数据
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
  },
  {
    code: 'zhou-chu',
    name: '周处',
    route: '/da-qi/zhou-chu',
    component: () => import('@/pages/da-qi/ZhouChu/Index.vue'),
    image: {
      src: 'src/assets/images/menus/大旗-周处-英情天逸.webp',
      focalX: 56,
      focalY: 42,
      fit: 'cover',
    },
    themeColor: ThemeColor.STEEL_BLUE,
    packageName: PackageName.DA_QI,
    // 补充检索标签（全局搜索用，也显示在结果行）：本页牌面名
    tags: ['除害'],
    // 空白布局：无装饰、无教学导览（不配 tourKey）、无持久化数据
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
  },
  {
    code: 'shen-tai-shi-ci',
    name: '神太史慈',
    route: '/da-qi/shen-tai-shi-ci',
    component: () => import('@/pages/da-qi/ShenTaiShiCi/Index.vue'),
    image: {
      src: 'src/assets/images/menus/大旗-神太史慈-义信天武.webp',
      focalX: 52,
      focalY: 38,
      fit: 'cover',
    },
    themeColor: ThemeColor.CRIMSON,
    packageName: PackageName.DA_QI,
    // 补充检索标签（全局搜索用，也显示在结果行）：本页牌面名
    tags: ['破围'],
    // 空白布局：无装饰、无教学导览（不配 tourKey）、无持久化数据
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
  },
  {
    code: 'shen-zhong-hui',
    name: '神钟会',
    route: '/da-qi/shen-zhong-hui',
    component: () => import('@/pages/da-qi/ShenZhongHui/Index.vue'),
    image: {
      src: 'src/assets/images/menus/大旗-神钟会-立世.webp',
      focalX: 50,
      focalY: 45,
      fit: 'cover',
    },
    themeColor: ThemeColor.ORCHID,
    packageName: PackageName.DA_QI,
    // 补充检索标签（全局搜索用，也显示在结果行）：本页牌面名
    tags: ['立世'],
    // 空白布局：无装饰、无教学导览（不配 tourKey）、无持久化数据
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
  },
  {
    code: 'chu-qi-bu-yi',
    name: '出其不意',
    route: '/you-xi-pai/chu-qi-bu-yi',
    component: () => import('@/pages/you-xi-pai/ChuQiBuYi/Index.vue'),
    image: {
      src: 'src/assets/images/menus/游戏牌-出其不意-.webp',
      focalX: 50,
      focalY: 52,
      fit: 'cover',
    },
    themeColor: ThemeColor.EMBER,
    packageName: PackageName.YOU_XI_PAI,
    // 正文文件：src/assets/md/you-xi-pai.md（合并文档）—— 本页只认领「出其不意」一节
    docs: [{ id: 'you-xi-pai', heading: '出其不意' }],
    // 空白布局：无装饰、无教学导览（不配 tourKey）、无持久化数据
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
  },
  {
    code: 'bing-sha',
    name: '冰杀',
    route: '/you-xi-pai/bing-sha',
    component: () => import('@/pages/you-xi-pai/BingSha/Index.vue'),
    image: {
      src: 'src/assets/images/menus/游戏牌-冰杀-.webp',
      focalX: 50,
      focalY: 46,
      fit: 'cover',
    },
    themeColor: ThemeColor.EMBER,
    packageName: PackageName.YOU_XI_PAI,
    // 正文文件：src/assets/md/you-xi-pai.md（合并文档）—— 本页只认领「冰杀」一节
    docs: [{ id: 'you-xi-pai', heading: '冰杀' }],
    // 空白布局：无装饰、无教学导览（不配 tourKey）、无持久化数据
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
  },
  {
    code: 'ci-sha',
    name: '刺杀',
    route: '/you-xi-pai/ci-sha',
    component: () => import('@/pages/you-xi-pai/CiSha/Index.vue'),
    image: {
      src: 'src/assets/images/menus/游戏牌-刺杀-.webp',
      focalX: 50,
      focalY: 49,
      fit: 'cover',
    },
    themeColor: ThemeColor.EMBER,
    packageName: PackageName.YOU_XI_PAI,
    // 正文文件：src/assets/md/you-xi-pai.md（合并文档）—— 本页只认领「刺杀」一节
    docs: [{ id: 'you-xi-pai', heading: '刺杀' }],
    // 空白布局：无装饰、无教学导览（不配 tourKey）、无持久化数据
    layout: MenuLayout.BLANK,
    orientation: 'vertical',
  },
];

export default menus;
