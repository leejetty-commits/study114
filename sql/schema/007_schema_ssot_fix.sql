-- =============================================================================
-- study114 schema 007 — SSOT 4·5장 불일치 보정
-- Apply AFTER 001~006 on study114_dev (Docker MySQL 8.4)
--
-- Usage:
--   docker cp sql/schema/007_schema_ssot_fix.sql study114-mysql-dev:/tmp/
--   docker exec study114-mysql-dev sh -c "mysql -uroot -pstudy114dev --default-character-set=utf8mb4 study114_dev < /tmp/007_schema_ssot_fix.sql"
-- =============================================================================

USE study114_dev;

-- ---------------------------------------------------------------------------
-- user_roles — 4장 §6: granted_at → created_at
-- ---------------------------------------------------------------------------
ALTER TABLE user_roles
  CHANGE COLUMN granted_at created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ---------------------------------------------------------------------------
-- user_profiles — 4장 §5: 001 잔존 home_* / activity_* 제거
-- ---------------------------------------------------------------------------
ALTER TABLE user_profiles
  DROP FOREIGN KEY fk_user_profiles_home_region,
  DROP FOREIGN KEY fk_user_profiles_home_complex,
  DROP FOREIGN KEY fk_user_profiles_activity_region,
  DROP FOREIGN KEY fk_user_profiles_activity_complex;

ALTER TABLE user_profiles
  DROP INDEX idx_user_profiles_home_region,
  DROP INDEX idx_user_profiles_home_complex,
  DROP INDEX idx_user_profiles_activity_region,
  DROP INDEX idx_user_profiles_activity_complex;

ALTER TABLE user_profiles
  DROP COLUMN home_region_id,
  DROP COLUMN home_complex_id,
  DROP COLUMN home_address_detail,
  DROP COLUMN activity_region_id,
  DROP COLUMN activity_complex_id,
  DROP COLUMN activity_address_detail;
