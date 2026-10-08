# 2026-10-09 프라임·픽 칸은 유료만 (prime-paid-only)

## 지시 원문

- 02:35 「10. 동의.」 (메인 권고: 견본용 프라임 채움 규칙 `demo_prime_filled`·`demo_prime_tutor_pool` 삭제, 프라임 칸은 유료 업체만)

## 원인

- `preview/home-ui/src/exposure-rules.js` 는 "실데이터 표시(`_realDb`)가 없는 카드 묶음"을 견본으로 보고, 유료가 없으면 프라임 칸을 앞 카드로 채웠다(공부방 1개, 과외쌤 최대 12명). 픽도 같은 방식으로 나머지 전부를 후보로 썼다.
- 홈 데이터에는 `_realDb` 가 붙지만 검색 화면(search-ui `search-exposure-mapper.js`) 데이터에는 없다 → 로그인 검색 화면에서만 무료 카드가 프라임·픽 칸에 들어갔다. 손님은 런타임 덮어쓰기로 0. 견본 카드는 이미 모두 제거됨.

## 변경

- `exposure-rules.js`: `getPrimeOccupied`·`getPrimeCandidatePool`·`getPickPool` 은 `position_sku`(유료) 만. 견본 채움 분기와 `isRealDbPool`, 설정 반환의 `demoPrimeTutorPool` 삭제.
- `plans/runtime-config.js`: `demo_prime_filled`·`demo_prime_tutor_pool` 기본값과 손님 덮어쓰기 삭제.
- `scripts/verify-position-region-tier.mjs`: 「데모 과외쌤 풀은 exposure_tier 유지」 → 「유료 없으면 공부방 프라임·과외쌤 프라임·픽 비움(실데이터 표시 없어도)」 3건.

## 검수

- `verify-position-region-tier`(preview/home-ui 에서 vite-node): client 7/0, server 19/0.
- `verify:no-sample-data` OK, `verify:shop-page` 54/0.
- 홈은 원래 유료만이라 동작 같음. 바뀌는 곳은 로그인 검색 화면의 프라임·픽 칸(유료 없으면 빈칸).
- 사용자 승인: 대기.
