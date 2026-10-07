# 186 · Cursor — 과외쌤 기본정보 과외지역 저장·대표·홈 반영 (로컬)

- 작성: 2026-09-29 · 우동공과2
- 근거: 종현 스샷 `#/mypage/registrations/tutors/*/basic` + 홈 1.1
- push · build:dothome · Notion **금지**
- **185(홈 no-route)와 분리.** 183 mypage 홈 제거와도 분리.

## 원인 메모 (구현 전 확인)

- 「과외지역 목록을 불러오지 못했습니다」 → cities 로드 실패 시 units=[] → region_id/label 공란 → 저장 시  
  `과외지역(시·도)을 선택해 주세요.` 오탐.
- 홈 필은 `MOCK_TUTOR_REGIONS` 고정이라 저장해도 홈·「현재위치」 미반영.

## Must

1. cities 목록 로드 실패 해소(또는 명확 재시도 성공). **로드 실패 상태로 선택만 하고 저장되는 일 금지.**
2. 대표지역(예: 서울특별시) 정상 선택 후 「기본정보 저장」 시  
   **`과외지역(시·도)을 선택해 주세요.` 오탐 없음** + **실제 저장**.
3. 저장 성공 시 사용자가 아는 **save-feedback** (toast/인페이지 이벤트 + dirty 클리어). alert만 의존 지양.
4. **지역1 = 필수 = 대표.** 지역2·지역3 **「대표」 라디오 제거** (가입 `showPrimary: false`와 정렬).
5. 저장 후 과외쌤 홈 활동지역 필 3칸 + 중하단 **「현재위치 …」**가 `saved_regions`/대표와 **일치** (홈 MOCK 3도시 고정 해제·hydrate).
6. (방향 노트·가능하면) 이미 입력된 값=회색 바탕, 빈칸=흰색, 회색 포커스→흰색, 값 변경 시 저장 유도. 현 저장 UX 교체.

## Allowlist

- `preview/home-ui/src/tutor-reg/screens.js`
- `preview/home-ui/src/tutor-reg/inline-save.js`
- `preview/home-ui/src/tutor-reg/city-units.js`
- `preview/shared/tutor-region-slots.js`
- 홈 반영 최소: `preview/home-ui/src/screens/tutor.js` 및 MOCK 대체 hydrate에 필요한 **최소** 파일  
  (`search-schema.js` MOCK 직접 변조는 최후)
- 서버는 재현 후 최소: `GET /api/auth/regions.php` · `POST /api/tutor/register.php` 관련만

## Forbid

- units 없이 정적 라벨만으로 region_id 없는 채 저장 통과
- 지역2/3 대표 라디오 유지
- 저장 실패를 성공처럼 보이기
- MOCK 3도시를 “내 등록 지역”인 척 두고 sync 완료 선언
- 185 가이드 문구 책임 침범 · 183 병합 · commit/push/build:dothome

## 스모크

1. 기본정보: 과외지역 목록 로드됨 · 서울특별시 대표 저장 성공 · 「저장되었습니다」급 피드백
2. 지역2·3에 「대표」 라디오 없음 · 지역1만 대표
3. 저장 후 `#/tutor` 홈: 활동지역 칩·「현재위치」가 방금 저장과 일치
4. 목록 로드 실패 시 저장으로 오탐 alert만 뜨지 않고, 실패 상태가 분명함

## 커밋 예 (수락 후)

`fix(tutor-reg): restore city units save; primary only on slot1; sync home regions`
로컬만.
