import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    port: 5174,
    strictPort: true,
    // Windows 외부 브라우저: 127.0.0.1 고정 (localhost/IPv6 혼선 방지)
    host: '127.0.0.1',
    // hash는 main.js가 설정 — open에 # 넣으면 일부 브라우저가 경로를 깨뜨림
    open: '/',
  },
  preview: {
    port: 4174,
    host: '127.0.0.1',
  },
});
