-- =============================================================================
-- 065 — 공부방 Prime 지역별 재고 SSOT (선택 행정동|단지 단위 최대 3)
-- Apply AFTER 056_provider_account_context.sql
-- waitlist(009)와 동일 키: region_basis_type · region_id · complex_id · slot_group
-- 컬럼은 각각 존재 여부를 본다. region_basis_type만 있다고 나머지를 skip하지 않는다.
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

SET @c := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'provider_position_subscriptions'
    AND COLUMN_NAME = 'region_basis_type'
);
SET @s := IF(@c = 0,
  'ALTER TABLE provider_position_subscriptions
     ADD COLUMN region_basis_type ENUM(''dong'',''complex'') NULL
       COMMENT ''공부방 Prime 재고 키 기준''',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @c := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'provider_position_subscriptions'
    AND COLUMN_NAME = 'region_id'
);
SET @s := IF(@c = 0,
  'ALTER TABLE provider_position_subscriptions
     ADD COLUMN region_id BIGINT UNSIGNED NULL
       COMMENT ''행정동 regions.id (dong 기준)''',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @c := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'provider_position_subscriptions'
    AND COLUMN_NAME = 'complex_id'
);
SET @s := IF(@c = 0,
  'ALTER TABLE provider_position_subscriptions
     ADD COLUMN complex_id BIGINT UNSIGNED NULL
       COMMENT ''단지 complexes.id (complex 기준)''',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @c := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'provider_position_subscriptions'
    AND COLUMN_NAME = 'slot_group'
);
SET @s := IF(@c = 0,
  'ALTER TABLE provider_position_subscriptions
     ADD COLUMN slot_group VARCHAR(80) NULL
       COMMENT ''표시용 지역 라벨(SSOT 키 아님)''',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @c := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'provider_position_subscriptions'
    AND INDEX_NAME = 'idx_position_prime_region_scope'
);
SET @s := IF(@c = 0,
  'ALTER TABLE provider_position_subscriptions
     ADD KEY idx_position_prime_region_scope (
       sku_code, provider_type, region_basis_type, region_id, complex_id, end_exclusive_on
     )',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;
