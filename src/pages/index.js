import { TourKeys } from '@/constants/tourKeys'
import menus from '@/constants/menus'

const menuRoutes = menus.map(menu => ({
  name: menu.code,
  path: menu.route,
  component: menu.component,
  meta: {
    layout: 'background',
    code: menu.code,
    orientation: menu.orientation,
    isMenuRoute: true,
  },
}))

export default [
  {
    name: 'Home',
    path: '/',
    component: () => import('@/pages/home/Index.vue'),
    meta: { title: '面杀辅助工具', tourKey: TourKeys.HOME },
  },
  {
    name: 'NotFound',
    path: '/:pathMatch(.*)*',
    component: () => import('@/pages/404.vue'),
    meta: { title: '未寻得' },
  },
  ...menuRoutes,
  {
    name: 'Demo',
    path: '/demo',
    component: () => import('@/pages/demo/Index.vue'),
    meta: { title: 'Demo' },
  },
];
