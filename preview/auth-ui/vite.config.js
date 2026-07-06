import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    port: 5173,
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
    port: 4173,
    host: '127.0.0.1',
  },
});
