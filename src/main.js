import '@/assets/css/design-tokens.css';
import { createApp } from 'vue';
import App from './App.vue';
import router from '@/router/index.js';
import pinia from '@/stores/index.js';

import './style.css';

createApp(App).use(router).use(pinia).mount('#app');
