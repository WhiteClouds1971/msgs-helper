import '@/assets/css/design-tokens.css';
import { createApp } from 'vue';
import App from './App.vue';
import router from '@/router/index.js';
import pinia from '@/stores/index.js';

import './style.css';

createApp(App).use(router).use(pinia).mount('#app');

// iOS Safari 禁用缩放 & 下拉回弹（meta/CSS 均无效，必须 JS）
document.addEventListener('touchmove', (e) => { e.preventDefault() }, { passive: false })
