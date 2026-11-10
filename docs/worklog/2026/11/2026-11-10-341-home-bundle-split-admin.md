# 341 홈 SPA 첫 로딩 JS 분할 (관리자·드문 화면) — 2026-11-10

기준: `origin/main` `4ad674dc` · 브랜치 `work/341-home-bundle-split-admin` · worktree `.wt/work-341-home-bundle-split-admin`  
상태: **미커밋 대기**

## 변경
- `preview/home-ui/src/main.js` — admin/guide/concern/support/promo/policy/library/register-intro만 `import()`. `render()` 비동기 + 세대 번호. plans·역할홈·마이페이지·쪽지·공개마이샵 정적 유지. `#/admin`은 `isAdminRoute()`→`isAdminUser()` 거부/콘솔 분기 유지.
- `preview/home-ui/vite.config.js` — `build.cssCodeSplit: false` (JS만 분할, CSS 단일).
- `public/.htaccess` — FilesMatch를 Vite 해시 청크 `<name>-<hash>.(js|css)` 전체로 확대. `Cache-Control: public, max-age=31536000, immutable`.
- `scripts/check-cache-headers.mjs` — 패턴·CSS 파일명(`index|style`) 탐지 맞춤.

## 용량 (vite build, gzip level 9)

| 파일 | 변경 전 raw/gzip | 변경 후 raw/gzip |
|------|------------------|------------------|
| 첫 로딩 entry JS | 1616.12 / 444.76 KB | **1242.80 / 346.39 KB** (−373.3 / −98.4) |
| CSS | 630.92 / 98.77 (`index-*.css`) | 630.92 / 98.77 (`style-*.css`, 분할 없음) |
| admin 청크 | — | 208.68 / 56.62 |
| concern | — | 41.35 / 11.80 |
| guide | — | 30.72 / 8.92 |
| support | — | 30.06 / 9.12 |
| promo | — | 26.21 / 7.61 |
| policy (+copy 공유) | — | 4.31+17.41 / 1.68+5.51 |
| library (+info-board 공유) | — | 2.54+14.49 / 1.14+4.39 |
| register-intro | — | 0.65 / 0.37 |

산출물: `tmp/341-before/`, `tmp/341-after/` · 스크린샷 `tmp/341-shots/`

## 확인
- `#/guest` 첫 요청: `index-*.js` + `style-*.css`만. admin 청크 없음.
- `#/admin` 비관리자: 「운영자 전용」 거부 화면, admin 청크 로드.
- guide/community/support/promo/policy/library/register-intro/plans 화면 문구 확인.
- 해시 빠른 전환 후 최종 `#/community`만 유지.
- `node scripts/check-cache-headers.mjs` OK.
