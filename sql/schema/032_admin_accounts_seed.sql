-- =============================================================================
-- study114 schema 032 — A28 관리자 계정 seed (마스터/부마스터)
-- Apply AFTER 026_admin_dev_seed.sql
-- =============================================================================

SET NAMES utf8mb4;

SET @pw := '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

INSERT INTO users (email, password_hash, status)
SELECT 'jetty@naver.com', @pw, 'active'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'jetty@naver.com' LIMIT 1);

INSERT INTO user_profiles (user_id, real_name, gender, birth_date, phone, address_line1)
SELECT u.id, '마스터운영', 'male', '1980-01-01', '010-0000-0001', '내부'
FROM users u
WHERE u.email = 'jetty@naver.com'
  AND NOT EXISTS (SELECT 1 FROM user_profiles p WHERE p.user_id = u.id LIMIT 1)
LIMIT 1;

INSERT INTO user_roles (user_id, role_type, is_primary, status)
SELECT u.id, 'admin', 1, 'active'
FROM users u
WHERE u.email = 'jetty@naver.com'
  AND NOT EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = u.id AND r.role_type = 'admin' LIMIT 1)
LIMIT 1;

INSERT INTO users (email, password_hash, status)
SELECT 'ops2@dev.local', @pw, 'active'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'ops2@dev.local' LIMIT 1);

INSERT INTO user_roles (user_id, role_type, is_primary, status)
SELECT u.id, 'admin', 1, 'active'
FROM users u
WHERE u.email = 'ops2@dev.local'
  AND NOT EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = u.id AND r.role_type = 'admin' LIMIT 1)
LIMIT 1;

INSERT INTO users (email, password_hash, status)
SELECT 'ops3@dev.local', @pw, 'active'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'ops3@dev.local' LIMIT 1);

INSERT INTO user_roles (user_id, role_type, is_primary, status)
SELECT u.id, 'admin', 1, 'active'
FROM users u
WHERE u.email = 'ops3@dev.local'
  AND NOT EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = u.id AND r.role_type = 'admin' LIMIT 1)
LIMIT 1;
