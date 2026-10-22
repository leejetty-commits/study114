import { defineConfig } from 'vite';
import { resolve } from 'node:path';

/** 283: verify-hide-inquiry-bundle 이 화면과 같은 @study-room-ui 별칭을 쓰게 한다. */
export default defineConfig({
  resolve: {
    alias: {
      '@search-ui': resolve(__dirname, '../search-ui/src'),
      '@home-ui': resolve(__dirname, './src'),
      '@home-enums': resolve(__dirname, './src/student-enums.js'),
      '@home-visibility': resolve(__dirname, './src/student-visibility.js'),
      '@study-room-ui': resolve(__dirname, '../study-room-ui/src'),
      '@tutor-ui': resolve(__dirname, '../tutor-ui/src'),
    },
  },
});
