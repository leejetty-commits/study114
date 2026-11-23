# 17k 사이트 하단 민원 문구 추가 (KG이니시스 심사 요청)

## 대상
- `src/Site/SiteFooterCopy.php`
- `src/Views/partials/site-footer-legal.php`
- `preview/shared/site-footer.js`
- `public/info/index.html`, `public/info/franchise/index.html`, `public/info/edu-office/index.html`, `public/info/parents/index.html`, `public/info/tutor/index.html`, `public/info/study-room/index.html`

## 넣을 문구 (한 글자도 바꾸지 말 것)
해당 사이트에서 판매되는 모든 상품에 환불 및 모든 민원의 책임은 제이에이치커머스에 있습니다. 민원담당자: 이종현 연락처: 070-4001-1422

## 필수 작업
1. 상수 추가
   - PHP: `SiteFooterCopy::COMPLAINT` = 위 문구
   - JS: `export const SITE_FOOTER_COMPLAINT` = 위 문구 (PHP와 같은 값)
2. 위치: 기존 통신판매중개자 문구(`NOTICE`) 바로 아래에 `<p>` 한 줄을 추가한다. 클래스는 기존 notice 클래스를 그대로 쓴다.
   - `site-footer.js`: `<p class="site-footer__notice home-footer__notice">${SITE_FOOTER_COMPLAINT}</p>`
   - `site-footer-legal.php`: `<p class="auth-shell__footer-notice"><?= study114_e(SiteFooterCopy::COMPLAINT) ?></p>`
   - `public/info/*` 6개: `<p class="info-foot__notice">…</p>` (정적 HTML이라 문구 직접 기재)
3. 운영에 올린 뒤 홈(PC·모바일 폭), /info/, 로그인 화면 하단에서 문구가 한 번씩만 보이는지 확인한다.

## 금지사항
- 위 대상 파일 외 수정 금지. CSS 파일 수정 금지(새 클래스 만들지 말 것).
- 기존 NOTICE·COPYRIGHT·회사정보(간이과세자 포함)·링크 문구 변경 금지.
- `preview/*/index.html`의 숨김 사업자 블록(site-biz-static) 수정 금지.
- 다른 기능·레이아웃 손대지 말 것. 서버 설정·DB 변경 금지.

## 완료 보고
- 변경 파일 목록, PR 링크, 운영 배포 결과, 하단 캡처 3장(홈 PC·홈 모바일·/info/)만 짧게.
