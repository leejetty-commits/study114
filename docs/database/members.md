# 공통 회원 DB

> **SSOT 4장 최우선**  
> [ssot/04-member-db-and-role-profiles.md](../ssot/04-member-db-and-role-profiles.md)

## 핵심 테이블

| 테이블 | 4장 |
|--------|-----|
| users | §4 |
| user_profiles | §5 |
| user_roles | §6 |
| students | §7 |
| subject_masters | §3 · 5장 §5-1 |
| student_subject_targets | §7-1 |
| student_preferred_lesson_places | §7-1-1 |
| student_preferred_teaching_style_badges | §7-1-2 |

## DDL 순서

```bash
.\scripts\apply-schema-dev.ps1   # 001 → 002 → 003 → 004 → 005 → 006 → 007 → 008
```

## 잠금 요약 (2026-07)

- `students.school_name` · `sort_order` **없음** — `grade_level` / `school_track` · `created_at` 등록순
- visibility 2축: `request_summary_visibility` · `special_request_visibility` (`private` / `paid_only`)
- 수업형태: `lesson_format` (`one_on_one` / `group`) · 그룹 시 `student_gender_group` ([011](../../sql/schema/011_student_gender_group.sql))
- 화면 **희망 수업인원** = `preferred_student_count_group`
- 수업예산: `preferred_fee_amount` + `preferred_studyroom_fee_amount`

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-07-04 | Notion 4장 2026-07 갱신 반영 |
