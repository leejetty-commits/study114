import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { resolveViteBase } from '../shared/vite-base.mjs';

export default defineConfig({
  base: resolveViteBase('/'),
  root: '.',
  build: {
    // 341: 관리자·드문 화면 JS만 나눈다. CSS는 엔트리 하나로 유지.
    cssCodeSplit: false,
  },
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
  server: {
    fs: {
      allow: [resolve(__dirname), resolve(__dirname, '..')],
    },
    port: 5174,
    strictPort: true,
    host: '127.0.0.1',
    open: false,
    // 339: 로컬 Vite에만 포트원·토스 테스트 도메인 (운영 CSP/CF는 변경 없음)
    headers: {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.portone.io https://*.portone.io https://*.tosspayments.com",
        "frame-src 'self' https://*.portone.io https://*.tosspayments.com https://cdn.portone.io",
        "connect-src 'self' http://127.0.0.1:8080 http://localhost:8080 https://cdn.portone.io https://*.portone.io https://api.portone.io https://checkout-service.prod.iamport.co https://*.tosspayments.com",
        "img-src 'self' data: blob: https:",
        "style-src 'self' 'unsafe-inline'",
        "font-src 'self' data:",
      ].join('; '),
    },
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
    headers: {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.portone.io https://*.portone.io https://*.tosspayments.com",
        "frame-src 'self' https://*.portone.io https://*.tosspayments.com https://cdn.portone.io",
        "connect-src 'self' http://127.0.0.1:8080 http://localhost:8080 https://cdn.portone.io https://*.portone.io https://api.portone.io https://checkout-service.prod.iamport.co https://*.tosspayments.com",
        "img-src 'self' data: blob: https:",
        "style-src 'self' 'unsafe-inline'",
        "font-src 'self' data:",
      ].join('; '),
    },
  },
});
