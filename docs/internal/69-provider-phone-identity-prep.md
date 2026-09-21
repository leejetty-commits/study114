# 69. 공급자 가입단계 휴대폰 본인확인 준비

가입단계 본인확인은 SMS OTP가 아니다. 이 문서는 업체 연동 전에 서버에 남겨 둔 자리와, `required`로 올리기 전에 닫혀야 하는 조건만 적는다.

상위 정본: Notion `공급자 휴대폰 검증·본인확인·문자 발송사 비교 정본`.

## 지금 상태

- 운영 모드 기본값은 `off`다. 환경변수를 바꾸기 전에는 가입 화면이 바뀌지 않는다.
- `STUDY114_PHONE_IDENTITY_MODE=warn`이면 공부방·과외쌤만, 이메일 확인 다음·기본등록 직전에 안내 화면이 뜬다. `계속`은 완료로 기록하지 않으며 기본등록을 막지 않는다.
- `required`를 환경값으로 넣어도 이번 코드는 차단하지 않고 `warn`으로 내린다.
- 업체 시크릿, SDK, 시작 URL, 샌드박스 자격은 저장소에 없다. `인증하기`는 `vendor_not_configured`만 반환한다.
- 완료 기록은 `POST /api/auth/phone-identity/callback.php`의 HMAC 서명이 맞을 때만 한다.

## OTP와 분리

아래는 쪽지 수신 확인용이다. 가입단계 본인확인 완료로 쓰지 않는다.

- `PhoneOtpSmsSender`, `PhoneVerificationService`
- `public/api/auth/phone/send-otp.php`, `verify-otp.php`
- `sql/schema/053_phone_verification_otp.sql`의 `sms_otp`
- `preview/home-ui/src/study-room-reg/phone-verify-gate.js`
- `me.phone_verified`

PR #26 / `cur-007-provider-identity`의 인증번호 입력 화면은 재사용하지 않는다.

## 서버 저장값

`sql/schema/069_provider_phone_identity.sql`을 운영 DB에 적용한 뒤에만 완료 시각을 남길 수 있다. Actions는 이 SQL을 실행하지 않는다.

| 컬럼 | 의미 |
|---|---|
| `phone_identity_verified_at` | 업체 콜백 성공 시각 |
| `phone_identity_phone` | 그 시점의 번호. 현재 `phone`과 같아야 완료 |
| `phone_identity_method` | `niceid` / `kmc` / `pass` / `pg_partner` |
| `phone_identity_tx_id` | 업체 거래 식별자 |

`sms_otp`는 method로 인정하지 않는다. CI/DI 컬럼은 두지 않는다. 업체 계약에서 보관 목적과 기간이 정해진 뒤에만 별도 컬럼을 연다.

## 환경값

모두 비어 있으면 연동 없음이다. 값 본문은 커밋하지 않는다.

- `STUDY114_PHONE_IDENTITY_MODE` — `off` / `warn` / `required`
- `STUDY114_PHONE_IDENTITY_VENDOR` — `niceid` / `kmc` / `pass` / `pg_partner`
- `STUDY114_PHONE_IDENTITY_CALLBACK_SECRET` — 콜백 HMAC
- `STUDY114_PHONE_IDENTITY_START_URL` — `https://` 업체 시작 주소

## warn에서 required로 올리는 조건

아래가 모두 끝나기 전에는 `basic-register.php`에 공급자 거부를 넣지 않는다.

1. 업체가 PG/제휴형, 통합연동, 독립 본인확인사 중 하나로 계약된다.
2. 샌드박스에서 시작 URL로 나갔다가 서명된 콜백이 돌아온다.
3. 콜백이 완료 시각, 번호, method, 거래 식별자를 서버에 남긴다. 브라우저 완료 선언은 없다.
4. 같은 번호의 재진입은 안내를 생략한다.
5. 학생·학부모 가입과 쪽지설정 OTP는 그대로다.
6. 운영 테스트 계정으로 `study114.net`에서 한 번 왕복한다.
7. 그 다음에만 신규 공급자 `required`를 검토한다. 번호 변경 UI는 계정설정 작업으로 따로 연다.
