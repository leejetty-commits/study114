# CUR-006 · AuthMailer 호출처 (Resend 단순화 후)

| 호출처 | 파일 | Resend 연결 | 비고 |
|--------|------|-------------|------|
| 가입 확인메일 | `EmailVerificationService` | **연결** | `email_sent` |
| 확인메일 재전송 | `EmailVerificationService` | **연결** | UI 3상태 |
| 비밀번호 재설정 | `PasswordResetService` | **연결** | |
| probe | `_mail-probe.php` | AuthMailer 공유 | 운영 실발송은 별도 승인 |
| 유료 리마인더 | `ProviderReminderService` | **제외** | 기본 `reminder_mail_excluded` Disabled |

회원 메일 본문(text + HTML)은 `src/Mail/MemberMailTemplate.php` 공통 틀을 쓴다 — 역할 배지·보내기 전용 바닥글·서명. 가입 확인 `EmailVerifyMailTemplate`, 재설정 `PasswordResetMailTemplate`. 검증: `php scripts/verify-auth-mail-warm.php` (기록: `docs/worklog/2026/10/2026-10-09-auth-mail-warm.md`).

자체 SMTP·카페24·`mail()` 없음. 기본 transport = Resend HTTPS API.
