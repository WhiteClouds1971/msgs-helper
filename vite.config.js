/// <reference types="vitest" />
import path from 'path';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import imagemin from 'vite-plugin-imagemin';

export default defineConfig(() => {
  return {
    plugins: [
      vue(),
      imagemin({
        gifsicle: { optimizationLevel: 3 },
        mozjpeg: { quality: 80 },
        pngquant: { quality: [0.5, 0.75], speed: 1 },
      }),
    ],
    resolve: {
      alias: {
        '~': path.resolve(__dirname, './'),
        '@': path.resolve(__dirname, './src'),
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
