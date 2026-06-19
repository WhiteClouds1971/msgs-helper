import '@/assets/css/design-tokens.css';
import { createApp } from 'vue';
import App from './App.vue';
import router from '@/router/index.js';
import pinia from '@/stores/index.js';
import { checkVersion } from '@/composables/useVersionCheck';

import './style.css';

// 首屏加载前校验版本：版本不一致时清空 localStorage，确保 stores 读到干净数据
checkVersion();

createApp(App).use(router).use(pinia).mount('#app');

// iOS Safari 禁用缩放 & 下拉回弹（meta/CSS 均无效，必须 JS）
document.addEventListener('touchmove', (e) => { e.preventDefault() }, { passive: false })
