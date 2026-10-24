# 298-1 검증 스크립트를 과외쌤 intro_long에 맞춤

**과제 ID:** 298-1  
**브랜치:** `cursor/298-1-verify-intro-long-20261025`  
**기준:** `origin/main` `5f889507` (Merge 298)  
**작업일:** 2026-10-25

## 배경

298에서 과외쌤 프라임 카드와 확대카드 소개가 `intro_long`을 보여 주게 바뀌었다. 픽 카드는 소개가 없다. 검증 스크립트 2개가 아직 `intro_short`와 옛 `tutor-detail.js`를 기대해서, 298 이전 main 대비 새 실패가 생겼다. 이번 작업은 그 기대만 패치대로 고친다.

## 바꾼 줄

- `scripts/verify-card-field-paths-20261009.mjs`: `SERVER_TUTOR`에 `intro_long: '과외긴소개'`를 `intro_short` 바로 뒤에 넣었다. `TUTOR_PRIME`·`TUTOR_DETAIL` 소개 기대를 `과외소개`에서 `과외긴소개`로 바꿨다.
- `scripts/verify-tutor-search-fields.mjs`: `TUTOR_DETAIL_REF`를 `7579012da235e34b696aa1bccfc9771ddc87eef1`에서 `ada09d4aef65a0e0b7e5a39acf8e288b523b80f5`로 바꿨다. 주석은 「298에서 확대카드 소개를 intro_long 전문으로 바꾼 tutor-detail.js. 다른 파일은 BASE_REF.」이다.

`ada09d4a`는 298 커밋 「298: 과외쌤 확대카드 소개를 intro_long 전문으로 보여 준다.」이다. 확대카드 파일 비교의 기준을 그 커밋에 둔다.

## 확인

어시스턴트가 `5f889507`에 이 패치를 얹고 vite-node로 확인한 수치다. card-field-paths는 41 PASS / 11 FAIL, tutor-search-fields는 11 PASS / 3 FAIL이다. 298 이전 main과 FAIL 목록이 같고 새 실패는 0이다. 남은 실패는 이번 범위 밖이다.

이 PC에서는 Node로 스크립트를 실행하지 않았다.

## 승인

| 커밋 | 승인자 | 일시 |
| --- | --- | --- |
| (이번 커밋) | 승인 대기 | |
