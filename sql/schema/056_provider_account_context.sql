-- =============================================================================
-- 056 — 주문·포지션에 계정 문맥(provider) 강제
-- 정책: 공부방 계정 ≠ 과외쌤 계정 (같은 사람 ≠ 같은 계정 아님)
-- Hot 공유·방/쌤 fallback 금지
-- Apply AFTER 031 · 055
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

-- 결제 주문: 구매 시점부터 대상 고정
SET @c1 := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'provider_payment_orders'
    AND COLUMN_NAME = 'provider_type'
);
SET @s1 := IF(@c1 = 0,
  'ALTER TABLE provider_payment_orders
     ADD COLUMN provider_type ENUM(''study_room'',''tutor'') NULL AFTER product_kind,
     ADD COLUMN provider_id BIGINT UNSIGNED NULL AFTER provider_type,
     ADD KEY idx_payment_orders_provider (provider_type, provider_id)',
  'SELECT 1');
PREPARE ps1 FROM @s1; EXECUTE ps1; DEALLOCATE PREPARE ps1;

-- Prime/Pick 기간형: 계정 문맥별 독립
SET @c2 := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'provider_position_subscriptions'
    AND COLUMN_NAME = 'provider_type'
);
SET @s2 := IF(@c2 = 0,
  'ALTER TABLE provider_position_subscriptions
     ADD COLUMN provider_type ENUM(''study_room'',''tutor'') NULL AFTER user_id,
     ADD COLUMN provider_id BIGINT UNSIGNED NULL AFTER provider_type,
     ADD KEY idx_position_provider (provider_type, provider_id, end_exclusive_on)',
  'SELECT 1');
PREPARE ps2 FROM @s2; EXECUTE ps2; DEALLOCATE PREPARE ps2;
