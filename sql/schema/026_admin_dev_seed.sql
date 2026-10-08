-- =============================================================================
-- study114 schema 026 — admin dev operator (A28 운영자 로컬 검증)
-- Apply AFTER 025_board_post_attachments.sql
--
-- ⚠ 로컬 Docker(study114_dev) 전용. 운영 DB에는 절대 적용하지 않는다.
--   비밀번호가 공개된 "password"이고 전화번호도 가짜다.
--   운영에 이미 들어간 행은 sql/ops/2026-10-09-delete-ops-dev-local.sql 로 지운다.
-- 코드에는 ops@dev.local 이메일로 등급을 주는 fallback이 없다.
--   등급(users.admin_level = 'sub_master')은 036_admin_level_and_must_change.sql
--   백필이 채운다(admin 역할·is_primary=1·active). 036 전에는 admin_level 컬럼이 없다.
-- =============================================================================

SET NAMES utf8mb4;

-- bcrypt for dev password "password" (Laravel test hash)
SET @pw := '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

INSERT INTO users (email, password_hash, status) VALUES
  ('ops@dev.local', @pw, 'active');

INSERT INTO user_profiles (user_id, real_name, gender, birth_date, phone, address_line1) VALUES
  (LAST_INSERT_ID(), '내부운영', 'male', '1985-01-01', '010-9999-0001', '내부');

INSERT INTO user_roles (user_id, role_type, is_primary, status)
SELECT id, 'admin', 1, 'active' FROM users WHERE email = 'ops@dev.local' LIMIT 1;
