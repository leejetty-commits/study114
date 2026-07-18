-- =============================================================================
-- study114 schema 036 — admin_level · must_change_password (운영 계정 발급)
-- Apply AFTER 035_content_config_definitions.sql · 032_admin_accounts_seed.sql
-- docs/internal/30-admin-account-provisioning.md
-- =============================================================================

SET NAMES utf8mb4;

ALTER TABLE users
  ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0
    COMMENT '임시비번 발급 후 강제 변경' AFTER password_hash,
  ADD COLUMN admin_level ENUM('super_admin', 'sub_master') NULL
    COMMENT 'NULL=비운영 · role_type=admin일 때만 의미' AFTER status;

-- bootstrap 최고관리자
UPDATE users
SET admin_level = 'super_admin',
    must_change_password = 0
WHERE email = 'jetty@naver.com';

-- 기존 admin 역할 · 등급 미설정 → 부마스터 (jetty 제외)
UPDATE users u
INNER JOIN user_roles r
  ON r.user_id = u.id
 AND r.role_type = 'admin'
 AND r.is_primary = 1
 AND r.status = 'active'
SET u.admin_level = 'sub_master'
WHERE u.admin_level IS NULL
  AND u.email <> 'jetty@naver.com';
