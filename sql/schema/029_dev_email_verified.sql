-- dev: @dev.local 계정 이메일 인증 완료 (E2E·로컬 행동 게이트)
USE study114;

UPDATE users
SET email_verified_at = COALESCE(email_verified_at, NOW()),
    updated_at = NOW()
WHERE email LIKE '%@dev.local'
  AND status = 'active';
