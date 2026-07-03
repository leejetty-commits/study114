# 공부방 DB

> **SSOT 5장 최우선**  
> [ssot/05-study-room-db.md](../ssot/05-study-room-db.md)

## 핵심 테이블

| 테이블 | 5장 |
|--------|-----|
| study_rooms | §4 |
| subject_masters | §5-1 · [003](../../sql/schema/003_subject_masters.sql) |
| study_room_subject_targets | §5 |
| study_room_regions | §6-1 |
| study_room_images | §6 |
| facility_masters | §7 |
| study_room_facilities | §8 |
| study_room_verification_documents | §11-10-2 |
| study_room_badges | §11-10-3 |
| study_room_exposure_assignments | §11-10-4 |
| study_room_exposure_waitlists | §11-10-5 |

## DDL

```bash
.\scripts\apply-schema-dev.ps1   # 001~009 일괄
```

## ENUM (DB code · UI 한글)

| 컬럼 | code |
|------|------|
| lesson_place_type | `academy` · `study_room` |
| lesson_operation_type | `group_by_time_slot` · `time_slot_mixed_grade` · `individual_visit` |
| capacity_per_time | `one_to_four` · `five_to_eight` · `nine_plus` |
| detail_completion_status | `basic_only` · `expanded_in_progress` · `expanded_complete` |
| school_level | `preschool` … `n_su` … `other` |

## 잠금 요약 (2026-07)

- **슬로건** · **수업운영형태** · **과목 마스터** 선택형
- 수업형태 UI = `lesson_operation_type` · 원생수 UI = `capacity_per_time`
- Prime/Pick = **확장모드 완료** + 증빙 검수 배지 · 노출 편성 테이블 분리
- `youtube_url` — 상세등록 1개 (009)

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-07-04 | Notion 5장 2026-07 갱신 · 009 extended · study-room-ui 정합 |
