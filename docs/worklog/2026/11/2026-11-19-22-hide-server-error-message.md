# 22 서버 오류 원문 숨김

- 기준: `origin/main` `8d852e76` (PR #275)
- 2026-11-19. 허용 파일에서 일반 `Throwable`이 응답으로 내보내던 예외 원문만 고정 문장으로 바꿨다. 검증·권한·인증메일 문구는 그대로다.

고정 문장: `일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.`

## 바꾼 응답

- `public/api/auth/oauth/start.php`: `InvalidArgumentException`은 기존 문구. 그 외는 `소셜 로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.` 기존 `error_log`는 유지.
- `src/Paid/PaidApi.php`: `RuntimeException` 메시지가 `PaidCheckoutGate::CLOSED_MESSAGE`와 같으면 그대로. 그 외 `server_error`는 고정 문장, `error_log('[paid] ')` 추가. 코드와 HTTP 상태는 그대로.
- `src/Paid/ProviderCheckoutService.php` 628·652 응답: `InvalidArgumentException`이면 `fulfillment_error`에 기존 문구. 그 외는 고정 문장과 `error_log`. `markFulfillment` 원문은 유지.
- `src/Admin/AdminMemberDeleteService.php` 일괄 삭제: `InvalidArgumentException`은 기존 문구. 그 외는 고정 문장과 `error_log('[member-delete] ')`.
- regions, signup, withdraw, attachments, region-stats, search, study-room register, AdminApi, HandoffApi, ProviderReviewApi, SupportApi의 일반 `Throwable` `message`만 고정 문장. withdraw에 `error_log('[withdraw] ')`를 추가했다.

## 확인

- 수정한 PHP 15개 `php -l` 통과.
- `scripts/verify-soft-error.php` 37 PASS.
- `scripts/verify-paid-conflict-auto-cancel.php` pass=11 fail=0.
- `scripts/verify-paid-complete-gate.php`의 거절 경로는 결제 불가 문구를 그대로 던진다. MySQL 구간은 이 worktree에 `config/database.php`가 없어 실행하지 못했다.
- PaidApi 직접 호출: 결제 불가 문구는 `server_error`로 유지, 다른 `RuntimeException`은 고정 문장, `InvalidArgumentException`은 422 검증 문구.

머지 커밋과 Deploy run 번호는 머지 뒤에 생긴다.
