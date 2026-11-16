# 2026-11-17 오픈 전 정리

## 지시

1. `#/plans` 하단 「결제 테스트 모드」와 결제수단 「카드(테스트)」는 `STUDY114_TEST_ACCOUNT_EMAILS` 계정에만 보인다. 결제 로직은 그대로.
2. 배포 루트에 `robots.txt`, `sitemap.xml`, `favicon.ico`를 두어 홈 HTML 폴백이 안 나오게 한다.
3. 엔트리 `index.html` 5곳에 og:title·og:description·og:image·og:url·canonical.
4. `.htaccess`에 `Referrer-Policy: strict-origin-when-cross-origin`.

## 수정

- `public/api/auth/me.php` — `test_account` 불리언만. 이메일 목록은 내려주지 않는다.
- `preview/home-ui/src/auth-session.js` — 그 판정을 세션에 둔다.
- `preview/home-ui/src/plans/screens.js` — 체크박스는 허용목록일 때만.
- `preview/home-ui/src/plans/screens-orders.js` — `portone_test` 결제수단 칸은 허용목록일 때만.
- `preview/home-ui/src/plans/history-mock.js` — 그 외에는 「카드(테스트)」 대신 「카드」.
- `public/robots.txt`, `public/sitemap.xml`, `public/favicon.ico`, `public/assets/brand/og-cover-2026.png`
- `public/.htaccess` — Referrer-Policy
- 엔트리 5개 `index.html`
- `preview/search-ui/src/main.js` — `/search/room|tutor|student`는 해시 없이도 해당 찾기로 연다.

## 확인

로컬 `public/` 정적 응답:

- `/robots.txt` 200 `text/plain`, `Allow: /`, `Sitemap: https://study114.net/sitemap.xml`. HTML 아님.
- `/sitemap.xml` 200 `application/xml`. 홈·공부방찾기·과외쌤찾기·학생찾기·`/auth/`·등록 2곳. `#` 없음.
- `/favicon.ico` 200 `image/x-icon`, 앞 바이트 `00 00 01 00`. HTML 아님.
- 엔트리 5개에 og:title·og:description·og:image·og:url·canonical 있음. og:image는 1200×630.

운영은 아직 이 배포 전이다. `/sitemap.xml`·`/favicon.ico`는 홈 HTML이고, `/robots.txt`는 Cloudflare 관리 문구 뒤에 홈 HTML이 붙어 있다.

## 하지 않은 것

머지·배포는 하지 않았다. 결제 금액·PG 호출은 바꾸지 않았다.
