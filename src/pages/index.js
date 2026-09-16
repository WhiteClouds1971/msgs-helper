import { h } from 'vue'
import { TourKeys } from '@/constants/tourKeys'
import { usePageReady } from '@/composables/usePageReady'
import menus, { MenuLayout } from '@/constants/menus'

const PlaceholderPage = {
  setup() {
    usePageReady()
    return () => h('div')
  },
}

const menuRoutes = menus.map(menu => ({
  name: menu.code,
  path: menu.route,
  component: menu.component || PlaceholderPage,
  meta: {
    // 布局：菜单级声明，未声明则用背景布局
    layout: menu.layout || MenuLayout.BACKGROUND,
    code: menu.code,
    orientation: menu.orientation,
    // 菜单级教学导览 Key（可为空）— 控制台「教学导览」入口据此判断有无教程
    tourKey: menu.tourKey,
  },
}))

export default [
  {
    name: 'Home',
    path: '/',
    component: () => import('@/pages/home/Index.vue'),
    meta: { layout: 'BackgroundLayout', title: '面杀辅助工具', tourKey: TourKeys.HOME },
  },
  {
    name: 'NotFound',
    path: '/:pathMatch(.*)*',
    component: () => import('@/pages/404.vue'),
    meta: { layout: 'BlankLayout', title: '未寻得' },
  },
  ...menuRoutes,
  {
    // 隐藏页：将池胜率统计 —— 不注册进 menus.js（主页无卡片、全局搜索无结果），
    // 路径里的 6 位随机段即访问口令，防止无关人员直达；不带 meta.code，
    // App.vue 因此不会把它记进主页卡片堆的访问顺序
    name: 'JiangChiShengLv',
    path: '/p/z3r729',
    component: () => import('@/pages/jiang-chi/Index.vue'),
    meta: { layout: 'BlankLayout', title: '将池胜率' },
  },
  {
    name: 'Demo',
    path: '/demo',
    component: () => import('@/pages/demo/Index.vue'),
    meta: { layout: 'BlankLayout', title: 'Demo' },
  },
];
