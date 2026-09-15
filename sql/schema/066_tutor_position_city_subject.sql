-- =============================================================================
-- 066 — 과외쌤 노출상품 축 (city_id + primary_subject_id)
-- Apply AFTER 065_provider_position_region_scope.sql
-- SSOT: 34-1 · 34 — 과외쌤은 재고가 아니라 시·주력과목 축. 공부방 Prime region 컬럼과 분리.
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

SET @c1 := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'provider_position_subscriptions'
    AND COLUMN_NAME = 'city_id'
);
SET @s1 := IF(@c1 = 0,
  'ALTER TABLE provider_position_subscriptions
     ADD COLUMN city_id BIGINT UNSIGNED NULL
       COMMENT ''과외쌤 노출축 시 (tutor_regions.region_id)'' AFTER slot_group,
     ADD COLUMN primary_subject_id BIGINT UNSIGNED NULL
       COMMENT ''과외쌤 주력과목 subject_masters.id'' AFTER city_id,
     ADD KEY idx_position_tutor_axis (
       sku_code, provider_type, city_id, primary_subject_id, end_exclusive_on
     )',
  'SELECT 1');
PREPARE ps1 FROM @s1; EXECUTE ps1; DEALLOCATE PREPARE ps1;
