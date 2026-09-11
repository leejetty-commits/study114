# 64 — 과외쌤 쪽지설정 상태 잠금

**기준일:** 2026-09-12  
**지위:** P21-05 저장·복원 정본. 레이아웃 문서가 아니다.

한 줄: *쪽지설정은 상태값 이름을 만드는 화면이 아니라, `tutors.inquiry_status`를 저장하고 다시 여는 화면이다.*

## 서버 SSOT

컬럼: `tutors.inquiry_status`  
DDL: `sql/schema/064_tutor_inquiry_status.sql`  
엔드포인트: `PATCH /api/registrations/tutors.php` `{ action: "inquiry_status", inquiry_status }`

| 값 | 제품 의미 | UI |
|---|---|---|
| `open` | 학부모 쪽지를 받는 중 | 배지 받는 중 · 수신 라디오 |
| `paused` | **잠시 쉼** — 일시 중단. 나중에 다시 열 수 있음 | 배지 안받음 · 이유 잠시 쉼 |
| `not_accepting` | **신규 학생 안 받음** — 신규 모집을 닫은 운영 상태. `paused`가 아니다 | 배지 안받음 · 이유 신규 학생 안 받음 |

`not_accepting`은 표시용 카피가 아니라 서버에 남는 값이다. 공부방 `capacity_full` / `waiting_only`를 쓰지 않는다.

배지 · 현재상태 저장값 문구 · 수신/이유 라디오 · 재진입 초기값은 **같은 `inquiry_status` 하나**만 본다. 카드 샘플 2장은 비교용이라 SSOT가 아니다.

## OTP

ON 저장 + 미검증 → OTP → **같은 `persistInquiryStatus`가 PATCH를 호출**한다. 검증만 하고 로컬에 남는 경로는 금지.

닫힘 저장 시 `paused` / `not_accepting`을 고르지 않으면 저장하지 않는다. 이유를 빼먹고 `paused`로 접히면 안 된다.

실패 코드:
- `phone_verify_required` → OTP 후 같은 persist
- `schema_missing` → 064 미적용. 화면은 마지막 서버값으로 되돌림
- `validation` → 저장 거부. 화면은 마지막 서버값으로 되돌림

## 배포 전 필수

GitHub Actions는 SQL을 실행하지 않는다.

1. 운영 phpMyAdmin에서 `064_tutor_inquiry_status.sql` 적용
2. 그 다음 `main` 배포 (FTP `public/` + `src/`)

미적용 시 저장 API는 `503 schema_missing`으로 실패한다. GET이 `paused`처럼 보여도 저장된 값이 아니다.

검증: `npm run verify:tutor-inquiries-settings`  
CI: `tutor-inquiries-gate.yml` + `deploy.yml` job `verify-tutor-inquiries`
