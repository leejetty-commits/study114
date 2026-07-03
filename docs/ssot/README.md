# SSOT (Single Source of Truth) — 우동공과

> **모든 설계·UI·DB·구현은 이 디렉터리를 최우선 기준으로 한다.**  
> `docs/` 내 다른 문서와 충돌 시 **SSOT가 우선**한다.

---

## Cursor에 넘길 때 — 한 줄 요약

**우동공과 1차 구현 기준:** 4장=DB SSOT · 8장=과외쌤 · 13장=검색 · 14장=가입/입력 · 11장=노출/UI · 6장=기능 범위 · 10장=실행 순서. **학생 UI 용어:** 희망 **수업인원** · **단독/그룹과외** · DB enum code 유지.

**먼저 2장+4장+5장으로 DB → 그다음 9장으로 메인 4종 프리뷰 → 전체 순서는 10장.**

---

## Cursor 작업별 — 볼 문서

| 하려는 작업 | SSOT 문서 |
|-------------|-----------|
| **회원/역할/지역 DB 만들기** | [2장](02-registration-and-member-db.md) + [4장](04-member-db-and-role-profiles.md) |
| **공부방 상세 DB 만들기** | [2장 §6](02-registration-and-member-db.md#6-공부방-등록-db-잠금-개념) + [5장](05-study-room-db.md) |
| **공부방 등록 UI 프리뷰** | [5장](05-study-room-db.md) · `preview/study-room-ui/` |
| **메인 4종 UI 프리뷰** | [9장](09-main-screen-roles.md) · [6장](06-phase1-menu-structure.md) · `preview/home-ui/` |
| **1차 메뉴·비교·제외 기능** | [6장](06-phase1-menu-structure.md) |
| **과외쌤 등록·열람권** | [8장](08-tutor-registration-db.md) |
| **검색 UI 프리뷰** | [13장](13-search-page-fields.md) · `preview/search-ui/` |
| **가입·기본등록 입력** | [14장](14-registration-input-flow.md) |
| **메인 노출·비교검색 표** | [11장](11-main-exposure-and-compare.md) |
| **마이페이지·찜·운영 허브** | [15장](15-mypage-structure.md) |
| **쪽지함·접촉·13장 §8 UX** | [16장](16-messages-structure-proposal.md) |
| **고객센터·안전과외 가이드** | [17장](17-customer-center-and-safe-guide.md) |
| **인증/가입 UI** | [2장 §3](02-registration-and-member-db.md#3-인증가입-화면-잠금) · `preview/auth-ui/` |
| **실행 순서·병행** | [10장](10-phase1-execution-plan.md) |

---

## 장별 목록

| 장 | 파일 | 상태 | 용도 |
|----|------|------|------|
| **2장** | [02-registration-and-member-db.md](02-registration-and-member-db.md) | 잠금 | 가입·회원구조·프로필·지역 **개념** |
| **4장** | [04-member-db-and-role-profiles.md](04-member-db-and-role-profiles.md) | 잠금 | **공통 회원·역할·지역·자녀·과외** 테이블 |
| **5장** | [05-study-room-db.md](05-study-room-db.md) | 잠금 | **공부방** 등록·상세 테이블 |
| **6장** | [06-phase1-menu-structure.md](06-phase1-menu-structure.md) | 잠금 | 1차 메뉴·GNB·비교·제외 기능 |
| **8장** | [08-tutor-registration-db.md](08-tutor-registration-db.md) | 잠금 | 과외쌤 2단계 등록·유튜브·열람권 후보 |
| **11장** | [11-main-exposure-and-compare.md](11-main-exposure-and-compare.md) | 잠금 | Prime/Pick/Basic 노출·비교표 |
| **13장** | [13-search-page-fields.md](13-search-page-fields.md) | 잠금 | 검색 기본·확장 · DB 대응 |
| **14장** | [14-registration-input-flow.md](14-registration-input-flow.md) | 잠금 | 가입·기본등록 · 입력방식 |
| **9장** | [09-main-screen-roles.md](09-main-screen-roles.md) | 잠금 | 메인 4종·역할별 노출 |
| **10장** | [10-phase1-execution-plan.md](10-phase1-execution-plan.md) | 잠금 | 1차 실행 순서 |
| **15장** | [15-mypage-structure.md](15-mypage-structure.md) | **초안** | 마이페이지 · 찜 · 운영 허브 |
| **16장** | [16-messages-structure-proposal.md](16-messages-structure-proposal.md) | **초안** | 쪽지함 · 접촉 · 13장 §8 UX |
| **17장** | [17-customer-center-and-safe-guide.md](17-customer-center-and-safe-guide.md) | **초안** | 고객센터 · 이용안내 · 안전과외 가이드 |

---

## UI 프리뷰

| 패키지 | URL | SSOT |
|--------|-----|------|
| [preview/auth-ui/](../../preview/auth-ui/) | http://localhost:5173 | 2장 |
| [preview/home-ui/](../../preview/home-ui/) | http://localhost:5174 | 9장 |
| [preview/study-room-ui/](../../preview/study-room-ui/) | http://localhost:5175 | 5장 |
| [preview/search-ui/](../../preview/search-ui/) | http://localhost:5176 | 13장 |

검증: [auth-ui/DOC-CHECKLIST.md](../../preview/auth-ui/DOC-CHECKLIST.md) · [home-ui/DOC-CHECKLIST.md](../../preview/home-ui/DOC-CHECKLIST.md) · [study-room-ui/DOC-CHECKLIST.md](../../preview/study-room-ui/DOC-CHECKLIST.md) · [search-ui/DOC-CHECKLIST.md](../../preview/search-ui/DOC-CHECKLIST.md)

---

## DDL

| 파일 | SSOT |
|------|------|
| [001_init.sql](../../sql/schema/001_init.sql) | 초안 |
| [002_profile_signup_fields.sql](../../sql/schema/002_profile_signup_fields.sql) | 2장 UI 임시 → 004 rename |
| [003_subject_masters.sql](../../sql/schema/003_subject_masters.sql) | **과목 마스터** |
| [004_member_ssot_align.sql](../../sql/schema/004_member_ssot_align.sql) | **4장 정합** |
| [005_study_room_ssot_align.sql](../../sql/schema/005_study_room_ssot_align.sql) | **5장 정합** |
| [006_facility_masters_seed.sql](../../sql/schema/006_facility_masters_seed.sql) | 5장 §11-3 시설 시드 |
| [008_tutors.sql](../../sql/schema/008_tutors.sql) | **8장 정합** |
| [009_study_room_extended.sql](../../sql/schema/009_study_room_extended.sql) | **5장 §11-10** |
| [010_tutor_extended.sql](../../sql/schema/010_tutor_extended.sql) | **8장 §11-8·§11-9** |
| [011_student_gender_group.sql](../../sql/schema/011_student_gender_group.sql) | **13장 · students.student_gender_group** |

---

## 하위 문서 (SSOT 요약·링크)

| 문서 | SSOT |
|------|------|
| [03-registration.md](../03-registration.md) | 2장 |
| [database/members.md](../database/members.md) | 4장 |
| [database/study_rooms.md](../database/study_rooms.md) | 5장 |
| [database/tutors.md](../database/tutors.md) | 4장 §7 |

---

## 변경 원칙

1. 잠긴 구조·필드명·화면 순서 **임의 변경 금지**
2. 시각 UI 정리는 가능
3. 미잠금 항목은 **`[임시]`** 표시
4. SSOT 변경 시 하위 docs·DOC-CHECKLIST 동시 갱신

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-05-31 | 2·9·10장 + auth-ui |
| 2026-05-31 | home-ui · 4·5장 추가 · Cursor 가이드 |
| 2026-05-31 | Notion 9장 원문 반영 |
| 2026-05-31 | study-room-ui 프리뷰 · 006 facility seed |
| 2026-07-04 | 4·5·8·13·14장 Notion 2026-07 갱신 · SQL 003/008 · home-ui visibility |
| 2026-07-04 | **15장** 마이페이지 초안 (페이지表 · 권한 · 1차 범위) |
| 2026-07-04 | **15장** Notion 합의 반영 — 기획 정본/구현 부록 분리 |
| 2026-07-04 | **16장** home-ui 16a — `#/messages/*` · P16-03/04 |
| 2026-07-04 | **17장** Notion·Cursor 합의 — P17-04~07 섹션 · 쪽지/운영 문의 분리 |
