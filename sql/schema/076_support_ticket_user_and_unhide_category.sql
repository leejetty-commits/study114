-- =============================================================================
-- 076 — 운영문의 회원 연결 + 유형 unhide_request
-- Actions는 이 SQL을 실행하지 않는다. 운영 phpMyAdmin에서 먼저 적용한다.
-- 미적용 시 접수·목록은 user_id 없이 기존 컬럼만 쓴다.
--
-- 되돌리기 (운영에서 076을 걷어낼 때만, 데이터 손실 주의):
--   UPDATE support_tickets SET category = 'other' WHERE category = 'unhide_request';
--   ALTER TABLE support_tickets DROP FOREIGN KEY fk_support_tickets_user;
--   ALTER TABLE support_tickets DROP INDEX idx_support_tickets_user;
--   ALTER TABLE support_tickets DROP COLUMN user_id;
--   ALTER TABLE support_tickets
--     MODIFY COLUMN category ENUM('bug','policy','account','other') NOT NULL;
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

SET @c1 := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'support_tickets'
    AND COLUMN_NAME = 'user_id'
);
SET @s1 := IF(@c1 = 0,
  'ALTER TABLE support_tickets
     ADD COLUMN user_id BIGINT UNSIGNED NULL
     COMMENT ''접수한 회원. 탈퇴·삭제 후에는 NULL''
     AFTER email,
     ADD KEY idx_support_tickets_user (user_id, status, id)',
  'SELECT 1');
PREPARE ps1 FROM @s1; EXECUTE ps1; DEALLOCATE PREPARE ps1;

SET @fk := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'support_tickets'
    AND CONSTRAINT_NAME = 'fk_support_tickets_user'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sfk := IF(@fk = 0,
  'ALTER TABLE support_tickets
     ADD CONSTRAINT fk_support_tickets_user
     FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL',
  'SELECT 1');
PREPARE psfk FROM @sfk; EXECUTE psfk; DEALLOCATE PREPARE psfk;

ALTER TABLE support_tickets
  MODIFY COLUMN category
  ENUM('bug','policy','account','other','unhide_request') NOT NULL;
