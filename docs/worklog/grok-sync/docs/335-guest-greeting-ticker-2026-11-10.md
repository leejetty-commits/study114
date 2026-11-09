# 335 게스트 인사말 띠를 메인메뉴 아래로, 흐르는 글로 (2026-11-10 종현 동의)

## 현황
- 문구: 관리자 사이트 설정 「게스트 안내 배너」(guestBannerEnabled·guestBannerText, 최대 300자). 비로그인에게만 보임.
- 렌더: `preview/home-ui/src/site-ops-chrome.js` 101줄 `.ops-chrome__guest-banner`, 스타일 `home.css` 1359줄. 지금은 헤더 위(0~38px).

## 범위
- `preview/home-ui/src/site-ops-chrome.js` (게스트 배너 위치·마크업만)
- `preview/home-ui/src/styles/home.css` (`.ops-chrome__guest-banner` 규칙만)
- 헤더가 다른 앱에도 있으면 그 앱의 헤더 렌더 파일은 삽입 위치만 (파일명 보고)

## 필수
1. 게스트 배너를 헤더(메인메뉴 줄) 바로 아래로 이동. 다른 운영 배너(점검 등)는 현 위치 유지.
2. 오른쪽 → 왼쪽으로 흐름(CSS transform 애니메이션, 끊김 없는 반복). 속도는 초당 약 60px, 마우스 올리면·포커스 시 멈춤.
3. `prefers-reduced-motion: reduce`이면 흐르지 않고 가운데 고정.
4. 스크린리더용 원문 한 번만(복제 텍스트는 aria-hidden).

## 금지
관리자 화면·SiteSettingsService·저장 API·노출 조건(비로그인만) 변경 금지. `<marquee>` 금지. 다른 배너 수정 금지.

## 확인
비로그인 홈·찾기 1920·390 스크린샷, 흐름·멈춤·reduced-motion 확인. 관리자에서 문구 바꾸면 반영되는지(로컬). 로그인 시 안 보임. CSP 위반 0.

## 보고
변경 파일·diff 요약·스크린샷 경로. 커밋·push는 검수 후.
