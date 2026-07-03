# 8장 — 과외쌤 등록 DB 및 상세정보 구조

**상태: 잠금**  
**역할:** Cursor가 **과외쌤 등록·상세** 테이블/컬럼을 만들 때 보는 **DB SSOT**  
**연동:** [5장](05-study-room-db.md) 등록 2단계 · [13장](13-search-page-fields.md) · [14장](14-registration-input-flow.md)  
**DDL:** [008_tutors.sql](../../sql/schema/008_tutors.sql) · [010_tutor_extended.sql](../../sql/schema/010_tutor_extended.sql)

---

## 1. 목적

과외쌤은 1차에서 공부방의 보조축이더라도, **등록 구조는 단순 회원정보 수준이 아니다.**  
학부모가 비교·판단할 수 있는 **서비스 상세 프로필**로 설계한다.

---

## 2. 설계 원칙

| # | 원칙 |
|---|------|
| 1 | 회원정보와 **분리된 독립 프로필** |
| 2 | 가격 = **숫자형 + 설명형** · 카드에 **월금액+주횟수+1회시간** |
| 3 | **슬로건** = 1줄 캐치프레이즈 |
| 4 | 과목·학생군 = **매핑 구조** · `subject_masters` 공통 |
| 5 | 활동 지역 **최대 3 · 대표 1** · 홈 상단 **시 탭** |
| 6 | **조건형 서비스** — 지도/단지 중심 아님 |
| 7 | 증빙 = **별도 검증 테이블** · 정보 vs 광고권 **분리** |

---

## 3. 핵심 테이블

| 테이블 | 역할 |
|--------|------|
| `tutors` | 과외쌤 기본 프로필 |
| `subject_masters` | 공통 과목 마스터 · [003](../../sql/schema/003_subject_masters.sql) |
| `tutor_subject_targets` | 대상/과목 · `is_primary` 주력 1개 |
| `tutor_regions` | 활동 지역 max 3 |
| `tutor_lesson_places` | 강의장소 복수 |
| `tutor_images` | 프로필/소개/증빙보조 |
| `tutor_teaching_style_badges` | 강의스타일 배지 |
| `tutor_verification_documents` | 증빙서류 검수 |

---

## 4. tutors

| 컬럼 | 타입 | 설명 |
|------|------|------|
| tutor_display_name | VARCHAR(50) | 노출용 이름 |
| slogan | VARCHAR(255) | 한줄 슬로건 |
| intro_short / intro_long | VARCHAR / TEXT | 소개 |
| student_gender_group | ENUM | `male` · `female` · `mixed` |
| student_count_group | ENUM | `solo` · `two` · `three` · `four_plus` — UI **수업인원** (원생수 표현 금지) |
| age_band | ENUM | `early_20s` … `over_50` |
| main_subject_note | VARCHAR(255) | 주력과목 요약 |
| main_material_note | VARCHAR(255) | 주교재 |
| preferred_fee_amount | INT | **월** 대표 과외비 |
| career_year_band | ENUM | `y1_3` · `y4_6` · `y7_10` · `y10_plus` |
| fee_basis_type | ENUM | `monthly_by_weekly_schedule` · `monthly_by_total_sessions` |
| lessons_per_week | SMALLINT | 주 횟수 |
| monthly_session_count | SMALLINT | 월 총 횟수 |
| minutes_per_lesson | SMALLINT | 1회 분 |
| fee_description | TEXT | 과외비 설명 |
| university_name | VARCHAR(100) | 출신대학 |
| major_name | VARCHAR(100) | 학과명 |
| university_status | ENUM | `enrolled` · `leave` · `completed` · `graduated` |
| university_note | VARCHAR(255) | 학력 요약(보조) |
| proof_document_available | TINYINT(1) | 증빙 제출 가능 |
| verification_badge_visible | TINYINT(1) | 검증 배지 노출 |
| feature_1~3 | VARCHAR(100) | 특징 |
| contact_time_note | VARCHAR(255) | 연락 시간 |
| youtube_url | VARCHAR(500) | 상세등록 YouTube 1개 (010) |
| profile_status | ENUM | draft / pending / published / hidden |
| detail_completion_status | ENUM | basic_only / expanded_in_progress / expanded_complete |

---

## 5. tutor_subject_targets

| 컬럼 | 설명 |
|------|------|
| school_level | `preschool` … `n_su` … `other` |
| subject_master_id | FK → subject_masters |
| subject_name | 표시용 |
| is_primary | 주력과목 — 홈 헤드라인·Prime/Pick 기준 |

**노출 규칙:** 1순위 과목 일치만 Prime/Pick · 2순위는 Basic만.

---

## 6. tutor_regions · tutor_lesson_places

**tutor_regions:** `scope_type` = `city` · `district` · `metro` · `priority_order` · `is_primary`

**tutor_lesson_places.place_type:** `student_home_visit` · `public_place` · `tutor_home`  
(학생 희망장소 `student_home`/`study_room`/`public_place`와 **별도 코드셋**)

---

## 7. tutor_teaching_style_badges

`badge_name`: `passion` · `meticulous` · `kind` · `from_basics` · `advanced_focus` · `concept_focus` · `solution_focus`  
Basic 1 · Pick 2 · Prime 3 노출.

---

## 8. 학생 열람권 (§11-6 · 1차 정책)

| 대상 | 요청문/특이요청 | 메모 |
|------|-----------------|------|
| 무료 과외쌤 | 차단 | `유료등록시 가능합니다` |
| 유료 과외쌤 | `paid_only`일 때만 | `private`면 차단 |

결제·건수권 DDL은 **1차 제외** (후보).

---

## 9. 등록 2단계 · Prime/Pick · 유튜브

| 단계 | 노출 |
|------|------|
| 기본등록 | 일반 리스트 |
| 상세등록 완료 | Prime/Pick 자격 (노출권 별도) |

`youtube_url` — **상세등록** · 외부 링크 1개.

---

## 10. DDL

| 파일 | 내용 |
|------|------|
| [008_tutors.sql](../../sql/schema/008_tutors.sql) | 핵심 테이블 |
| [010_tutor_extended.sql](../../sql/schema/010_tutor_extended.sql) | detail_completion · youtube |

---

## 11. 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-01 | 2단계·Prime/Pick·유튜브·열람권 후보 |
| 2026-07-04 | Notion 8장 2026-07 전면 반영 · 008/010 · `student_count_group` UI **수업인원** |
