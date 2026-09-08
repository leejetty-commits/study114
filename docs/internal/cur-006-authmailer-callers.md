# CUR-006 · AuthMailer 호출처 · ProviderReminder 영향

AuthMailer는 SMTP transport를 **공유**한다. SMTP 전환 시 아래 전 경로가 동일하게 fail-closed/성공 규칙을 따른다.

| 호출처 | 파일 | 용도 | SMTP 전환 영향 | 격리 메모 |
|--------|------|------|----------------|-----------|
| 가입 확인메일 | `EmailVerificationService` ← `signup.php` | 가입 직후 verify | **핵심** — `email_sent`에 직결 | CUR-006 주 대상 |
| 확인메일 재전송 | `EmailVerificationService` ← `send-verification.php` | 대기 화면 재전송 | 동일 | UI 3상태와 연동 |
| 비밀번호 재설정 | `PasswordResetService` | 복구 링크 | 동일 transport | 별도 쿨다운 |
| probe | `_mail-probe.php` | 운영자 점검 | `ok`=`send` 결과 | 승인 전 운영 실행 금지 |
| 유료 리마인더 | `ProviderReminderService` | 만료·소진 메일 | **동일 AuthMailer** | 트랜잭션 SMTP 권고 시 리마인더도 같은 채널. 카페24 사람함 혼용 시 한도·스팸 리스크 |
| (생성자 DI) | `ProviderReminderService::__construct(?AuthMailer)` | 테스트 주입 | Fake 주입 가능 | 단위 테스트 격리 OK |

## 격리 원칙 (이번 단계)

- 리마인더 전용 transport 분기는 **아직 구현하지 않음** (범위 초과).
- 운영 SMTP를 켜면 리마인더도 자동으로 같은 SMTP를 씀 → 제공자 선택 시 **유료 리마인더 적합성**을 함께 본다.
- 리마인더만 끄려면 추후 `paid` 설정 플래그 또는 별도 Mailer 주입이 필요 (미구현).

## 비호출

- OAuth / 탈퇴 / tombstone — AuthMailer 미사용
