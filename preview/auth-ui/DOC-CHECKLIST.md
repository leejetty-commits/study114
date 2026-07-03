# 인증/가입 UI — SSOT 검증 (2026-07-04)

**SSOT:** [2장](../../docs/ssot/02-registration-and-member-db.md) · [14장](../../docs/ssot/14-registration-input-flow.md)

## 프리뷰

- URL: http://localhost:5173
- 실행: `cd preview/auth-ui && npm run dev`

## 화면 ↔ SSOT 검증

| # | 화면 | 라우트 | SSOT | 상태 |
|---|------|--------|------|------|
| 1 | 로그인 | `#/login` | 2장 §3.1 | ✅ |
| 2 | 약관동의 | `#/signup/terms` | 2장 §3.2 · 14장 1단계 | ⚠️ `[임시]` UI |
| 3 | 회원 구분 | `#/signup/role` | 2장 §3.3 · 14장 3단계 | ✅ |
| 4 | 공통 가입 폼 | `#/signup/form` | 2장 §3.4 · 14장 2단계 | ✅ (생년월일·안전번호 미수집) |
| 5 | **역할별 기본등록** | `#/signup/basic` | **14장 §4** | ✅ 신규 |
| 6 | 가입 완료 | `#/signup/complete` | 14장 5~6단계 | ✅ |
| 7 | 아이디 찾기 | `#/find-id` | 2장 §3.6 | ⚠️ `[임시]` |
| 8 | 비밀번호 찾기 | `#/find-password` | 2장 §3.7 | ⚠️ `[임시]` |

## 14장 기본등록 체크리스트

### 학부모/학생 (`signup-basic.js`)
- [x] **학생 성별** · **출생연도** (`students.gender` · `students.birth_year`) — 13·11장
- [x] 희망 유형 · 지역(1항목+note) · 과목 · 학교급/학년
- [x] 희망 수업장소 · **수업형태(단독/그룹과외)** · 그룹구성 · **희망 수업인원** · 주횟수 · 1회시간 · 강의스타일(칩)
- [x] 수업예산 라벨 · 과외/공부방 컬럼 분기
- [x] 요청문 visibility (`private` / `paid_only`)
- [x] DB 필드명 표시 (`field-db-name`)

### 공부방
- [x] 대표지역 · 주력과목 · 학교급 · 가격 · 수업장소 · 운영형태 · **타임별 원생수** · 교육청등록

### 과외쌤
- [x] 표시명 · 활동 시 · 주력과목 · **학생구성(성별+수업인원)** · 월 과외비 · 산정방식 · 주/월 횟수 · 1회시간
- [x] 대학/전공/학적 · 경력구간 · 연령대 · 강의장소 · 주교재 · 스타일 배지

## 플로우

- [x] API 연동: `signup.php` · `basic-register.php` · `regions.php` · `login.php` (세션 쿠키)
- [x] 약관 → 역할 → 공통 폼 → **기본등록** → 완료 → 상세등록 CTA

## [임시]

| 항목 | 화면 |
|------|------|
| 약관동의 | signup-terms |
| 아이디/비밀번호 찾기 | find-id / find-password |
| 지역·과목 선택기 | region_id API 연동 · subject는 텍스트(후속) |
