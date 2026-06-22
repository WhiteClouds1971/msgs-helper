import { h } from 'vue'
import { TourKeys } from '@/constants/tourKeys'
import { usePageReady } from '@/composables/usePageReady'
import menus from '@/constants/menus'

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
    layout: 'BackgroundLayout',
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
    name: 'Demo',
    path: '/demo',
    component: () => import('@/pages/demo/Index.vue'),
    meta: { layout: 'BlankLayout', title: 'Demo' },
  },
];
