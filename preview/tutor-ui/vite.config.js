import { defineConfig } from 'vite';
import { resolve } from 'path';
import { resolveViteBase } from '../shared/vite-base.mjs';

export default defineConfig({
  base: resolveViteBase('/'),
  root: '.',
  publicDir: resolve(__dirname, '../auth-ui/public'),
  resolve: {
    alias: {
      '@auth-styles': resolve(__dirname, '../auth-ui/src/styles'),
    },
  },
  server: {
    port: 5177,
    strictPort: true,
    host: '127.0.0.1',
    open: false,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4177,
    host: '127.0.0.1',
  },
});
