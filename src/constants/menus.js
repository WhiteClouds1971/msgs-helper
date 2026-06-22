/**
 * 面杀辅助工具菜单 — 单一事实源
 *
 * 每个条目代表一个工具/武将卡片入口，定义其展示元数据。
 * 菜单顺序即为默认排序。
 */

import { TourKeys } from '@/constants/tourKeys'

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
    code: 'gao-dian-zhi-jiu',
    name: '高殿置酒 SP曹操',
    route: '/mobile/luo_tong',
    component: () => import('@/pages/mobile/LuoTong/Index.vue'),
    image: {
      src: 'src/assets/images/menus/高殿置酒-SP曹操-静态.webp',
      focalX: 50,
      focalY: 50,
      fit: 'cover',
    },
    themeColor: ThemeColor.CRIMSON,
    packageName: PackageName.OL,
    tourKey: TourKeys.HOME,
    orientation: 'vertical',
  },
];

export default menus;
