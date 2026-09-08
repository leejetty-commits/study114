# CUR-006 · 미확인 세션에 의도적으로 OPEN인 API

인벤토리(`verify-cur-006-email-verify-inventory.mjs`)가 `OPEN*`으로 분류한 **7개** 엔드포인트.
가입 완료(`email_verified_at`) 전이라도 **자기 계정 확인·복구·연락처 보완·종료**에 필요하거나,
보호 기능(기본등록·쪽지·등록공개·유료·보드 쓰기)을 열지 않는 경로다.

관련: `GET /api/auth/me.php`는 `AuthSession::userIfActive`라 인벤토리 OPEN* 목록에는 안 잡히지만,
미확인 대기 화면용으로 `email_verified` 플래그를 내려주며 **허용(SSOT C-2)**.

| # | 엔드포인트 | 미확인 허용 이유 | 위험 검토 | 수정 |
|---|------------|------------------|-----------|------|
| 1 | `POST /api/auth/email/send-verification.php` | 확인메일 재전송. 대기 화면 필수. | 본인 `user_id`만. 타인 조회 없음. | 없음 |
| 2 | `POST /api/auth/password/change.php` | 로그인된 본인 비밀번호 변경(현재 비번 필요). 계정 복구·보안. | 본인만. 등록/쪽지/결제 미개방. | 없음 |
| 3 | `POST /api/auth/withdraw.php` | 회원탈퇴·계정 종료. 미확인 상태에서도 탈퇴 가능해야 함. | 본인 세션만. tombstone. | 없음 |
| 4 | `GET·POST /api/auth/account-contact.php` | OAuth 스텁의 실메일·휴대폰 보완, 본인 연락처 플래그. 확인메일 전제. | GET은 본인 플래그만. POST는 본인 phone/email. 타인 조회 API 없음. 회원 간 비공개. 등록 완료·허브 publish 아님. | 없음 |
| 5 | `POST /api/auth/phone/send-otp.php` | 본인 휴대폰 OTP 발송 준비. | 세션 `user_id`의 프로필 번호만. 타인 번호 지정 입력 없음. | 없음 |
| 6 | `POST /api/auth/phone/verify-otp.php` | 본인 OTP 검증. | 위와 동일. `phone_verified_at`만. 가입완료·공개 게이트와 분리. | 없음 |
| 7 | `GET·PATCH /api/auth/profile.php` | 사이트 **표시명**만. 로그인 이메일 변경 거부. | 본인 표시명. 기본등록·보드·쪽지·유료 미개방. 이메일 키 요청 시 422. | 없음 |

## 결론

- 7개 모두 **자기 계정 확인·연락처/휴대폰 인증 준비·복구·탈퇴** 범위.
- 타인 정보 조회, 등록 완료 우회, 보호 API 대용 경로로 보이지 않음.
- 이번 단계에서 서버 게이트 추가 **불필요** (코드 변경 없음).
