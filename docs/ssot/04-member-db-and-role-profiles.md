# 4장 — 공통 회원 DB와 역할 프로필 테이블 구조

**상태: 잠금**  
**역할:** Cursor가 **공통 회원·역할·자녀(과외등록)** 테이블을 만들 때 보는 **DB SSOT**  
**전제:** [2장 — 가입방식 잠금](02-registration-and-member-db.md)  
**DDL:** [001_init.sql](../../sql/schema/001_init.sql) → [004_member_ssot_align.sql](../../sql/schema/004_member_ssot_align.sql) (4장 정합)

---

## 1. 목적

우동공과는 공부방·과외쌤·학생/학부모·향후 **커뮤니티**까지 연결될 수 있으므로, 회원을 **공통 모듈**로 설계한다.

| # | 1차 원칙 |
|---|----------|
| 1 | 가입은 **공통 간편가입**으로 시작 |
| 2 | 학생 = **학생/학부모 통합 축**, **학부모 기준** 운영 |
| 3 | 한 회원이 **공부방 + 과외** 역할 **동시 보유** 가능 |
| 4 | 로그인 후 화면은 **선택한 역할 1개 기준만** (동시 역할 UI **없음**) |
| 5 | 자녀 = **별도 로그인 없음**, 학부모 계정 하위 **students** |

---

## 2. 가입 흐름 (DB 관점)

```
공통 회원가입 (users)
  → 기본 프로필 (user_profiles)
  → 역할 부여 (user_roles)
  → 역할별 상세등록 (study_rooms / tutors / students·과외등록)
```

화면 순서: **2장** · [preview/auth-ui/](../../preview/auth-ui/)

---

## 3. 핵심 테이블

| 테이블 | 역할 | 비고 |
|--------|------|------|
| `users` | 공통 계정 | 로그인·상태·인증 기준 |
| `user_profiles` | 기본 인적 정보 | 연락처·주소·수신동의·**기본 거주지** |
| `user_roles` | 역할 매핑 | 공부방/과외/학부모 **동시 보유** |
| `students` | 학부모 소속 자녀 + **과외등록 원본** | 별도 로그인 없음 · **school_name 없음** |
| `subject_masters` | 공통 과목 마스터 | 공부방/과외쌤/학생 공통 |
| `student_subject_targets` | 학생 희망과목 매핑 | `subject_master_id` FK |
| `student_preferred_lesson_places` | 희망 수업장소 | `student_home` / `study_room` / `public_place` |
| `student_preferred_teaching_style_badges` | 희망 강의스타일 | 배지 복수 |

지역 마스터: `regions` · `complexes` (2장 §8)  
공부방 본문: **5장** · 과외쌤 프로필: **8장** → `008_tutors.sql` · `010_tutor_extended.sql`

---

## 4. users

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT UNSIGNED | NO | PK (1차: bigint auto) |
| email | VARCHAR(255) | NO | 로그인 ID · UNIQUE |
| password_hash | VARCHAR(255) | NO | bcrypt |
| status | ENUM | NO | `active` · `pending` · `blocked` · `withdrawn` |
| email_verified_at | DATETIME | YES | 2차 |
| last_login_at | DATETIME | YES | |
| created_at | DATETIME | NO | |
| updated_at | DATETIME | NO | |
| deleted_at | DATETIME | YES | 탈퇴/비활성 추적 |

> **001 gap:** `status` 값 `inactive` → 4장 `pending`/`blocked` 로 정합 필요. `deleted_at` 추가.

---

## 5. user_profiles

**성격:** 회원 **기본 주소(집 주소)** · 기본 거주 동/단지.  
탐색·매칭용 지역은 **자녀(`students`) 또는 역할별 상세**에서 별도 (§10-2).

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| user_id | BIGINT UNSIGNED | NO | PK · FK → users |
| real_name | VARCHAR(50) | NO | 실명 |
| phone | VARCHAR(20) | YES | 휴대폰 |
| gender | ENUM('male','female') | YES | |
| birth_date | DATE | YES | 생년월일 |
| address_zip | VARCHAR(10) | YES | 우편번호 |
| address_line1 | VARCHAR(255) | YES | 기본 주소 |
| address_line2 | VARCHAR(255) | YES | 상세 주소 |
| default_region_id | BIGINT UNSIGNED | YES | FK → regions (기본 **동**) |
| default_complex_id | BIGINT UNSIGNED | YES | FK → complexes (기본 **단지**) |
| sms_opt_in | TINYINT(1) | NO | default 0 · SMS 수신 |
| email_opt_in | TINYINT(1) | NO | default 0 · 이메일 수신 |
| safe_number_opt_in | TINYINT(1) | NO | default 0 · **확장만** (§10-3) |
| phone_verified_at | DATETIME | YES | 2차 |
| created_at / updated_at | DATETIME | NO | |

### 5-1. 2장 가입 UI ↔ DB 매핑 (잠금)

| UI 라벨 | UI `name` | DB 컬럼 |
|---------|-----------|---------|
| 이메일(ID) | `email` | `users.email` |
| 이름 | `name` | `user_profiles.real_name` |
| 성별 | `gender` | `user_profiles.gender` |
| 생년월일 | `birth_date` | `user_profiles.birth_date` |
| 휴대폰 | `phone` | `user_profiles.phone` |
| 주소 | `address` | `address_line1` (1차 단일 입력 · zip/line2 nullable) |
| 문자 수신 동의 | `sms_consent` | `sms_opt_in` |
| 이메일 수신 동의 | `email_consent` | `email_opt_in` |
| 안전번호 | `safe_number_use` | `safe_number_opt_in` · **UI 1차 비노출** |

> UI `name`은 **2장·auth-ui 프리뷰 잠금**. DB 컬럼명은 **4장** 우선.

### 5-2. 주소·지역 (§10-2 잠금)

| 구분 | 저장 |
|------|------|
| 회원 집 주소 | `user_profiles` (address_* · default_region/complex) |
| 자녀 희망 지역 | `preferred_studyroom_region/complex` · `preferred_tutor_region` · `preferred_region_note` |
| 공부방·과외 활동 지역 | 5장 · tutors (역할별 상세) |

---

## 6. user_roles

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT UNSIGNED | NO | PK |
| user_id | BIGINT UNSIGNED | NO | FK → users |
| role_type | ENUM | NO | `guardian_student` · `study_room_owner` · `tutor` · `admin` |
| is_primary | TINYINT(1) | NO | default 0 · **대표 역할** |
| status | ENUM | NO | `active` · `inactive` |
| created_at | DATETIME | NO | |

### 6-1. 역할 규칙 (잠금)

- `study_room_owner` + `tutor` **동시 보유** 가능.
- 로그인 후 **한 번에 한 역할 화면만** — 공부방 진입 vs 과외쌤 진입 **분리**.
- 여러 역할 보유해도 **동시 역할 UI 사용하지 않음**.
- 가입 시 UI `student` → DB `guardian_student` (학부모 축).
- `admin` — 운영자 (1차 UI 범위 외).

| 시점 | role_type |
|------|-----------|
| 학부모 축 가입 완료 | `guardian_student` |
| 공부방 상세등록 최초 | `study_room_owner` |
| 과외쌤 상세등록 최초 | `tutor` |

> **001 gap:** `role` → `role_type`, `member` → `guardian_student`, `is_primary`/`status` 추가.

---

## 7. students — 자녀 + 과외등록

**학부모 1 : 자녀 N** · **과외 의뢰용 블라인드 공개** (§10-1).

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT UNSIGNED | NO | PK |
| guardian_user_id | BIGINT UNSIGNED | NO | FK → users (학부모) |
| student_name | VARCHAR(50) | NO | 원본 이름 (**비공개**) |
| public_display_name | VARCHAR(50) | YES | 블라인드 **공개용** 표시명 |
| request_title | VARCHAR(200) | YES | 과외등록 제목 |
| request_summary | TEXT | YES | 과외등록 요약 |
| request_summary_visibility | ENUM | NO | `private` · `paid_only` |
| special_request_note | TEXT | YES | 특이요청/개인사정 |
| special_request_visibility | ENUM | NO | `private` · `paid_only` |
| gender | ENUM('male','female') | YES | |
| birth_year | SMALLINT | YES | 출생연도 |
| grade_level | VARCHAR(20) | YES | 학교급/학년 |
| school_track | VARCHAR(50) | YES | 계열/분류 |
| preferred_lesson_type | ENUM('study_room','tutor') | YES | |
| preferred_studyroom_region_id | BIGINT UNSIGNED | YES | FK → regions (동) |
| preferred_studyroom_complex_id | BIGINT UNSIGNED | YES | FK → complexes |
| preferred_tutor_region_id | BIGINT UNSIGNED | YES | FK → regions (시) |
| preferred_region_note | VARCHAR(255) | YES | 지역 보충 |
| preferred_tutor_gender | ENUM('male','female','any') | YES | |
| preferred_student_count_group | ENUM | YES | `solo`·`two`·`three`·`four_plus` — UI **희망 수업인원** |
| preferred_fee_amount | INT UNSIGNED | YES | 수업예산(과외) |
| preferred_studyroom_fee_amount | INT UNSIGNED | YES | 수업예산(공부방) |
| lessons_per_week | SMALLINT UNSIGNED | YES | 주 N회 |
| minutes_per_lesson | SMALLINT UNSIGNED | YES | 1회 분 |
| lesson_format | ENUM('one_on_one','group') | YES | UI **단독과외** / **그룹과외** (DB code 유지) |
| student_gender_group | ENUM('male','female','mixed') | YES | 그룹과외 시 남/여/남여 구성 |
| academic_level_note | TEXT | YES | |
| preferred_style_note | VARCHAR(255) | YES | |
| preferred_school_note | VARCHAR(255) | YES | |
| preferred_academic_background_note | VARCHAR(255) | YES | |
| expected_tutoring_period_note | VARCHAR(255) | YES | |
| required_document_note | VARCHAR(255) | YES | |
| contact_time_note | VARCHAR(255) | YES | |
| feature_1 | VARCHAR(100) | YES | |
| feature_2 | VARCHAR(100) | YES | |
| feature_3 | VARCHAR(100) | YES | |
| exposure_status | ENUM | NO | `draft` · `published` · `hidden` · `deleted` |
| published_at | DATETIME | YES | 과외등록 공개 시각 |
| deleted_at | DATETIME | YES | |
| created_at / updated_at | DATETIME | NO | 등록순 = `ORDER BY created_at ASC, id ASC` |

### 7-1. 노출 상태 (§10-1-1)

| status | 의미 |
|--------|------|
| `draft` | **저장만** — 외부 미노출 |
| `published` | **과외등록** 후 공개 |
| `hidden` | **노출 철회** |
| `deleted` | 작성값 **전체 삭제** |

- 저장 ≠ 공개. 학부모가 **과외등록**을 해야 `published`.
- **노출 철회·삭제** 항상 가능.

### 7-2. student_subject_targets

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGINT UNSIGNED | PK |
| student_id | BIGINT UNSIGNED | FK → students |
| school_level | ENUM | `preschool` · `elementary` · `middle` · `high` · `n_su` · `general` · `other` |
| subject_master_id | BIGINT UNSIGNED | FK → subject_masters |
| subject_name | VARCHAR(50) | 표시용 과목명 |
| is_primary | TINYINT(1) | 주요 과목 |

### 7-2. 과외등록 — 필수 13항목 (저장만 vs 공개)

| 항목 | DB |
|------|-----|
| 희망교습형태 | `preferred_lesson_type` |
| 학생성별 | `gender` |
| 학교급/학년 | `grade_level` |
| 희망지역 | studyroom/tutor region + `preferred_region_note` |
| 희망과목 | `student_subject_targets` |
| 희망 수업장소 | `student_preferred_lesson_places` |
| 희망 수업인원 | `preferred_student_count_group` (화면 용어 · DB code 동일) |
| 수업형태 | `lesson_format` — 단독과외 시 인원 `solo` 자동 |
| 그룹 구성 | `student_gender_group` — **그룹과외일 때만** |
| 주 횟수 | `lessons_per_week` |
| 1회 시간 | `minutes_per_lesson` |
| 희망 강의스타일 | `student_preferred_teaching_style_badges` |
| 희망과외쌤성별 | `preferred_tutor_gender` |
| 수업예산 | `preferred_fee_amount` / `preferred_studyroom_fee_amount` |

**visibility (1차 구현):** `request_summary_visibility` · `special_request_visibility` — UI + 상세 권한 제어 포함. 무료 공급자 차단 · 유료는 `paid_only`만 열람.

> **001 gap:** `students` 테이블 **전면 재설계** — `004` 참고.

---

## 8. 관계 규칙

```
users 1 ── 1 user_profiles
users 1 ── N user_roles
users 1 ── N students (guardian_user_id)
students 1 ── N student_subject_targets
```

- 공부방 + 과외 **동시 역할** OK · **화면은 역할 1개씩**
- 자녀 = 학부모 계정 하위 · **별도 student 로그인 없음**
- 만 14세 미만 **별도 분기 없음** (2장)

---

## 9. 1차 잠금 결론

- [x] `users` 기준 공통 회원
- [x] 학부모 기준 · `guardian_student`
- [x] 만 14세 미만 분기 **없음**
- [x] 공부방+과외 **동시 보유** · **단일 역할 화면**
- [x] 자녀 **N명** · **저장/과외등록/철회/삭제** 분리
- [x] 과외등록 공개 시 **필수 10항목**
- [x] 희망과외쌤성별·희망과외비 = **검색 필터 필수**
- [x] 안전번호 = **컬럼만** · UI 1차 **비노출** (§10-3)
- [x] 집 주소 vs 활동/희망 지역 **분리** (§10-2)

### 9-1. ENUM 표현 (2026-07-04 정합)

| 컬럼 | DB code | UI 라벨 |
|------|---------|---------|
| `lesson_format` | `one_on_one` · `group` | 단독과외 · 그룹과외 |
| `student_gender_group` | `male` · `female` · `mixed` | 남 · 여 · 남여 |
| `preferred_student_count_group` | `solo` · `two` · `three` · `four_plus` | 단독 · 2명 · 3명 · 4명 이상 |

- **DB enum 값 변경 없음** — 화면·API는 code → 한글 매핑만
- 단독과외 선택 시 `preferred_student_count_group=solo` 자동
- 그룹과외 선택 시 `student_gender_group` + 희망 수업인원 **함께** 입력

---

## 10. ER

```
regions ──< complexes
   │
users ── user_profiles
  ├──< user_roles
  ├──< students ──< student_subject_targets
  └──< tutors (8장) · study_rooms (5장)
```

---

## 11. DDL · 001/002와의 gap

| 파일 | 상태 |
|------|------|
| [001_init.sql](../../sql/schema/001_init.sql) | 초안 · **4장과 부분 불일치** |
| [002_profile_signup_fields.sql](../../sql/schema/002_profile_signup_fields.sql) | 2장 UI 임시 컬럼명 (`name`, `sms_consent` 등) |
| **[004_member_ssot_align.sql](../../sql/schema/004_member_ssot_align.sql)** | **4장 정합** |
| [003_subject_masters.sql](../../sql/schema/003_subject_masters.sql) | 과목 마스터 + 시드 |
| [008_tutors.sql](../../sql/schema/008_tutors.sql) | **8장** |

**충돌 시 4장 SSOT 우선.** 002 적용 후 004로 rename·추가.

---

## 12. 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-05-31 | 4장 초안 |
| 2026-07-04 | Notion 4장 2026-07 갱신 · school_name·sort_order 제거 · visibility·신규 매핑 테이블 |
| 2026-07-04 | `student_gender_group` · **희망 수업인원** 용어 · `lesson_format` DB code 유지(§9-1) |
