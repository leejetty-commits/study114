# 11장 — 메인 노출 항목 및 비교검색 표시 기준

**상태: 잠금**  
**연동:** [6장](06-phase1-menu-structure.md) · [9장](09-main-screen-roles.md) · [4장](04-member-db-and-role-profiles.md) · [5장](05-study-room-db.md) · [8장](08-tutor-registration-db.md) · [13장](13-search-page-fields.md)  
**프리뷰:** [preview/home-ui/](../../preview/home-ui/) · [EXPOSURE-REPORT.md](../../preview/home-ui/EXPOSURE-REPORT.md)

---

## 1. 목적

- Prime / Pick / Basic **노출 항목** 기준
- **비교검색** 자격·표시 방식·로그인 조건
- 등급별 **표시 밀도** (폰트 크기 동일 · 이미지·필드 수·배치로 차별)

---

## 2. 공통 원칙

| 원칙 | 내용 |
|------|------|
| 역할 | Prime=설득 · Pick=핵심 비교 · Basic=대량 탐색 |
| 비교 자격 | 등급이 아닌 **필수 항목 충족** |
| 비교 항목 | **전 등급 공통** 핵심표 · Prime/Pick은 보조만 추가 |
| 비회원 | 비교검색 **불가** |
| 비교 UI | 로그인 후 **모달 표** · 카드에서 체크 → 팝업 비교 |
| 비교 최대 | **3개** |
| 중복 노출 | Prime/Pick 항목도 Basic 리스트에 **포함 가능** |
| 리스트 | **3구역 행형** (좌: 썸네일+이름 / 중: 설명 2줄+ / 우: 가격·상태·날짜·액션) |
| 액션 | 추천 / 찜 / 후기(답글 포함) / 쪽지 / 비교 — **아이콘+숫자** |
| 후기 | 0이면 숨김 · 1+ 이면 아이콘+개수 |
| 페이지네이션 | 숫자형 · 현재 페이지 밑줄 · **가운데 정렬** |

---

## 3. 실DB 상태 (2026-07)

| 구분 | 상태 | DDL |
|------|------|-----|
| 공부방 | 연결 가능 | 005 · 009 |
| 학생 | 연결 가능 | 004 |
| 과외쌤 | **008/010 적용** | 008 · 010 |

---

## 4. 공부방 노출 (5장)

### 4-0. 최신 카드 양식 (2026-07-04 우선)

- **표형태** 카드 · 가로 **균등 배분** (Basic 특히)
- 괄호 항목명 미표시 · **값만**
- Prime/Pick 이미지 **우하단 비교 오버레이**
- Pick: `intro_short` 숨김 · `feature_1` 1개만
- Basic 3행:
  1. 공부방명 / 대상 / 과목 / 가격 / 비교
  2. 위치 / 수업장소 / 원생수 / 수업형태 / 특징1
  3. 슬로건 / 액션

### 4-1. Prime

위치 상단 1줄 → 이미지(16:9) → 공부방명·가격 → 신뢰배지 → 대상·과목 → 수업장소·원생수·수업운영형태 → 특징 → 소개 → 슬로건 → 액션

| UI | DB |
|----|-----|
| 이미지 | `study_room_images.image_path` |
| 위치 | `region_id` / `complex_id` / `address_text` |
| 공부방명 | `study_room_name` |
| 가격 | `price_amount` |
| 대상 | `study_room_subject_targets.school_level` / `grade_band` |
| 과목 | `main_subject_note` |
| 수업장소 | `lesson_place_type` |
| 원생수 | `capacity_per_time` |
| 수업형태 | `lesson_operation_type` |
| 특징 | `feature_1~3` |
| 소개 | `intro_short` |
| 슬로건 | `slogan` |
| 배지 | `study_room_badges` · 교육청등록 등 |

### 4-2. Pick / Basic

Pick: Prime에서 소개 제외 · 특징1 · 슬로건 유지  
Basic: §4-0 3행 구조 · 이미지 기본 제외

### 4-3. 비교검색 표

공부방명 · 위치 · 대상 학년 · 주력과목 · 가격 · **수업장소** · **수업운영형태** · 타임별 원생수 · 교육청등록 · 주말가능 · 시설 핵심 · 특징1~3

### 4-4. 비교 자격 (§7)

`study_room_name` · `region_id|complex_id` · `main_subject_note` · `price_amount` · `study_room_subject_targets` 1건+ · `feature_1|intro_short`

---

## 5. 과외쌤 노출 (8장)

### 5-0. 최신 카드 양식 (2026-07-04 우선)

- 표형태 · **추천** 용어 통일 (`좋아요` X)
- **강의스타일** = `tutor_teaching_style_badges`
- **학생구성** = 성별구분 + **수업인원** (예: `혼성 · 단독`)
- **학교·학과** 한 줄 · **주교재** 서술형
- **증빙서류 n개 등록** (집계 · 클릭 시 미니팝업)
- 가격 카드: **월 + 주횟수 + 1회시간**

Basic 3행:
1. 표시명 / 대상 / 과목 / 가격요약 / 비교
2. 활동지역 / 수업장소 / 학생구성 / 특징1 / 강의스타일1
3. 슬로건 / 액션

### 5-1. Prime / Pick

Prime: 지역 상단 → 이미지 → 졸업·경력배지 → 학교·학과 → 가격요약 → 표시명 → 증빙문구 → 대상·과목 → 장소 → 학생구성 → 주교재 → 특징 → 강의스타일 → 소개 → 슬로건  
Pick: 소개 숨김 · 특징1만

### 5-2. 비교검색 표

표시명 · 성별/연령대 · 주요과목 · 활동지역 · 월과외비·주·분 · 경력구간 · 학적상태 · 학교·학과 · 강의장소 · 학생구성 · 강의스타일 · 증빙 n개 · 특징1~3

### 5-3. 메인 바디 우선순위

- **주력과목 헤드라인** → 활동 시 1~3 · 시 탭 필터
- 2순위 과목 과외쌤 = **Basic만**
- 학생 리스트 = 선택 시+과목 필터 · Basic만
- 노출 수: Prime 3 · Pick 10 · Basic 20 (과외쌤)

### 5-4. 비교 자격

`tutor_display_name` · `main_subject_note|tutor_subject_targets` · `tutor_regions` 1건+ · `preferred_fee_amount` · `career_year_band|feature_1`

---

## 6. 학생 리스트 (4장 · 비교 대상 아님)

### 6-0. Basic 2행 (2026-07-04)

| 행 | 좌 | 중 | 우 |
|----|----|----|-----|
| 1 | 공개표시명 · 성별·학년 | 희망과목 · 강의스타일 1~2 | **수업예산** · 주횟수·1회시간 |
| 2 | 희망 지역 | 희망 장소 · **희망 수업인원** | 요청 **비공개/유료공개** 상태 |

- 지역: 과외 맥락 **시** · 공부방 맥락 **동/단지**
- `request_summary` — **Basic 미노출** · 상세+권한

### 6-1. DB 필드

`public_display_name` · `grade_level` · `gender` · `preferred_studyroom_region_id` / `preferred_tutor_region_id` / `preferred_region_note` · `student_subject_targets` · `preferred_fee_amount` / `preferred_studyroom_fee_amount` · `student_preferred_lesson_places` · `preferred_student_count_group` · `lessons_per_week` · `minutes_per_lesson` · `student_preferred_teaching_style_badges` · visibility 2축

---

## 7. 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-01 | 11장 잠금 초안 |
| 2026-07-04 | 학생·과외 **수업인원** 용어 · tutor 학생구성 예시 정합 |
