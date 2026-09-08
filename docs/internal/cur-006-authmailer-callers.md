# CUR-006 · AuthMailer 호출처 (Resend 단순화 후)

| 호출처 | 파일 | Resend 연결 | 비고 |
|--------|------|-------------|------|
| 가입 확인메일 | `EmailVerificationService` | **연결** | `email_sent` |
| 확인메일 재전송 | `EmailVerificationService` | **연결** | UI 3상태 |
| 비밀번호 재설정 | `PasswordResetService` | **연결** | |
| probe | `_mail-probe.php` | AuthMailer 공유 | 운영 실발송은 별도 승인 |
| 유료 리마인더 | `ProviderReminderService` | **제외** | 기본 `reminder_mail_excluded` Disabled |

자체 SMTP·카페24·`mail()` 없음. 기본 transport = Resend HTTPS API.
