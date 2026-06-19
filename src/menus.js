/**
 * 面杀辅助工具菜单 — 单一事实源
 *
 * 每个条目代表一个工具/武将卡片入口，定义其展示元数据。
 * 菜单顺序即为默认排序。
 */

/** 签题分类枚举 */
export const PackageName = Object.freeze({
  TOOL: '工具',
  OL: 'OL',
  ANNIVERSARY: '十周年',
  MOBILE: 'Mobile',
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
    name: '芳辰逸趣',
    route: '/tool/fang-chen-yi-qu',
    image: {
      src: 'src/assets/images/menus/芳辰逸趣-董翓-静态.webp',
      focalX: 50,
      focalY: 50,
      fit: 'cover',
    },
    themeColor: ThemeColor.ROSE,
    packageName: PackageName.OL,
    orientation: 'vertical',
  },
  {
    name: '高殿置酒',
    route: '/tool/gao-dian-zhi-jiu',
    image: {
      src: 'src/assets/images/menus/高殿置酒-SP曹操-静态.webp',
      focalX: 50,
      focalY: 50,
      fit: 'cover',
    },
    themeColor: ThemeColor.CRIMSON,
    packageName: PackageName.OL,
    orientation: 'vertical',
  },
  {
    name: '锦织翠鸾',
    route: '/tool/jin-zhi-cui-luan',
    image: {
      src: 'src/assets/images/menus/锦织翠鸾-薛灵芸-静态.webp',
      focalX: 25,
      focalY: 50,
      fit: 'cover',
    },
    themeColor: ThemeColor.STEEL_BLUE,
    packageName: PackageName.OL,
    orientation: 'vertical',
  },
  {
    name: '黎歌跃竹',
    route: '/tool/li-ge-yue-zhu',
    image: {
      src: 'src/assets/images/menus/黎歌跃竹-族陆郁生-静态.webp',
      focalX: 50,
      focalY: 50,
      fit: 'cover',
    },
    themeColor: ThemeColor.FOREST,
    packageName: PackageName.OL,
    orientation: 'vertical',
  },
  {
    name: '倩影婀娜',
    route: '/tool/qian-ying-e-nuo',
    image: {
      src: 'src/assets/images/menus/倩影婀娜-胡金定-静态.webp',
      focalX: 50,
      focalY: 20,
      fit: 'cover',
    },
    themeColor: ThemeColor.ORCHID,
    packageName: PackageName.OL,
    orientation: 'vertical',
  },
  {
    name: '玉琢成器',
    route: '/tool/yu-zhuo-cheng-qi',
    image: {
      src: 'src/assets/images/menus/玉琢成器-孔淑-静态.webp',
      focalX: 50,
      focalY: 50,
      fit: 'cover',
    },
    themeColor: ThemeColor.JADE,
    packageName: PackageName.OL,
    orientation: 'vertical',
  },
  {
    name: '炙龙烈胆',
    route: '/tool/zhi-long-lie-dan',
    image: {
      src: 'src/assets/images/menus/炙龙烈胆-SP赵云-静态.webp',
      focalX: 50,
      focalY: 50,
      fit: 'cover',
    },
    themeColor: ThemeColor.EMBER,
    packageName: PackageName.OL,
    orientation: 'horizontal',
  },
];

export default menus;
