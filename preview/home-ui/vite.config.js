import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  resolve: {
    alias: {
      '@search-ui': resolve(__dirname, '../search-ui/src'),
      '@home-ui': resolve(__dirname, './src'),
      '@home-enums': resolve(__dirname, './src/student-enums.js'),
      '@home-visibility': resolve(__dirname, './src/student-visibility.js'),
    },
  },
  server: {
    port: 5174,
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
    port: 4174,
    host: '127.0.0.1',
  },
});
