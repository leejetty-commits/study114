# 과외쌤 DB

> **SSOT 8장 최우선**  
> [ssot/08-tutor-registration-db.md](../ssot/08-tutor-registration-db.md)

## 핵심 테이블

| 테이블 | 8장 |
|--------|-----|
| tutors | §4 |
| tutor_subject_targets | §5 |
| tutor_regions | §6 |
| tutor_lesson_places | §6-1 |
| tutor_images | §7 |
| tutor_teaching_style_badges | §7-1 |
| tutor_verification_documents | §8 |
| subject_masters | §3 · [003](../../sql/schema/003_subject_masters.sql) |

## DDL

```bash
.\scripts\apply-schema-dev.ps1   # … 008 → 010
```

## ENUM (DB code)

| 축 | code |
|----|------|
| student_gender_group | `male` · `female` · `mixed` |
| student_count_group | `solo` · `two` · `three` · `four_plus` |
| career_year_band | `y1_3` · `y4_6` · `y7_10` · `y10_plus` |
| university_status | `enrolled` · `leave` · `completed` · `graduated` |
| tutor lesson place | `student_home_visit` · `public_place` · `tutor_home` |
| age_band | `early_20s` … `over_50` |

## 잠금 요약 (2026-07)

- 표시명 = `tutor_display_name` (구 `display_name` 아님)
- 경력 = `career_year_band` (구 `career_years` 아님)
- **제출자료** = `proof_document_available` + `tutor_verification_documents` (저장·표시만 · [22장](../ssot/22-platform-lifecycle-principles.md))
- 카드 가격 = `preferred_fee_amount` + `lessons_per_week` + `minutes_per_lesson`

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-07-04 | Notion 8장 갱신 · 008/010 반영 |
