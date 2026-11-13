# 희망지역 추가 — 2026-11-12

지시: `docs/worklog/grok-sync/docs/hope-region-extra-2026-11-12.md`  
브랜치: `work/hope-region-extra`  
머지하지 않음. 운영 DB에 SQL을 적용하지 않음.

## 한 일

- 상세정보 「희망지역 추가」 자유 입력을 없애고, 저장된 희망 유형의 본 희망지역 위젯을 그대로 쓴다. 과외는 `renderTutorUnitCascade`, 공부방은 `renderStudentHopeRegion`.
- 유형 선택은 기본정보에 있다. 상세 화면은 저장된 `preferred_lesson_type` 으로 위젯을 그린다. 기본정보에서 유형을 저장한 뒤 상세를 열면 그 유형의 칸이 나온다. 다른 유형으로 저장해 둔 추가 값은 그 화면에 채우지 않는다.
- 추가 지역은 1개이고 비워도 저장된다. 기본정보 완료 판정에는 넣지 않았다.
- 새 칸: `preferred_tutor_region_extra_id`, `preferred_studyroom_region_extra_id`, `preferred_studyroom_complex_extra_id`, `preferred_studyroom_region_extra_basis`. SQL 087. 086은 미머지 339(`086_pg_cancel_ops_log.sql`), 088은 미머지 365가 쓰고 있어 087을 썼다.
- `preferred_region_note` 컬럼과 저장 경로는 남겨 두었다. 화면 입력·읽기에서만 뺐고, 메모를 추가 지역으로 옮기지 않는다.
- 학생 찾기·게스트 지역 수는 본 지역 또는 같은 유형의 추가 지역이다. 유형이 다른 추가 값은 조건에 넣지 않는다. 카드에 보이는 지역 JOIN은 본 지역 그대로다.

## 셀프검수

| # | 항목 | 결과 | 근거 |
|---|---|---|---|
| 1 | 과외이면 추가 칸이 시·도·시·군, 본 희망지역과 같은 위젯 | PASS | `renderTutorUnitCascade`, hidden `preferred_tutor_region_extra_id`. 캡처 없음 |
| 2 | 공부방이면 추가 칸이 주소검색, 본 희망지역과 같은 위젯 | PASS | `renderStudentHopeRegion(extraHopeRegionValues)`. 캡처 없음 |
| 3 | 추가 1개, 비워도 저장됨, 기본정보 완료와 무관 | PASS | 빈 id 허용. `StudentBasicCompleteness` 에 extra 없음 |
| 4 | 찾기·매칭이 본 지역과 추가 지역을 OR로 사용 | PASS | `SearchService::studentHopeOr`. `verify-hope-region-extra.mjs` |
| 5 | 새 구조 컬럼 추가, `preferred_region_note` 미삭제·미이전 | PASS | `sql/schema/087_student_hope_region_extra.sql` 과 롤백 |
| 6 | 화면에서 옛 메모 입력·표시 없음, 라벨은 「희망지역 추가」 | PASS | 상세 입력·읽기. 캡처 없음 |
| 7 | 운영 SQL 미적용, 본 희망지역·과외쌤·공부방 지역 UI 의도치 않은 변경 없음 | PASS | 운영 DB 미실행. 본 칸 hidden 이름은 `preferred_tutor_region_id` |
| 8 | 관련 verify PASS, 공통 금지 위반 없음 | PASS | 아래. 범위 밖 실패는 발견 목록 |

## 검증

- `node scripts/verify-hope-region-extra.mjs` → OK (21)
- `D:\php8.2\php.exe scripts/verify-student-search-fields.php` → 10 PASS / 0 FAIL
- `npx vite-node scripts/verify-tutor-home-student-tab.mjs` (preview/home-ui) → 서버 OR 단언 PASS, 실행 41 PASS. 정적 3 FAIL은 발견
- `npx vite-node scripts/verify-hold-find-address.mjs` → 학생 구 SQL에 추가 동 OR 포함 PASS. 안내 문구 1 FAIL은 발견
- `verify-student-mypage-hope-region.mjs` → 74 PASS / 1 FAIL (발견)
- `verify-student-branch-two-tabs.mjs` → 서버 지역 정리 PASS. 화면 가드는 발견에서 중단
- `verify-student-location-flow.mjs` → 서버 라벨 PASS. 화면 12 FAIL은 발견
- 캡처 없음. st1 로그인 세션이 없어 1280·390 화면을 찍지 않았다.

## 발견 목록

- 관리자 노출(`src/Admin/AdminExposureRepository.php`)은 여전히 `preferred_region_note` 를 지역 글에 이어 보여 준다. 관리자 화면은 고치지 않았다.
- `verify-hold-find-address.mjs` 「안내 문구」: 찾기 화면에 `시·군·구까지 선택해 주세요` 가 없다. 이 변경 파일이 아니다.
- `verify-tutor-home-student-tab.mjs` 정적 3건: `getRegionFeed` 대기 조건, 찾기 화면 문구, 공부방 홈 로딩 문구. 실행 경로는 통과했다.
- `verify-student-mypage-hope-region.mjs` 1건: 검증이 `window.confirm` 을 보는데 화면은 `s114Confirm` 이다. 이번 변경 전부터 그렇다.
- `verify-student-branch-two-tabs.mjs`: `guardParentFindTab` 이 없고 GNB `find_room` 숨김이 기대와 다르다. 희망지역 추가 저장 검증은 통과했다.
- `verify-student-location-flow.mjs` 화면 12건: 찾기 탭 직접 진입·의정부 잔존 문구. 서버 지역 라벨 검증은 통과했다.

## 보완 (verify:tutor-search-fields)

`studentHopeOr`를 `studentGuBaseWhere` 뒤로 옮겼다. `studentGuBaseWhere` 주석에 더했던 한 줄은 `studentHopeOr` 주석으로 옮겼다. `guestScopedFilters` 본문은 그대로다. 검사 스크립트는 바꾸지 않았다.

## 배포 전 사용자 할 일

운영 phpMyAdmin에 `sql/schema/087_student_hope_region_extra.sql` 을 적용하기 전에는 추가 지역 저장과, 그 컬럼을 읽는 학생 찾기가 실패한다. Actions는 이 SQL을 실행하지 않는다.
