-- =============================================================================
-- 055가 이미 status 없이 적용된 환경용 멱등 보강
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

-- status
SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'provider_paid_badges'
    AND COLUMN_NAME = 'status'
);
SET @sql := IF(@col = 0,
  'ALTER TABLE provider_paid_badges
     ADD COLUMN status ENUM(''active'',''revoked'') NOT NULL DEFAULT ''active'' AFTER badge_code',
  'SELECT ''status exists''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- revoked_at
SET @col2 := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'provider_paid_badges'
    AND COLUMN_NAME = 'revoked_at'
);
SET @sql2 := IF(@col2 = 0,
  'ALTER TABLE provider_paid_badges ADD COLUMN revoked_at DATETIME NULL AFTER created_at',
  'SELECT ''revoked_at exists''');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;
