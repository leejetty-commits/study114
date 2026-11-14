-- B1 관리자 콘솔 2차 비밀번호 저장 테이블 (092)
-- 실행: PR 머지·배포 뒤, 종현이 phpMyAdmin > study114 DB > SQL 탭에서 1회.
-- 먼저 sec-B1-check-2026-11-14.sql 의 1번으로 테이블이 없는지 확인.
-- 비밀번호 원문은 저장하지 않음. password_hash() 결과만 들어감.

CREATE TABLE IF NOT EXISTS admin_console_auth (
  user_id       BIGINT UNSIGNED NOT NULL,
  password_hash VARCHAR(255)    NOT NULL,
  fail_count    INT UNSIGNED    NOT NULL DEFAULT 0,
  locked_until  DATETIME        NULL,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_admin_console_auth_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
