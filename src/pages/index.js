export default [
  {
    name: 'Home',
    path: '/',
    component: () => import('@/pages/HomePage.vue'),
    meta: { title: '面杀辅助工具' },
  },
  {
    name: 'Tool',
    path: '/tool/:name',
    component: () => import('@/pages/ToolShell.vue'),
    meta: { title: '工具' },
  },
  {
    name: 'Demo',
    path: '/demo',
    component: () => import('@/pages/demo/Demo.vue'),
    meta: { title: '主题展示' },
  },
  {
    name: 'Icon',
    path: '/icon',
    component: () => import('@/pages/IconPreview.vue'),
    meta: { title: '图标预览' },
  },
  {
    name: 'NotFound',
    path: '/:pathMatch(.*)*',
    component: () => import('@/pages/NotFound.vue'),
    meta: { title: '未寻得' },
  },
];
