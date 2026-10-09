# CUR-006 · AuthMailer 호출처 (Resend 단순화 후)

| 호출처 | 파일 | Resend 연결 | 비고 |
|--------|------|-------------|------|
| 가입 확인메일 | `EmailVerificationService` | **연결** | `email_sent` |
| 확인메일 재전송 | `EmailVerificationService` | **연결** | UI 3상태 |
| 비밀번호 재설정 | `PasswordResetService` | **연결** | |
| probe | `_mail-probe.php` | AuthMailer 공유 | 운영 실발송은 별도 승인 |
| 유료 리마인더 | `ProviderReminderService` | **제외** | 기본 `reminder_mail_excluded` Disabled |
| 카드 게시 환영 | `MemberLifecycleMailer` ← `BasicRegisterService::register` | **연결** | 기본등록으로 카드가 처음 노출될 때 1회 |
| Prime·Pick 구매 감사 | `MemberLifecycleMailer` ← `ProviderCheckoutService::completeOrder` | **연결** | 지급 커밋 뒤, 주문당 1회 |
| 탈퇴 완료 | `MemberLifecycleMailer` ← `AccountWithdrawService::withdraw` | **연결** | 본인 탈퇴만. 관리자 강제 탈퇴는 보내지 않음 |

생활 메일 3종은 `STUDY114_LIFECYCLE_MAIL=0`으로 끈다. 중복 방지는 `provider_reminder_dispatches`(dedupe_key `lifecycle:*`), 그 표가 없으면 보내지 않는다. 문안 `src/Mail/MemberLifecycleMailTemplate.php`, 검증 `php scripts/verify-mail-lifecycle.php` (기록: `docs/worklog/2026/10/2026-10-09-mail-lifecycle.md`).

회원 메일 본문(text + HTML)은 `src/Mail/MemberMailTemplate.php` 공통 틀을 쓴다 — 역할 배지·보내기 전용 바닥글·서명. 가입 확인 `EmailVerifyMailTemplate`, 재설정 `PasswordResetMailTemplate`. 검증: `php scripts/verify-auth-mail-warm.php` (기록: `docs/worklog/2026/10/2026-10-09-auth-mail-warm.md`).

자체 SMTP·카페24·`mail()` 없음. 기본 transport = Resend HTTPS API.
