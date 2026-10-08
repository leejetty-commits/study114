-- dev: @dev.local 계정 이메일 인증 완료 (E2E·로컬 행동 게이트)
-- ⚠ 로컬 Docker(study114_dev) 전용. 운영 DB에는 절대 적용하지 않는다.
USE study114;

UPDATE users
SET email_verified_at = COALESCE(email_verified_at, NOW()),
    updated_at = NOW()
WHERE email LIKE '%@dev.local'
  AND status = 'active';
