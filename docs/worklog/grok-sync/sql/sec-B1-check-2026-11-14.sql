-- B1 확인용 (읽기 전용). phpMyAdmin > study114 DB > SQL 탭.

-- 1) 실행 전: 아무것도 안 나와야 함. 실행 후: 1줄.
SHOW TABLES LIKE 'admin_console_auth';

-- 2) 실행 후: user_id, password_hash, fail_count, locked_until, updated_at 5줄
SHOW COLUMNS FROM admin_console_auth;

-- 3) 실행 후: users 쪽 id 형식 확인 (Type 이 bigint(20) unsigned 여야 FK 가 맞음)
SHOW COLUMNS FROM users LIKE 'id';
