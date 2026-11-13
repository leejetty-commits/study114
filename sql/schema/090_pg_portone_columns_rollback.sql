-- =============================================================================
-- 090 롤백 — 포트원 PG 메타 컬럼
-- 롤백 순서: 091 다음 이 파일(090).
-- Actions는 이 SQL을 실행하지 않는다.
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

SET @c := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'provider_payment_orders'
    AND INDEX_NAME = 'uk_payment_orders_pg_payment_id'
);
SET @s := IF(@c > 0,
  'ALTER TABLE provider_payment_orders DROP INDEX uk_payment_orders_pg_payment_id',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @c := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'provider_payment_orders'
    AND COLUMN_NAME = 'pg_payment_id'
);
SET @s := IF(@c > 0,
  'ALTER TABLE provider_payment_orders DROP COLUMN pg_payment_id',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @c := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'provider_refund_requests'
    AND COLUMN_NAME = 'pg_remaining_won'
);
SET @s := IF(@c > 0,
  'ALTER TABLE provider_refund_requests DROP COLUMN pg_remaining_won',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @c := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'provider_refund_requests'
    AND COLUMN_NAME = 'pg_cancel_amount_won'
);
SET @s := IF(@c > 0,
  'ALTER TABLE provider_refund_requests DROP COLUMN pg_cancel_amount_won',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @c := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'provider_refund_requests'
    AND COLUMN_NAME = 'pg_cancelled_at'
);
SET @s := IF(@c > 0,
  'ALTER TABLE provider_refund_requests DROP COLUMN pg_cancelled_at',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @c := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'provider_refund_requests'
    AND COLUMN_NAME = 'pg_cancel_id'
);
SET @s := IF(@c > 0,
  'ALTER TABLE provider_refund_requests DROP COLUMN pg_cancel_id',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;
