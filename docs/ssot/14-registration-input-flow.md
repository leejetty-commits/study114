# 14장 — 가입·기본등록 흐름 및 검색 친화 입력방식

**상태: 잠금**  
**역할:** 가입 → 기본등록 → 상세등록 흐름 · 검색 친화 입력 원칙  
**연동:** [2장](02-registration-and-member-db.md) · [4장](04-member-db-and-role-profiles.md) · [5장](05-study-room-db.md) · [8장](08-tutor-registration-db.md) · [13장](13-search-page-fields.md)  
**프리뷰:** `preview/auth-ui/` (가입 1~5단계) · `preview/study-room-ui/` (공부방 상세)

---

## 1. 목적

검색페이지에서 공부방·과외쌤·학생을 찾게 되므로, **가입 단계부터 검색 핵심값을 구조화해 수집**한다.

잠금 대상:

- 가입과 기본등록의 실제 흐름
- 역할별 기본등록 필수 항목
- 검색 필터링에 유리한 입력 방식 원칙

---

## 2. 예전 엑셀에서 차용하는 핵심

- **기본정보와 상세정보 분리**
- **가입 완료 후 상세등록 유도**
- 학생 / 공부방 / 과외쌤 **역할별 상세항목군 분리**
- 과외쌤: 학교·학과 / 학적상태 / 경력구간 / 연령대 / 가격 축
- 학생: **공부방 예산 / 과외 예산 분리**
- 공부방: 지역 / 과목 / 대상학년 / 수업장소 / 수업운영형태 / 가격 / 타임별 원생수 축

화면 감성은 재사용하지 않아도 **수집 구조와 흐름 논리**는 차용한다.

---

## 3. 가입 · 기본등록 · 상세등록 흐름 (6단계)

| 단계 | 화면 | 핵심 내용 | 메모 |
|------|------|-----------|------|
| 1 | 약관 동의 | 공통 약관 / 개인정보 | 모든 역할 공통 |
| 2 | 공통 기본가입 | 이메일·비밀번호·이름·휴대폰·기본 주소·수신동의 | 최소 계정 생성 |
| 3 | 역할 선택 | 학부모/학생 · 공부방 · 과외쌤 | 최초 흐름은 1역할 기준 |
| 4 | 역할별 기본등록 | 검색·비교 **핵심축** 필수 수집 | **가입 시 수집 범위** |
| 5 | 가입 완료 | 축하 + 기본 노출 안내 | Local List 자격 |
| 6 | 상세등록 유도 | Prime/Pick 연결 CTA | 상세 완료 후 광고 상품 자격 |

auth-ui 라우트: `#/signup/terms` → `role` → `form` → **`basic`** → `complete`

---

## 4. 역할별 기본등록 필수 수집

### 4-1. 학부모/학생

| 항목 | DB (4장) |
|------|----------|
| 희망 유형 | `preferred_lesson_type` |
| 희망 지역 | `preferred_studyroom_region_id` / `preferred_tutor_region_id` (+ `preferred_region_note`) |
| 희망 과목 | `student_subject_targets` + `subject_masters` |
| 학교급/학년 | `grade_level` · `school_level` |
| 희망 수업장소 | `student_preferred_lesson_places` |
| 희망 수업인원 | `preferred_student_count_group` |
| 수업형태 | `lesson_format` — 단독과외 / 그룹과외 |
| 그룹 구성 | `student_gender_group` — 그룹과외일 때만 |
| 주 횟수 · 1회 시간 | `lessons_per_week` · `minutes_per_lesson` |
| 희망 강의스타일 | `student_preferred_teaching_style_badges` |
| 수업예산 | `preferred_fee_amount` · `preferred_studyroom_fee_amount` |

- 화면 라벨: **수업예산** 통일
- `school_name` — **1차 제외** (의도적)
- 요청문/특이요청 + visibility — 4장 선택 항목 · **1차 UI 포함**

### 4-2. 공부방

| 항목 | DB (5장) |
|------|----------|
| 대표지역 | `study_rooms.region_id` · `study_room_regions` |
| 주력과목 | `main_subject_note` · `study_room_subject_targets` |
| 대상 학년/학교급 | `study_room_subject_targets.school_level` (복수) |
| 대표 가격 | `price_amount` |
| 수업장소 | `lesson_place_type` |
| 수업운영형태 | `lesson_operation_type` |
| 타임별 원생수 | `capacity_per_time` |
| 교육청 등록 여부 | `education_office_registered` |

### 4-3. 과외쌤

| 항목 | DB (8장) |
|------|----------|
| 대표 활동 시 | `tutor_regions` (대표 1) |
| 주력과목 | `tutor_subject_targets` |
| 대상 학생군/학년 | `tutor_subject_targets` · `preferred_student_level_note` |
| 대표 과외비 | `preferred_fee_amount` (월) |
| 과외비 산정방식 | `fee_basis_type` |
| 주 횟수 / 월 총 횟수 | `lessons_per_week` · `monthly_session_count` |
| 1회 시간 | `minutes_per_lesson` |
| 출신대학명 · 전공명 | `university_name` · `major_name` |
| 학적상태 | `university_status` |
| 경력구간 | `career_year_band` |
| 연령대 | `age_band` |
| 강의장소 | `tutor_lesson_places` |
| 학생구성 | `student_gender_group` · `student_count_group` |
| 주교재 | `main_material_note` |
| 강의스타일 배지 | `tutor_teaching_style_badges` |

카드 노출: **월 금액 + 주 횟수 + 1회 시간**

---

## 5. 검색 친화 입력 원칙

- 검색 핵심축 = **구조화 입력** 우선 (선택·토글·칩·구간)
- 자유 텍스트 = 소개·요청문·메모·상세설명만
- 정렬/필터 값 = **별도 컬럼** (note 단독 금지)
- 과목 = **subject_masters** + 매핑 · 복수 + 주력 1개

---

## 6. 입력 방식 권장표

| 항목군 | 검색 UI | 등록 UI | 저장 |
|--------|---------|---------|------|
| 슬로건 | 미사용 | 1줄 | varchar |
| 지역 | 단계형 선택 | 지역 선택기 + 대표 | region_id / complex_id |
| 과목 | 8그룹 칩 + 모달 | 복수 + 주력 1 | subject_masters + 매핑 |
| 주교재 | 미사용 | 짧은 서술 | varchar |
| 학교급/학년 | 버튼/세그먼트 | 복수 + 학년 | school_level / grade_band |
| 가격/예산 | 최소~최대 | 대표 숫자 | int · 학생은 과외/공부방 분기 |
| 희망 수업장소 | 복수 버튼 | 학생자택/공부방/공공장소 | 매핑 테이블 |
| 희망 수업인원 | 단일 버튼 | solo/two/three/four_plus | enum |
| 강의스타일 | 배지 | 복수 | 배지 매핑 |
| 경력 | y1_3~y10_plus | 단일 버튼 | enum |
| 학교·학과 | 학교 검색 + 학과 | 분리 입력 | university_name / major_name |
| 학적상태 | 단일 버튼 | enrolled/leave/completed/graduated | enum |
| 강의장소(과외) | 복수 | student_home_visit/public_place/tutor_home | 매핑 |
| 학생구성 | 2단 | 성별구분 → **수업인원** | student_gender_group / student_count_group |
| 연령대 | 구간 버튼 | early_20s … over_50 | enum |
| 불리언 | 체크 | 체크 | boolean |

배지 노출: Basic 1 · Pick 2 · Prime 3

---

## 7. 텍스트 입력 금지 핵심축

지역 · 과목 · 학교급/학년 · 가격/예산 · 경력 · 학교명 · 학과명 · 학적상태 · 공부방 수업운영방식 · 과외 강의장소 · 학생구성 · 대표 활동 지역 · 희망 유형

---

## 8. 자유 텍스트 허용 영역

슬로건 · 소개문 · 상세 소개 · 요청문 · 주교재 · 강의 스타일 설명 · 연락 시간 · 시설 자유기술 · 희망 스타일 메모 · 학업 수준 메모 · `preferred_region_note`

---

## 9. 확정 판단 (§9)

| 항목 | 결정 |
|------|------|
| 경력 구간 | `y1_3` · `y4_6` · `y7_10` · `y10_plus` |
| 학교명 | 한국 대학교명 · 학과명 서술형 |
| 학생 상세 CTA | 신청하기 아님 · **메모(쪽지) 우선** |
| 학생 희망지역 | **1개 UI** · 기본값 = 가입 주소 · `preferred_region_note` 보조 |
| 학생 지역 카드 | 과외 맥락 **시** · 공부방 맥락 **동/단지** |
| 예산 라벨 | **수업예산** 통일 |
| 학생 장소/수업인원/스타일 | 구조화 값 필수 |
| 요청사항 열람 | 유료 공급자만 · `private`면 유료도 차단 |
| 과외 카드 가격 | 월 + 주횟수 + 1회시간 |
| 과외 강의장소 | student_home_visit / public_place / tutor_home 복수 |
| 강의스타일 배지 | passion · meticulous · kind · from_basics · advanced_focus · concept_focus · solution_focus |

---

## 10. 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-07-04 | Notion 14장 원문 전면 반영 · auth-ui 기본등록 화면 |
| 2026-07-03 | Notion 초안 잠금 |
