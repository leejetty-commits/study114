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
| student_subject_targets | §7-2 |

## DDL 순서

```bash
mysql -u root -p < sql/schema/001_init.sql
mysql -u root -p study114 < sql/schema/002_profile_signup_fields.sql   # 선택
mysql -u root -p study114 < sql/schema/004_member_ssot_align.sql     # 4장 정합
```

## 2장 UI ↔ DB

가입 폼 UI `name`은 2장 잠금 · DB는 4장 (`real_name`, `sms_opt_in` 등).  
매핑표: **4장 §5-1**

## 잠금 요약

- 학부모 기준 · `guardian_student`
- 공부방+과외 **동시 역할** · **화면은 역할 1개**
- 자녀 **N명** · **draft/published/hidden/deleted**
- 안전번호: 컬럼만 · UI 1차 비노출

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-05-31 | Notion 4장 원문 반영 |
