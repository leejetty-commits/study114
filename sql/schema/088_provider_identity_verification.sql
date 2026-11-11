-- =============================================================================
-- 088 — 공급자 쪽지 허용 본인인증 (포트원 V2 × KG 통합인증)
-- 저장 칸 5개만: ci_hash · verified_at · provider · tx_id · 이름
-- CI 원문·생년월일·휴대폰 컬럼 금지. SMS OTP(053)와 별층.
-- Actions는 SQL을 실행하지 않는다. 로컬 Docker(study114_dev)만 적용.
-- 탈퇴 시: AccountWithdrawService가 5칸을 NULL로 비워 UNIQUE를 풀어 재사용 가능.
-- =============================================================================

USE study114_dev;

SET NAMES utf8mb4;

SET @c1 := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_profiles'
    AND COLUMN_NAME = 'identity_ci_hash'
);
SET @s1 := IF(@c1 = 0,
  'ALTER TABLE user_profiles
     ADD COLUMN identity_ci_hash CHAR(64) NULL
       COMMENT ''CI HMAC-SHA256 hex. 원문 CI 비보관'' AFTER phone_verification_requested_at,
     ADD COLUMN identity_verified_at DATETIME NULL
       COMMENT ''본인인증 완료 시각'' AFTER identity_ci_hash,
     ADD COLUMN identity_provider VARCHAR(32) NULL
       COMMENT ''예: inicis_unified'' AFTER identity_verified_at,
     ADD COLUMN identity_tx_id VARCHAR(128) NULL
       COMMENT ''포트원 identityVerificationId'' AFTER identity_provider,
     ADD COLUMN identity_name VARCHAR(100) NULL
       COMMENT ''인증 성명'' AFTER identity_tx_id,
     ADD UNIQUE KEY uq_user_profiles_identity_ci_hash (identity_ci_hash)',
  'SELECT 1');
PREPARE ps1 FROM @s1; EXECUTE ps1; DEALLOCATE PREPARE ps1;
