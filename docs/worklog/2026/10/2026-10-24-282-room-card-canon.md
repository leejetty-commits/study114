# 282 — 공부방 픽·프라임 카드 정본 구성

**과제 ID:** 282  
**브랜치:** `cursor/282-room-card-canon-20261024`  
**작업일:** 2026-10-24

---

## 지시서 원문 요약 (v2)

- 공부방 픽 13칸: 베이직 9 + 특징 1 + 신뢰배지 + 수업스타일 + 소개(긴 소개 한 줄) + 슬로건 + 액션
- 공부방 프라임 15칸: 베이직 9 + 특징 1~3 + 신뢰배지 + 소개(긴 소개 한 줄) + 수업스타일 + 수업스타일 추가설명 + 주당 수업회수 + 슬로건 + 액션
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

---

## 검수

- 빌드 성공 (`npm run build:dothome`) ✓
- `verify-room-card-slots-20261009.mjs` 1부 정적 전체 PASS ✓ (2부는 기존 import.meta.env 환경 문제)
- `verify-pickprime-purchase-gate.mjs` import 오류(기존 @study-room-ui/state.js) — 스크립트 자체 문제, 282 범위 밖
- `verify-detail-card-all-fields.mjs` import 오류(기존 import.meta.env 환경 문제) — 수정 불필요

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
| (커밋 5) | (사용자 승인 대기) | |
