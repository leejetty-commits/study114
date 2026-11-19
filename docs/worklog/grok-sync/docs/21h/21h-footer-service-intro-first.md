# 21h — 푸터 메뉴에서 「서비스 소개」를 맨 앞으로

## 목표
푸터 링크 순서를 아래처럼 바꾼다. 순서만 바꾸고 문구·주소·스타일·구분점은 그대로 둔다.
서비스 소개 · 이용약관 · 개인정보 처리방침 · 플랫폼 고지 · 유료상품 · 환불정책 · 고객센터

## 0단계 (먼저 진단만 하고 보고)
아래 허용 파일에서 푸터 링크 목록 위치를 찾아 현재 순서를 보고한다. 다른 곳에도 같은 푸터 링크 목록이 있으면 고치지 말고 멈추고 보고한다.

## 허용 파일 (이것만 수정)
1. preview/shared/site-footer.js — SITE_FOOTER_LINKS 배열에서 `{ href: '/info/', label: '서비스 소개' }` 항목을 맨 앞으로.
2. src/Site/SiteFooterCopy.php — policyLinks() 배열에서 서비스 소개 항목을 맨 앞으로.
3. public/info/index.html, public/info/study-room/index.html, public/info/tutor/index.html, public/info/parents/index.html, public/info/edu-office/index.html, public/info/franchise/index.html — 하단 `<nav class="info-foot__links">` 안에서 서비스 소개 `<a>`를 맨 앞으로. 맨 끝 고객센터 뒤에는 구분점이 없게, 나머지는 기존처럼 `·` 구분점.
   (페이지 상단 내비의 서비스 소개는 건드리지 않는다.)
4. preview/home-ui/src/library/info-embed.js — 109행 근처 안내 본문 맨 아래 링크 한 줄만 수정: 문구 「새 창에서 보기」→「새 탭에서 보기」, `<a>`에 `target="_blank" rel="noopener noreferrer"` 추가(지금은 같은 탭으로 이동함). 이 파일의 다른 줄은 건드리지 않는다.
5. 작업기록 docs/worklog/2026/11/2026-11-20-21h-footer-service-intro-first.md

## 하지 말 것
- 순서 외 변경 금지. 링크 추가·삭제·문구 수정 금지. CSS 수정 금지.
- 홈 로딩 속도에 영향 주는 변경 금지(배열 순서만 바뀜).

## 수락 기준
- 쏙쏙정보 안내 탭 2개 맨 아래 링크가 「새 탭에서 보기」이고 누르면 새 탭으로 열림.
- 운영 홈, /info/ 6개 페이지, 로그인 화면(PHP 푸터) 모두 서비스 소개가 첫 번째.
- 구분점이 앞뒤로 남거나 두 번 찍히지 않음.
- 변경 파일 목록이 허용 파일과 정확히 일치.
- 375 폭 스크린샷 2장(홈 푸터, /info/ 푸터) 첨부, PR·머지·배포 후 보고.
