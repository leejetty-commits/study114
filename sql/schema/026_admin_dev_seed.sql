-- =============================================================================
-- study114 schema 026 — admin dev operator (A28 운영자 로컬 검증)
-- Apply AFTER 025_board_post_attachments.sql
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
