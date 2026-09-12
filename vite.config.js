/// <reference types="vitest" />
import path from 'path';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(() => {
  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '~': path.resolve(__dirname, './'),
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        onwarn(warning, warn) {
          // @vueuse/core 的 dist 里 /* #__PURE__ */ 注解位置不合法（reka-ui 的传递依赖，
          // 非本项目代码）。Rollup 已丢弃该注解、产物无影响，静音以免淹没真实警告。
          const source = `${warning.id ?? ''}${warning.message ?? ''}`;
          if (
            warning.code === 'INVALID_ANNOTATION' &&
            source.includes('@vueuse')
          ) {
            return;
          }
          warn(warning);
        },
      },
    },
    server: {
      port: 9456,
      host: '0.0.0.0',
    },
    test: {
      environment: 'happy-dom',
      globals: true,
      css: true,
    },
  };
});
