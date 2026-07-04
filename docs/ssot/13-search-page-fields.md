# 13장 — 검색페이지 기본·확장 검색항목 및 DB 대응표

**상태: 잠금**  
**역할:** 검색 3탭(공부방/과외쌤/학생)의 기본·확장 검색항목과 DB 컬럼 대응  
**연동:** [4장](04-member-db-and-role-profiles.md) · [5장](05-study-room-db.md) · [8장](08-tutor-registration-db.md) · [14장](14-registration-input-flow.md)  
**Notion:** [13장 SSOT](https://app.notion.com/p/campstory/13-DB-5f7d8fb9479b45b0b60d3e0af1dadd2d)  
**프리뷰:** [preview/search-ui/](../../preview/search-ui/)

---

## 1. 검색페이지 운영 원칙

- **하나의 검색페이지** · 상단 3탭: 공부방찾기 / 과외쌤찾기 / 학생찾기
- 각 탭 = **기본검색** + **확장검색** (스킵 가능 · 기본은 접힘)
- 지역은 로그인 사용자 **기본 지역 자동 적용** 후 변경·**광역 확장** 가능 (§8-3)
- 검색 UI는 DB 항목 **가능한 전부 노출** · 핵심축은 **구조화 컬럼** (note 단독 필터 금지)
- 검색 실행 후 하단은 **필터링 결과 전용** — 홈 Prime/Pick 참고 데이터 제거 (§8-2-1)

---

## 2. 탭별 기본 자동값

| 탭 | 기본 자동값 | 결과 성격 | 지도 |
|----|-------------|-----------|------|
| 공부방찾기 | 내 기본 지역(동/단지) | 지역 고정형 + 비교 | **사용** · 리스트와 핀 동기 |
| 과외쌤찾기 | 내 기본 시 | 조건형 + 비교 | 비사용 |
| 학생찾기 | 내 영업권 지역 | 블라인드 수요 리스트 | 비사용 · 비교검색 없음 |

---

## 3. 공부방찾기 — DB 대응 (§3)

| 우선 | 검색항목 | 구분 | DB | 상태 |
|:--:|----------|------|-----|------|
| 1 | 지역(동/단지) | 기본 | `user_profiles.default_region_id` · `study_room_regions` | 기존 |
| 2 | 주력과목 | 기본 | `main_subject_note` · `study_room_subject_targets` | 기존 |
| 3 | 대상 학년/학교급 | 기본 | `study_room_subject_targets.school_level` · `grade_band` | 기존 |
| 4 | 가격대 | 기본 | `study_rooms.price_amount` | 기존 |
| 5 | 수업장소·운영형태 | 기본 | `lesson_place_type` · `lesson_operation_type` | 기존 |
| 6 | 교육청 등록 | 기본 | `education_office_registered` | 기존 |
| 7 | 1:1 가능 | 확장 | `one_on_one_available` | 기존 |
| 8 | 주말 가능 | 확장 | `weekend_available` | 기존 |
| 9 | 타임별 원생수 | 확장 | `capacity_per_time` | 기존 |
| 10 | 교습 경력 | 확장 | `career_years` · `academy_career_years` | 기존 |
| 11 | 프랜차이즈 | 확장 | `franchise_flag` · `franchise_name` | 기존 |
| 12 | 시설 | 확장 | `study_room_facilities` · `facility_masters` | 기존 |
| 13 | 상세등록 완료 | 확장 | `detail_completion_status` | 기존 |

---

## 4. 과외쌤찾기 — DB 대응 (§4)

| 우선 | 검색항목 | 구분 | DB | 상태 |
|:--:|----------|------|-----|------|
| 1 | 활동 지역(시) | 기본 | `tutor_regions` | 기존 |
| 2 | 주력과목 | 기본 | `main_subject_note` · `tutor_subject_targets.is_primary` | 기존 |
| 3 | 대상 학생군/학년 | 기본 | `tutor_subject_targets.school_level` | 기존 |
| 4 | 대표 과외비 | 기본 | `preferred_fee_amount` | 기존 |
| 5 | 학교명 | 기본 | `university_name` | SSOT 반영 |
| 6 | 학과명 | 확장 | `major_name` | SSOT 반영 |
| 7 | 학적상태 | 확장 | `university_status` | SSOT 반영 |
| 8 | 경력구간 | 기본 | `career_year_band` | SSOT 반영 |
| 9 | 연령대 | 확장 | `age_band` | SSOT 반영 |
| 10 | 강의장소 | 기본 | `tutor_lesson_places.place_type` | SSOT 반영 |
| 11 | 학생 성별 구성 | 확장 | `student_gender_group` | SSOT 반영 |
| 12 | 수업인원 | 확장 | `student_count_group` | SSOT 반영 · **원생수 표현 금지** |
| 13 | 성별(튜터) | 확장 | `user_profiles.gender` 조인 | 기존 |
| 14 | 강의스타일 | 확장 | `tutor_teaching_style_badges` | SSOT 반영 |

카드·검색: **월 금액 + 주 횟수 + 1회 시간** (§10-2)

---

## 5. 학생찾기 — DB 대응 (§5)

| 우선 | 검색항목 | 구분 | DB | 메모 |
|:--:|----------|------|-----|------|
| 1 | 희망 유형 | 기본 | `preferred_lesson_type` | |
| 2 | 희망 지역 | 기본 | `preferred_studyroom_region/complex` · `preferred_tutor_region` | |
| 3 | 희망 과목 | 기본 | `student_subject_targets` | |
| 4 | 학교급/학년 | 기본 | `grade_level` · `school_level` | |
| 5 | 수업예산 | 기본 | `preferred_fee_amount` · `preferred_studyroom_fee_amount` | 라벨 **수업예산** |
| 6 | 희망 수업장소 | 기본 | `student_preferred_lesson_places` | |
| 7 | 희망 수업인원 | 기본 | `preferred_student_count_group` | **`원생수` 금지** |
| 8 | 주 횟수 | 확장 | `lessons_per_week` | |
| 9 | 1회 시간 | 확장 | `minutes_per_lesson` | |
| 10 | 수업형태 | 확장 | `lesson_format` | 단독/그룹과외 |
| 11 | 그룹 구성 | 확장 | `student_gender_group` | **그룹과외만** · [011](../../sql/schema/011_student_gender_group.sql) |
| 12 | 희망 강의스타일 | 확장 | `student_preferred_teaching_style_badges` | |
| 13 | 희망 과외쌤 성별 | 확장 | `preferred_tutor_gender` | **유료 상세등록** · 기본등록 아님 |

### 5-1. 수업형태 · 수업인원 (잠금)

- **단독과외** → `preferred_student_count_group=solo` 자동
- **그룹과외** → `student_gender_group`(남/여/남여) + **희망 수업인원** 함께
- `students.gender` ≠ `student_gender_group`

**요청문/특이요청** — Basic·리스트 기본 미노출 · 유료+`paid_only`일 때 상세만

---

## 6. 가입시 수집 원칙 (§6-1 · §6-2)

- “가입시 수집” = 공통 가입 + **역할별 기본등록**까지
- 기본검색 항목 = 기본등록 **필수** · 신규 컬럼은 가입 플로우에 즉시 편입
- `preferred_tutor_gender` — **유료 상세등록** 필수 (기본등록 아님)

---

## 7. UI 배치 (§8)

### 7-1. 기본검색 1·2줄 (§8-1)

| 탭 | 1줄 | 2줄 |
|----|-----|-----|
| 공부방 | 지역 · 주력과목 · 대상학년 · 가격 | 수업장소 · 수업운영 · 교육청등록 · 검색 |
| 과외쌤 | 활동 시 · 주력과목 · 대상학년 · 대표과외비 | 학교명 · 경력구간 · 강의장소 · 검색 |
| 학생 | 희망유형 · 지역 · 과목 · 학년 | 수업예산 · 수업장소 · 수업인원 · 검색 |

### 7-2. 확장검색 UI (§8-2)

- 기본검색 아래 **`확장검색` 버튼** · 기본 **접힘**
- 인라인 펼침 · 탭 전환 전까지 선택값 유지
- **`기본값으로 초기화`** · **`적용`** 후 리스트 재조회

### 7-3. 광역 검색 (§8-3)

| 탭 | 1차 | 2차 | 3차 |
|----|-----|-----|-----|
| 공부방 | 대표 지역 | 인근 동 | 구군 → 시/도 |
| 과외쌤 | 기본 시 | 인접 시 | 복수 시 → 광역 |
| 학생 | 영업권 | 인접 지역 | 복수 → 광역 |

### 7-4. 결과 행 (§8-4)

- 공부방/과외: **좌(썸네일·이름) · 중(과목·소개) · 우(가격·액션)** · 찜/비교/상세
- 학생: **이미지 없음** · 우측 **메모 보내기**만 · 비교 없음
- 무료 공급자 **콜드** 메모 → `유료등록시 가능합니다` (선연락 답장은 16§1-2)

---

## 8. 권한 (§10-1 · §10-5)

> **접촉 방향:** 공급자→학생 **콜드 메모**만 아래 차단 · 학부모→공급자·답장은 free — [16§1-2](16-messages-structure-proposal.md#1-2-접촉-방향-정본-18장---4-연동).

| 대상 | 학생찾기 탭 | 요청문/특이요청 | 메모 (콜드) |
|------|-------------|-----------------|-------------|
| 학부모/학생 | **비노출** | — | — |
| 무료 공급자 | 리스트+구조화 상세 | 차단 | **콜드** 차단 + 안내 |
| 유료 공급자 | 리스트+상세 | `paid_only`만 | 허용 |

---

## 9. 입력 방식 (§10)

- 가격/예산: **최소~최대**
- 경력: **y1_3 · y4_6 · y7_10 · y10_plus**
- 학교명: 자동완성 · 학과: 서술형
- 학생 화면: **희망 수업인원** · **단독/그룹과외**

---

## 10. ENUM 코드 (DB)

| 축 | code |
|----|------|
| visibility | `private` · `paid_only` |
| lesson_format | `one_on_one` · `group` |
| student_gender_group | `male` · `female` · `mixed` |
| student_count | `solo` · `two` · `three` · `four_plus` |
| student place | `student_home` · `study_room` · `public_place` |
| tutor place | `student_home_visit` · `public_place` · `tutor_home` |
| school_level | `preschool` … `other` |
| teaching_style | `passion` … `solution_focus` |
| study_room place | `academy` · `study_room` |
| lesson_operation | `group_by_time_slot` · `time_slot_mixed_grade` · `individual_visit` |
| capacity | `one_to_four` · `five_to_eight` · `nine_plus` |
| career_year_band | `y1_3` · `y4_6` · `y7_10` · `y10_plus` |
| university_status | `enrolled` · `leave` · `completed` · `graduated` |
| age_band | `early_20s` … `over_50` |
| preferred_lesson_type | `tutor` · `study_room` · `both` |
| detail_completion | `basic_only` · `expanded_in_progress` · `expanded_complete` |

---

## 11. 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-07-04 | Notion 13장 전문 동기화 · §3~§8 · `search-ui` §8-1 배치 |
| 2026-07-04 | `student_gender_group` 신규 · 수업인원 용어 통일 · [011](../../sql/schema/011_student_gender_group.sql) |
