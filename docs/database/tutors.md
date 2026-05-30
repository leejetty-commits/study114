# 과외쌤 DB

> **SSOT 4장 §7이 최우선.**  
> [ssot/04-member-db-and-role-profiles.md](../ssot/04-member-db-and-role-profiles.md#7-tutors--과외쌤-프로필-1차-잠금--ddl-todo)

개념 잠금: [ssot/02-registration-and-member-db.md](../ssot/02-registration-and-member-db.md) §7

---

## 상태

| 항목 | 내용 |
|------|------|
| `001_init.sql` | tutors 테이블 **미포함** |
| `user_roles.tutor` | enum만 예약 |
| DDL | `003_tutors.sql` **작성 예정** |

## 1차 방침 (2장 잠금)

- 등록 + 기본 검색 **포함**
- 홈 핵심 = **공부방 우선**
- 지역 = 단지 우선 / 없으면 동

## 2장 잠금 필드 (요약)

표시명 · 소개 · 희망지역 · 과외형태 · 수업장소 · 대상 · 주력과목 · 경력 · 학원경력 · 수업횟수/시간 · 희망 과외비 · 지도스타일 · 연락시간 · 증빙 · 사진 · 특징

→ 컬럼안: **4장 §7**

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-05-31 | SSOT 4장 §7 연동 |
