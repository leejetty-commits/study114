-- =============================================================================
-- 088 rollback — 공급자 본인인증 컬럼·인덱스만 제거
-- 주의: 088에서 수행한 inquiry_status open→paused 전환은 되돌리지 않는다.
--       (paused로 바뀐 기존 행을 open으로 복구하지 않음. 기본값도 수동 판단.)
-- Actions는 실행하지 않는다.
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

SET @txu := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_profiles'
    AND INDEX_NAME = 'uq_user_profiles_identity_tx_id'
);
SET @dtx := IF(@txu > 0,
  'ALTER TABLE user_profiles DROP INDEX uq_user_profiles_identity_tx_id',
  'SELECT 1');
PREPARE pdtx FROM @dtx; EXECUTE pdtx; DEALLOCATE PREPARE pdtx;

SET @ciu := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_profiles'
    AND INDEX_NAME = 'uq_user_profiles_identity_ci_hash'
);
SET @dci := IF(@ciu > 0,
  'ALTER TABLE user_profiles DROP INDEX uq_user_profiles_identity_ci_hash',
  'SELECT 1');
PREPARE pdci FROM @dci; EXECUTE pdci; DEALLOCATE PREPARE pdci;

SET @c1 := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_profiles'
    AND COLUMN_NAME = 'identity_ci_hash'
);
SET @drop := IF(@c1 > 0,
  'ALTER TABLE user_profiles
     DROP COLUMN identity_name,
     DROP COLUMN identity_tx_id,
     DROP COLUMN identity_provider,
     DROP COLUMN identity_verified_at,
     DROP COLUMN identity_ci_hash',
  'SELECT 1');
PREPARE pdrop FROM @drop; EXECUTE pdrop; DEALLOCATE PREPARE pdrop;

SELECT '088 rollback: identity columns/indexes dropped; inquiry paused rows NOT restored' AS migration_note;
