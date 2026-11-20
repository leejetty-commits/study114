# 21h 푸터에서 서비스 소개를 맨 앞으로

- 기준: `origin/main` `ab17e646` (PR #281)
- 2026-11-20. 푸터 링크 순서만 바꾼다.

## 0단계 진단

같은 푸터 목록(이용약관 · 개인정보 처리방침 · 플랫폼 고지 · 유료상품 · 환불정책 · 서비스 소개 · 고객센터)은 아래 세 곳에만 있다.

- `preview/shared/site-footer.js` `SITE_FOOTER_LINKS`. 홈·찾기·공부방·과외·로그인 SPA가 이 배열을 그린다. 구분점은 마지막 항목 앞에만 안 붙는다.
- `src/Site/SiteFooterCopy.php` `policyLinks()`. PHP 로그인 레이아웃 `src/Views/layouts/auth.php`가 이 배열을 그리고, 구분점은 첫 항목 뒤에만 안 붙는다.
- `public/info/` 6개 페이지의 `<nav class="info-foot__links">`. 상단 내비의 서비스 소개는 별도다.

현재 순서는 여섯 곳 모두 이용약관이 첫 번째이고 서비스 소개가 고객센터 바로 앞이다. 다른 복제는 없어서 허용 파일 안에서 끝낸다.

## 확인

- 375에서 홈 푸터와 `/info/` 푸터 첫 링크가 서비스 소개다. 구분점은 항목 사이에만 있고 맨 끝 고객센터 뒤에는 없다. 가로 넘침 0.
- `/info/` 상단 내비는 서비스 소개 · 공부방 · 과외쌤 · 학생·학부모 그대로다.
- 안내 탭 맨 아래 링크는 「새 탭에서 보기」이고 `target="_blank" rel="noopener noreferrer"`다.

머지 커밋과 Deploy run 번호는 머지 뒤에 생긴다.
