-- =============================================================================
-- 068 — 운영문의 운영자 답변 (P17-07 내 문의 내역)
-- Actions는 이 SQL을 실행하지 않는다. 운영 phpMyAdmin에서 먼저 적용한다.
-- 미적용 시 목록 조회는 기존 컬럼만 쓰고, 답변 저장은 schema_missing으로 실패한다.
--
-- 1건당 최신 답변 1개. 다중 대화 스레드는 만들지 않는다.
-- 기존 행은 admin_reply_text / admin_replied_at NULL 유지.
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

SET @c1 := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'support_tickets'
    AND COLUMN_NAME = 'admin_reply_text'
);
SET @s1 := IF(@c1 = 0,
  'ALTER TABLE support_tickets
     ADD COLUMN admin_reply_text TEXT NULL
     COMMENT ''운영자가 사용자에게 보여주는 답변 본문''
     AFTER status',
  'SELECT 1');
PREPARE ps1 FROM @s1; EXECUTE ps1; DEALLOCATE PREPARE ps1;

SET @c2 := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'support_tickets'
    AND COLUMN_NAME = 'admin_replied_at'
);
SET @s2 := IF(@c2 = 0,
  'ALTER TABLE support_tickets
     ADD COLUMN admin_replied_at DATETIME NULL
     COMMENT ''운영자 마지막 답변 시각''
     AFTER admin_reply_text',
  'SELECT 1');
PREPARE ps2 FROM @s2; EXECUTE ps2; DEALLOCATE PREPARE ps2;
