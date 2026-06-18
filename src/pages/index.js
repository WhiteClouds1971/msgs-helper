export default [
  {
    name: 'Home',
    path: '/',
    component: () => import('@/pages/Home.vue'),
    meta: { title: '首页' },
  },
  {
    name: 'Demo',
    path: '/demo',
    component: () => import('@/pages/demo/Demo.vue'),
    meta: { title: '主题展示' },
  },
];
