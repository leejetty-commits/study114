# 인증/가입 UI — SSOT 검증 (2026-05-31)

**SSOT:** [docs/ssot/02-registration-and-member-db.md](../../docs/ssot/02-registration-and-member-db.md)

## 프리뷰

- URL: http://localhost:5173
- 실행: `cd preview/auth-ui && npm run dev`

## 7화면 ↔ 2장 1:1 검증

| # | 화면 | 라우트 | SSOT | 상태 |
|---|------|--------|------|------|
| 1 | 로그인 | `#/login` | §3.1 | ✅ 잠금 일치 |
| 2 | 약관동의 | `#/signup/terms` | §3.2 | ⚠️ `[임시]` UI 표시 |
| 3 | 회원 구분 | `#/signup/role` | §3.3 | ✅ 잠금 일치 |
| 4 | 공통 가입 폼 | `#/signup/form` | §3.4 | ✅ 11필드 일치 |
| 5 | 가입 완료 | `#/signup/complete` | §3.5 | ✅ 잠금 일치 |
| 6 | 아이디 찾기 | `#/find-id` | §3.6 | ⚠️ `[임시]` UI 표시 |
| 7 | 비밀번호 찾기 | `#/find-password` | §3.7 | ⚠️ `[임시]` UI 표시 |

## 잠금 항목 체크리스트

### 플로우
- [x] 약관동의 → 회원 구분 → 공통 폼 → 가입 완료
- [x] 역할 전용 필드 공통 폼 미포함

### 회원 구분
- [x] 학생(학부모) / 공부방 / 과외쌤

### 공통 가입 폼 (11필드)
- [x] email · password · password_confirm · name · gender · birth_date · phone · address
- [x] sms_consent · email_consent · safe_number_use

### 로그인
- [x] email · password (라벨: 이메일(ID))

## [임시] 표시 (코드)

| 항목 | 플래그 | 화면 |
|------|--------|------|
| 약관동의 | `TERMS_TEMP` | signup-terms |
| 아이디 찾기 | `FIND_ID_TEMP` | find-id |
| 비밀번호 찾기 | `FIND_PASSWORD_TEMP` | find-password |

SSOT 잠금 확정 시 플래그 `false` + `temp-notice` 제거.

## DB 동기화

- [docs/database/members.md](../../docs/database/members.md) — 2장 컬럼 반영
- [sql/schema/002_profile_signup_fields.sql](../../sql/schema/002_profile_signup_fields.sql) — DDL 초안

`001_init.sql` 단독과 불일치 → **002 적용 필수** (문서 기준).
