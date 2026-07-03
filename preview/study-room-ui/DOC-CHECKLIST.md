# 공부방 등록 UI — SSOT 5장 검증

**SSOT:** [docs/ssot/05-study-room-db.md](../../docs/ssot/05-study-room-db.md) · [2장 §6](../../docs/ssot/02-registration-and-member-db.md#6-공부방-등록-db-잠금-개념)

## 프리뷰

http://localhost:5175 · `cd preview/study-room-ui && npm run dev`

## 6화면 체크리스트

| # | 화면 | 라우트 | SSOT | 상태 |
|---|------|--------|------|------|
| 1 | 기본정보 | `#/register/basic` | §4 | ✅ |
| 2 | 위치·저장지역 | `#/register/location` | §7 | ✅ |
| 3 | 수업·가격·과목 | `#/register/lesson` | §4·§5·§10 | ✅ |
| 4 | 경력·특징 | `#/register/career` | §4 | ✅ |
| 5 | 시설·연락·사진 | `#/register/facility` | §8·§9·§11-1·§11-3 | ✅ |
| 6 | 등록완료 | `#/register/complete` | 2장·9장 CTA | ✅ |

## 필드명 (DB 1:1)

- [x] `study_room_name`, `slogan`, `operator_display_name`, `intro_short/long`, `lesson_place_type` (`academy`/`study_room`)
- [x] `lesson_operation_type`, `detail_completion_status`
- [x] `region_id`, `complex_id`, `address_text` + `study_room_regions` (max 3, `is_primary`)
- [x] `capacity_per_time` enum (`one_to_four`/`five_to_eight`/`nine_plus`), `recruitment_count`, `main_subject_note`, `teaching_style`
- [x] `weekend_available`, `one_on_one_available`
- [x] `price_amount` (월·원), `price_description`
- [x] `study_room_subject_targets` — `school_level` (`n_su`), `grade_band`, `subject_master_id`, `subject_name`, `is_main`
- [x] `career_years`, `academy_career_years`, franchise, education_office, `feature_1~3`
- [x] `facility_masters` 체크 ~5 + `facility_note`
- [x] `contact_time_note`, `contact_phone`
- [x] `study_room_images` — `image_type`, `sort_order` (0~5)
- [x] `profile_status` — draft / pending / published

## 등록 2단계 (5·8·9장 · 2026-06-01)

- [x] **기본등록** — basic + location → 일반 리스트 가능
- [x] **상세등록** — lesson + career + facility → 누구나 이어서
- [x] **Prime/Pick** — 상세등록 완료 전제 (complete 화면 안내)
- [x] **youtube_url** — 상세등록(facility) · 외부 URL 1개

## 설계 원칙

- [x] 가격 숫자 + 설명
- [x] 시설 체크 + 자유기술
- [x] 기본 위치 vs 저장 지역 **분리**
- [x] 단지 우선 / 없으면 동 안내
- [x] 오렌지/블루 톤 (auth-ui 공유)

## [임시] / 미구현

| 항목 | 상태 |
|------|------|
| 지역·단지 검색 API | `[임시]` select 더미 |
| 지도 좌표 lat/lng | `[임시]` 미노출 |
| 이미지 업로드 | `[임시]` 목록만 |
| 폼 → API 저장 | 미구현 (10장 단계 6) |
| 증빙·배지·노출 편성 테이블 | 009 DDL · UI 미구현 |

## 연동

- home-ui 공부방 메인 → **공부방 수정** → localhost:5175
- auth-ui 가입완료 CTA → 추후 본 프리뷰 연결
