import '@/assets/css/design-tokens.css';
import { createApp } from 'vue';
import App from './App.vue';
import router from '@/router/index.js';
import pinia from '@/stores/index.js';
import { checkVersion } from '@/composables/useVersionCheck';
import { preventBrowserDefaults } from '@/composables/preventBrowserDefaults';

import './style.css';

// 首屏加载前校验版本：版本不一致时清空 localStorage，确保 stores 读到干净数据
checkVersion();

// 禁用浏览器内置默认行为（缩放、回弹、长按菜单、文本选择）
preventBrowserDefaults();

createApp(App).use(router).use(pinia).mount('#app');
