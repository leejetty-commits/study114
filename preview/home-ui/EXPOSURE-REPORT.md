# 11장 노출·비교검색 — 프리뷰 반영 보고

**SSOT:** [docs/ssot/11-main-exposure-and-compare.md](../../docs/ssot/11-main-exposure-and-compare.md)  
**코드:** `src/exposure-schema.js` · `src/exposure-data.js` · `src/exposure-render.js` · `src/compare-modal.js`

---

## A. 문서 기준 반영 체크

| 항목 | 상태 |
|------|------|
| Prime / Pick / Basic 항목 구조 | ✅ `exposure-schema.js` + `exposure-render.js` |
| 동일 DB · 밀도만 다름 | ✅ 카드/리스트 컴포넌트 분리 |
| 비교검색 비로그인 차단 | ✅ `#/guest` — alert, 모달 미오픈 |
| 비교검색 로그인 후 팝업 표 | ✅ `#/parent` — `compare-modal.js` |
| 비교 최대 3개 | ✅ `COMPARE_MAX = 3` |
| 공부방 필드 5장 정합 | ✅ `exposure-data` 컬럼명 |
| 학생 리스트 4장 정합 | ✅ `public_display_name` 등 |
| 과외쌤 8장 필드명 | ✅ `display_name`, `tutor_*` · `[설계/더미]` 표시 |
| 학생 비교 대상 아님 | ✅ 비교 버튼 없음 |

---

## B. 실DB 연결 가능 항목

### 공부방 (연결 가능)

`study_rooms`, `study_room_images`, `study_room_subject_targets`, `study_room_regions`, `study_room_facilities`, `facility_masters` — 11장 §3·5장 DDL

### 학생 (연결 가능)

`students.public_display_name`, `grade_level`, `gender`, `preferred_region_id`, `preferred_complex_id`, `preferred_fee_amount`, `request_summary`, `student_subject_targets.subject_name`

### 과외쌤 (실DB 미생성)

`tutors`, `tutor_regions`, `tutor_subject_targets`, `tutor_images` — **프리뷰 더미만** · UI에 `[설계/더미]` 표기

---

## C. preview와의 차이

### 이미 맞았던 것

- 비회원 대치동 데모 · Prime/Pick 박스 + 하단 학생 리스트
- 로그인 유도(찜·문의)

### 이번에 수정

| 항목 | 내용 |
|------|------|
| 카드 필드 | name/meta 3줄 → **11장 항목별** (위치·과목·가격·특징·배지·소개) |
| Basic 리스트 | 공부방/과외 **Basic 블록** 추가 |
| 학생 리스트 | `public_display_name`, `request_summary`, `preferred_fee_amount` 등 |
| 비교검색 | 비회원 **차단** · 학부모 `#/parent` **표 모달** |
| 정책 코드 | `exposure-schema.js` 필드·DB 주석 |

### 아직 미구현

| 항목 | 비고 |
|------|------|
| 실 API·DB fetch | 더미 `exposure-data.js` |
| 비교 담기 UX (3개 선택) | 프리뷰는 샘플 3건 고정 표시 |
| compare_eligible 서버 검증 | 일부 더미 `compare_eligible: false` 안내만 |
| 공부방/과외쌤 **로그인 역할** 메인 전면 교체 | study-room·tutor 화면은 구 슬롯 카드 유지 |
| 이미지 `image_path` | placeholder만 |

---

## D. 다음 1순위 작업

**학부모 메인(`#/parent`)을 기준 화면으로 고도화** — 이미 비교 모달·11장 카드 적용됨 → 이어서 **공부방 찾기 전용 라우트**에 Basic 리스트 + 비교 버튼 + 필터(지역) 연결.

확인:

- 비회원: http://localhost:5174/#/guest — 비교 클릭 시 차단
- 로그인(학부모): http://localhost:5174/#/parent — 「공부방 비교검색」→ 표 모달
