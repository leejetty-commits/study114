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
    // 365: 로컬 Vite에만 포트원·KG이니시스 본인인증 도메인 (운영 CSP/CF는 호스트 목록만 보고)
    headers: {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.portone.io https://*.portone.io https://sa.inicis.com https://*.inicis.com",
        "frame-src 'self' https://checkout-service.prod.iamport.co https://*.portone.io https://cdn.portone.io https://sa.inicis.com https://*.inicis.com",
        "connect-src 'self' http://127.0.0.1:8080 http://localhost:8080 https://cdn.portone.io https://*.portone.io https://api.portone.io https://checkout-service.prod.iamport.co https://sa.inicis.com https://*.inicis.com",
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
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.portone.io https://*.portone.io https://sa.inicis.com https://*.inicis.com",
        "frame-src 'self' https://checkout-service.prod.iamport.co https://*.portone.io https://cdn.portone.io https://sa.inicis.com https://*.inicis.com",
        "connect-src 'self' http://127.0.0.1:8080 http://localhost:8080 https://cdn.portone.io https://*.portone.io https://api.portone.io https://checkout-service.prod.iamport.co https://sa.inicis.com https://*.inicis.com",
        "img-src 'self' data: blob: https:",
        "style-src 'self' 'unsafe-inline'",
        "font-src 'self' data:",
      ].join('; '),
    },
  },
});
