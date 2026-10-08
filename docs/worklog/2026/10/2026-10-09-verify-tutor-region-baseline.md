# 2026-10-09 과외지역 단위 검증 스크립트 비교 기준 고정 (verify-tutor-region-baseline)

## 지시 원문

- 02:19 「8.정리를 하고 넘어가자. 무슨 내용인지 소상하게 브리핑해라.」

## 원인

- `scripts/verify-tutor-region-unit.mjs` 는 "공부방 쪽 결과가 과외지역 단위 변경 전과 같다"를 `git show origin/main:<파일>` 로 비교했다.
- 과외지역 단위가 main(`b5ffeb5`)에 들어간 뒤로 `origin/main` 이 변경 후 코드가 되었다. `student-blind-teaser.js` 의 `coarseRegionForGuest(locationLabel)` 가 `(locationLabel, kind)` 로 바뀌어 옛 함수 추출 정규식이 실패 → 「main 읽기 실패」 6건 + 4부 하위 실행 종료 코드 1건 = 7건 실패.

## 변경

- 비교 기준을 변경 직전 main `6b37357` 로 고정(`BASE_REF`). `git show` 6곳과 검사 이름의 「origin/main」 표기를 「변경 전 main」 으로.
- 검사 내용·대상은 그대로.

## 검수

- 수정 전 127 통과 / 7 실패 → 수정 후 134 통과 / 0 실패 (`node scripts/verify-tutor-region-unit.mjs`).
- 검증 스크립트 1개, 운영 코드 영향 없음 → 메인 검수.
- 사용자 승인: 대기.

## 사용자 승인·main 반영

- 2026-10-09 02:48 사용자 「승인」 — 커밋 `c97b21a`.
- 병합본 검증: verify:tutor-region-unit 134/0, verify-position-region-tier 19/0, verify:no-sample-data OK, verify:shop-page OK.
