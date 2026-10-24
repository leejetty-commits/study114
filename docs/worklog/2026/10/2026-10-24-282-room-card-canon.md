# 282 — 공부방 픽·프라임 카드 정본 구성

**과제 ID:** 282  
**브랜치:** `cursor/282-room-card-canon-20261024`  
**작업일:** 2026-10-24

---

## 지시서 원문 요약 (v2)

- 공부방 픽 13칸: 베이직 9 + 특징 1 + 신뢰배지 + 수업스타일 + 소개(긴 소개 한 줄) + 액션
- 공부방 프라임 15칸: 베이직 9 + 특징 1~3 + 신뢰배지 + 소개(긴 소개 한 줄) + 수업스타일 + 수업스타일 추가설명 + 주당 수업회수 + 액션
- 픽/프라임 필수 목록: PHP↔JS 동기화
- intro_short 입력칸 제거 (서버 COALESCE로 기존값 보존)
- 검색 응답에 teaching_style/teaching_style_note/lessons_per_week 추가
- prime_eligible 재계산 (9개 필드 직접 체크)
- feature_2/feature_3에 data-rc-field + tierLabel 추가

## 사용자 보완 사항

1. feature_2/3 입력칸 이미 있음 — `data-rc-field` + `tierLabel` 추가만
2. 필수 목록: 픽=cover,intro_long,fee,teaching_style,feature_1 / 프라임=cover,intro_long,teaching_style,teaching_style_note,fee,lessons_per_week,feature_1,feature_2,feature_3
3. verify-detail-card-all-fields.mjs는 실행 후 깨지는 것만 수정
4. 카드 칸 세기: 슬로건·액션 포함, 픽 13 / 프라임 15 목표

## 범위 확장 승인 (커밋 2)

`StudyRoomRegisterService.php` saveLessonStep의 `intro_short = ?` → `COALESCE(?, intro_short)` 변경.

---

## 수정 파일 목록

| 커밋 | 파일 | 내용 |
|------|------|------|
| 1 (`3c148f3e`) | `src/Paid/TierRequirement.php` | ROOM_PICK_IDS/PRIME_IDS/LABELS 정본화 |
| 1 | `preview/shared/pickprime-requirements.js` | ROOM_PICK_IDS/PRIME_IDS/ROOM_META 정본화 |
| 1 | `preview/home-ui/src/study-room-reg/registration-check-copy.js` | RC_PROMO_MISSING_DEFS intro_short→제거, feature_2/3 추가 |
| 1 | `preview/study-room-ui/src/screens/step-facility.js` | feature_2/3 data-rc-field + tierLabel 추가 |
| 2 (`7fa1d3aa`) | `src/StudyRoom/StudyRoomRegisterService.php` | saveLessonStep intro_short=? → COALESCE(?,intro_short) |
| 2 | `preview/study-room-ui/src/screens/step-lesson.js` | intro_short 입력칸 제거 |
| 2 | `preview/study-room-ui/src/form-collect.js` | intro_short sync/payload 제거 |
| 3 (`538992fa`) | `src/Search/SearchService.php` | SELECT에 teaching_style/note/lessons_per_week 추가, prime_eligible 재계산 |
| 4 (`c74ec84d`) | `preview/home-ui/src/exposure-render.js` | 픽 13·프라임 15 구성, lessonWeeklyLabel import |
| 4 | `preview/home-ui/src/styles/home-listings.css` | .expo-tbl__cell--intro 한 줄 말줄임 |
| 4 | `preview/home-ui/src/detail-decision/studyroom-detail.js` | 확대카드 소개 intro_short → intro_long |
| 5 | `scripts/verify-room-card-slots-20261009.mjs` | ROOM_LABELS_PICK/PRIME 수정 |
| 5 | `scripts/verify-pickprime-purchase-gate.mjs` | 구 목록 하드코딩 문자열 수정 |
| 5 | `docs/internal/47-study-room-home-card-map.md` | 픽·프라임 항목 갱신 |
| 5 | `docs/ssot/11-main-exposure-and-compare.md` | 공부방 항목 갱신 |
| 5 | 이 파일 | 작업기록 |
| 6 (`839d1e89`) | `src/Paid/TierRequirement.php` | 경력특징 2·3 채움 판정 추가 |
| 6 | `preview/shared/pickprime-requirements.js` | feature_2·3 prime 필수 추가 |
| 6 | 이 파일 (docs) | — |
| 7 (이번 커밋) | `preview/home-ui/src/detail-decision/studyroom-detail.js` | 확대카드에 수업스타일·수업스타일 추가설명·주 회수 칸 추가 |
| 7 | `scripts/verify-pickprime-purchase-gate.mjs` | room lesson 7→6, room facility 1→3 |
| 7 | `scripts/verify-detail-card-all-fields.mjs` | FULL_ROOM intro_long 추가, VALUE_OF 소개→intro_long, LABEL_MAP 수업스타일 등 추가 |
| 7 | `docs/internal/47-study-room-home-card-map.md` | 픽·프라임 구매 필수 조건 섹션 추가 |
| 7 | `docs/ssot/11-main-exposure-and-compare.md` | §4-5 픽·프라임 구매 필수 추가 |
| 7 | `docs/worklog/2026/10/screenshots/` | 확인 스크린샷 3장 |
| 7 | 이 파일 | 확인 표·스크린샷·최종 갱신 |

---

## 검수 (커밋 7 기준)

### 자동 점검

| 항목 | 282 결과 | main(b7fabed3) | 비고 |
| --- | --- | --- | --- |
| `node --check` (변경 JS 5파일) | ✅ 통과 | — | |
| `D:\php8.2\php.exe -l TierRequirement.php` | ✅ No syntax errors | — | |
| `verify:shop-page` | ✅ PASS | — | |
| `verify:pickprime-purchase-gate` | ✅ **ok** | PASS | 커밋 6 후 room lesson 6→6, room facility 3→3으로 스크립트 갱신 |
| `verify:detail-card-all-fields` | ✅ **117/25** | 117/25 | main과 동일 — 25 실패는 과외쌤 원생수·성별·수업장소 등 기존 미충족 |

### 수정 과정에서 발견·처리한 사항

| 발견 | 원인 | 처리 |
| --- | --- | --- |
| `room lesson marks` FAIL (7→실제6) | 282가 step-lesson.js의 intro_short tierLabel 삭제 | verify 스크립트 기대값 7→6 갱신 |
| `room facility mark` FAIL (1→실제3) | 282가 step-facility.js에 feature_2·3 tierLabel 추가 | verify 스크립트 기대값 1→3 갱신 |
| 공부방 픽/프라임 미니카드에 수업스타일·주 회수 있으나 확대카드에 없음 | c74ec84d에서 누락 | studyroom-detail.js에 칸 추가, FULL_ROOM·LABEL_MAP 갱신 |
| 공부방 소개 칸 '—' (intro_short→intro_long 미갱신) | verify 시드 FULL_ROOM에 intro_long 없음 | FULL_ROOM에 intro_long 추가, VALUE_OF 갱신 |

### 브라우저 확인 (로컬 dev 서버, 학생 계정 뷰)

| 항목 | 결과 |
| --- | --- |
| 282_pick_full 카드 클릭 → 확대카드 열림 | ✅ |
| 확대카드 칸: 수업스타일·수업스타일 추가설명·주 회수·소개 표시 | ✅ (값 없어 「—」 — DB 미채움) |
| 282_prime_full 확대카드: 특징 3개 연결 | ✅ (수학 전문 · 소규모 맞춤 · 경력 10년) |
| intro_short 칸 상세1 입력폼에 없음 | ✅ (step-lesson.js에서 제거됨) |
| intro_short 값 서버 COALESCE로 보존 | ✅ (StudyRoomRegisterService.php COALESCE 확인) |

**픽/프라임 미니카드 13/15칸 시각 확인**: API가 basic tier로 응답해 픽/프라임 미니카드 형태 미확인 (production 배포 후 확인 필요)

### 스크린샷

| 파일 | 내용 |
| --- | --- |
| `screenshots/b-pick-no-f1-blocked-1280.png` | 픽 구매 막힘 (경력특징 1 없는 계정, 1280) — 커밋 6 이전 |
| `screenshots/b-pick-full-expand-open.png` | 282_pick_full 확대카드 (학생 뷰) |
| `screenshots/b-prime-full-expand-open.png` | 282_prime_full 확대카드 (학생 뷰, 특징 3개 확인) |

## 픽 13칸 · 프라임 15칸 목록 (대표 사진 제외)

### 픽 13칸

| # | 칸 이름 | DB 필드 |
| --- | --- | --- |
| 1 | 공부방명 | `study_room_name` |
| 2 | 과목 | `main_subject_note` |
| 3 | 위치 | `location_label` |
| 4 | 대상 | `grade_band` |
| 5 | 교습형태 | `lesson_place_type` |
| 6 | 가격 | `price_amount` |
| 7 | 원생수 | `capacity_per_time` |
| 8 | 수업운영방식 | `lesson_operation_type` |
| 9 | 슬로건 | `slogan` |
| 10 | 특징 1 | `feature_1` |
| 11 | 신뢰배지 | `education_office_registered` |
| 12 | 수업스타일 | `teaching_style` |
| 13 | 소개 | `intro_long` |

### 프라임 15칸

| # | 칸 이름 | DB 필드 |
| --- | --- | --- |
| 1~9 | 베이직 9칸 (위와 동일) | |
| 10 | 특징 1~3 | `feature_1` · `feature_2` · `feature_3` |
| 11 | 신뢰배지 | `education_office_registered` |
| 12 | 수업스타일 | `teaching_style` |
| 13 | 수업스타일 추가설명 | `teaching_style_note` |
| 14 | 주 회수 | `lessons_per_week` |
| 15 | 소개 | `intro_long` |

> 슬로건·액션(추천·후기·찜·비교·쪽지)은 모든 카드 공통. 칸 세기는 노출 정보 행만.
> 2026-10-25 보정 (295): 픽 9번 등록일→슬로건(slogan), 프라임 특징 1~3 한 칸으로 합쳐 15칸, 요약의 슬로건 중복 제거.

## 구매 막힘 확인표

| 조건 | 서버 (`TierRequirement.php`) | 화면 (`pickprime-requirements.js`) |
| --- | --- | --- |
| 경력특징 1 없음 → 픽 구매 막힘 | ✅ `ROOM_PICK_IDS`에 `feature_1` 포함 | ✅ `ROOM_PICK_IDS`에 `feature_1` 포함 |
| 경력특징 2·3 없음 → 프라임 구매 막힘 | ✅ `ROOM_PRIME_IDS`에 `feature_2`, `feature_3` 포함 | ✅ `ROOM_PRIME_IDS`에 `feature_2`, `feature_3` 포함 |

## 배포 전 사용자 할 일

없음 (SQL 변경 없음, 기존 컬럼 사용).  
단, `teaching_style_note` · `lessons_per_week` 컬럼이 DB에 없는 경우 SearchService는 columnCache() 로 NULL 반환. 운영 DB 컬럼 존재 여부 확인 권장.

---

## 승인 기록

| 커밋 hash | 승인자 | 일시 |
|-----------|--------|------|
| 3c148f3e | (사용자 승인 대기) | |
| 7fa1d3aa | (사용자 승인 대기) | |
| 538992fa | (사용자 승인 대기) | |
| c74ec84d | (사용자 승인 대기) | |
| e93874dd | (사용자 승인 대기) | |
| 839d1e89 | (사용자 승인 대기) | |
| (커밋 7) | (사용자 승인 대기) | |
