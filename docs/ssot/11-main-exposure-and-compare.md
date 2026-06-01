# 11장 — 메인 노출 항목 및 비교검색 표시 기준 잠금

**상태: 잠금**  
**연동:** [6장](06-phase1-menu-structure.md) · [9장](09-main-screen-roles.md) · [5장](05-study-room-db.md) · [8장](08-tutor-registration-db.md) · [4장 §7](04-member-db-and-role-profiles.md#7-students--자녀--과외등록)  
**프리뷰:** [preview/home-ui/](../../preview/home-ui/) · [EXPOSURE-REPORT.md](../../preview/home-ui/EXPOSURE-REPORT.md)

---

## 1. 노출 밀도 원칙

| 등급 | 성격 | 동일 DB 원본 |
|------|------|----------------|
| **Prime** | 설득 | 다른 밀도로 표시 |
| **Pick** | 핵심 비교 | 다른 밀도로 표시 |
| **Basic** | 대량 노출 (리스트) | 다른 밀도로 표시 |

---

## 2. 비교검색 (잠금)

| 규칙 | 내용 |
|------|------|
| 비회원 | **열리지 않음** |
| 로그인 후 | **팝업(모달) · 표 형태** |
| 자격 | 등급보다 **비교 필수 항목 충족** 우선 |
| 공통 | 핵심 비교 항목은 **전 등급 공통** |
| Prime/Pick | 핵심 비교표 + **보조 정보** 추가 가능 |
| 최대 | **3개** 비교 |

---

## 3. 공부방 노출 항목 (5장 DB)

### 3-1. Prime 박스

| UI | DB |
|----|-----|
| 대표 이미지 | `study_room_images.image_path` |
| 공부방명 | `study_rooms.study_room_name` |
| 위치 | `region_id` / `complex_id` / `address_text` |
| 주력과목 | `study_rooms.main_subject_note` |
| 대상 학년 | `study_room_subject_targets.school_level` / `grade_band` |
| 대표 가격 | `study_rooms.price_amount` |
| 짧은 소개 | `study_rooms.intro_short` |
| 특징 2개 | `feature_1` / `feature_2` |
| 배지 1~2 | `education_office_registered` · `career_years` · `one_on_one_available` · `weekend_available` |

### 3-2. Pick 박스

대표 이미지 · 공부방명 · 위치 · 주력과목 · 대상 학년 · 대표 가격 · 특징 1 · 배지 1

### 3-3. Basic 리스트

공부방명 · 위치 · 주력과목 · 대상 학년 · 대표 가격 · 상태 태그 1 · 최근 등록

### 3-4. 비교검색 표 (로그인·모달)

공부방명 · 위치 · 대상 학년 · 주력과목 · 가격 대표값 · 수업 형태 · 1타임 인원 · 교육청 등록 · 주말 가능 · 시설 핵심 · 특징 1~3

---

## 4. 과외쌤 노출 항목 (8장 · **실DB 미생성**)

필드명: `tutors` · `tutor_regions` · `tutor_subject_targets` · `tutor_images`

### 4-1. Prime

프로필 이미지(`tutor_images.image_path`) · 표시명(`tutors.display_name`) · 주요 과목(`tutor_subject_targets`) · 가능 지역(`tutor_regions`) · 대표 과외비 · 경력 · `intro_short` · `feature_1`/`feature_2` · 검증 배지

### 4-2. Pick

이미지 · 표시명 · 주요 과목 · 가능 지역 · 대표 과외비 · 경력 또는 특징 1

### 4-3. Basic 리스트

표시명 · 주요 과목 · 가능 지역 · 대표 과외비 · 경력 또는 특징 1

### 4-4. 비교검색 표 (경량)

표시명 · 성별/수업 형태 · 주요 과목 · 가능 지역 · 대표 과외비 · 경력 · 학력 요약 · 증빙 가능 · 특징 1~3

---

## 5. 학생 리스트 (4장 · 비교 대상 아님)

| UI | DB |
|----|-----|
| 공개 표시명 | `students.public_display_name` |
| 학교급/학년 | `students.grade_level` |
| 성별 | `students.gender` |
| 희망 지역 | `preferred_region_id` / `preferred_complex_id` |
| 희망 과목 | `student_subject_targets.subject_name` |
| 희망 과외비 | `students.preferred_fee_amount` |
| 짧은 요청문 | `students.request_summary` |

카드형 X · **리스트형** · 하단 수요 노출

---

## 6. 실DB 연결 (1차)

| 대상 | 상태 |
|------|------|
| 공부방 | **연결 가능** (5장 DDL) |
| 학생 | **연결 가능** (4장 DDL) |
| 과외쌤 | **실DB 미생성** — 8장 필드명으로 프리뷰 더미만 |

---

## 7. 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-01 | 11장 잠금 — 노출 항목·비교검색 표 |
