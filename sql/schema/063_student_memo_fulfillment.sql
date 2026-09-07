-- =============================================================================
-- 063 — 학생 쪽지 수신 상태 · 주문 fulfillment 상태 (PR-B 보완)
-- 062를 고치지 않는다. 이미 적용된 062와 독립적으로 추가한다.
-- 운영 DB에는 수동 승인 전까지 적용하지 않는다.
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

-- 학생 쪽지 수신 스위치 (students 테이블이 있을 때만)
SET @t1 := (
  SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students'
);
SET @c1 := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students'
    AND COLUMN_NAME = 'memo_status'
);
SET @s1 := IF(@t1 > 0 AND @c1 = 0,
  'ALTER TABLE students
     ADD COLUMN memo_status ENUM(''open'',''paused'') NOT NULL DEFAULT ''open''
     COMMENT ''쪽지 수신 ON/OFF. exposure_status와 독립'' AFTER exposure_status',
  'SELECT 1');
PREPARE ps1 FROM @s1; EXECUTE ps1; DEALLOCATE PREPARE ps1;

-- 결제 상태(status)와 분리된 지급·발송 fulfillment
SET @c2 := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'provider_payment_orders'
    AND COLUMN_NAME = 'fulfillment_status'
);
SET @s2 := IF(@c2 = 0,
  'ALTER TABLE provider_payment_orders
     ADD COLUMN fulfillment_status ENUM(''none'',''pending'',''succeeded'',''failed'')
       NOT NULL DEFAULT ''none'' AFTER status,
     ADD COLUMN fulfillment_error VARCHAR(255) NULL AFTER fulfillment_status',
  'SELECT 1');
PREPARE ps2 FROM @s2; EXECUTE ps2; DEALLOCATE PREPARE ps2;
