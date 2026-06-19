export default [
  {
    name: 'Home',
    path: '/',
    component: () => import('@/pages/home/Index.vue'),
    meta: { title: '面杀辅助工具' },
  },
  {
    name: 'NotFound',
    path: '/:pathMatch(.*)*',
    component: () => import('@/pages/404.vue'),
    meta: { title: '未寻得' },
  },
  {
    name: 'Demo',
    path: '/demo',
    children: [],
  },
];
