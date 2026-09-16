/// <reference types="vitest" />
import path from 'path';

import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ mode }) => {
  // .env* 里的变量一律 APP_ 前缀，故改掉 Vite 默认的 VITE_，否则 import.meta.env 里读不到
  const env = loadEnv(mode, __dirname, 'APP_');

  return {
    plugins: [vue()],
    envPrefix: 'APP_',
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
      proxy: env.APP_PROXY_TARGET
        ? {
            // dev 联调：浏览器只发同源的 /api，由 dev server 转给后端（target 见 .env.dev）
            // 生产由 nginx 做同样的转发，两边请求 URL 完全一致，前端代码不用分环境
            [env.APP_BASE_API || '/api']: {
              target: env.APP_PROXY_TARGET,
              changeOrigin: true,
            },
          }
        : undefined,
    },
    test: {
      environment: 'happy-dom',
      globals: true,
      css: true,
    },
  };
});
