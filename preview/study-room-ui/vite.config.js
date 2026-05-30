import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  publicDir: resolve(__dirname, '../auth-ui/public'),
  resolve: {
    alias: {
      '@auth-styles': resolve(__dirname, '../auth-ui/src/styles'),
    },
  },
  server: {
    port: 5175,
    open: true,
  },
  preview: {
    port: 4175,
  },
});
