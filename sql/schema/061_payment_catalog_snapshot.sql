-- =============================================================================
-- 061 — provider_payment_orders 카탈로그 버전·가격 스냅샷 (제안만 · 운영 미적용)
-- Apply AFTER 056_provider_account_context.sql
-- 운영 DB에는 수동 승인 전까지 적용하지 않는다.
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

SET @c1 := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'provider_payment_orders'
    AND COLUMN_NAME = 'catalog_version'
);
SET @s1 := IF(@c1 = 0,
  'ALTER TABLE provider_payment_orders
     ADD COLUMN catalog_version VARCHAR(32) NULL AFTER amount_won,
     ADD COLUMN list_price_won INT UNSIGNED NULL AFTER catalog_version,
     ADD COLUMN discount_won INT UNSIGNED NULL AFTER list_price_won,
     ADD COLUMN price_snapshot_json JSON NULL AFTER discount_won',
  'SELECT 1');
PREPARE ps1 FROM @s1; EXECUTE ps1; DEALLOCATE PREPARE ps1;
