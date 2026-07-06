import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  publicDir: resolve(__dirname, '../auth-ui/public'),
  resolve: {
    alias: {
      '@auth-styles': resolve(__dirname, '../auth-ui/src/styles'),
      '@home-enums': resolve(__dirname, '../home-ui/src/student-enums.js'),
      '@home-visibility': resolve(__dirname, '../home-ui/src/student-visibility.js'),
      '@home-ui': resolve(__dirname, '../home-ui/src'),
    },
  },
  server: {
    port: 5176,
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
    port: 4176,
    host: '127.0.0.1',
  },
});
