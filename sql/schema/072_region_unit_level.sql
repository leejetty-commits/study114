-- =============================================================================
-- 072 — regions 수준·공식코드·선택 단위
-- 기준: 행안부 법정동 2026-07-01. 기존 행의 이름·코드는 바꾸지 않는다.
-- 기존 행은 기본값으로 채워진다. unit_level=dong, is_selectable=0, official_code=NULL.
-- 시 대표 행은 그 기본값 그대로 두고, 정리는 다음 작업에서 한다.
-- Actions는 이 SQL을 실행하지 않는다. 운영 DB 적용은 사람이 한다.
-- 다음에 073_region_official_seed.sql 을 적용한다.
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

SET @c := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'regions' AND COLUMN_NAME = 'unit_level'
);
SET @s := IF(@c = 0,
  'ALTER TABLE regions ADD COLUMN unit_level ENUM(''sido'',''sigungu'',''dong'') NOT NULL DEFAULT ''dong'' COMMENT ''지역 수준. 기존 행은 dong'' AFTER dong_name',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @c := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'regions' AND COLUMN_NAME = 'official_code'
);
SET @s := IF(@c = 0,
  'ALTER TABLE regions ADD COLUMN official_code VARCHAR(10) NULL COMMENT ''법정동코드 10자리 (2026-07-01)'' AFTER unit_level',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @c := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'regions' AND COLUMN_NAME = 'is_selectable'
);
SET @s := IF(@c = 0,
  'ALTER TABLE regions ADD COLUMN is_selectable TINYINT(1) NOT NULL DEFAULT 0 COMMENT ''과외·학생 선택 단위'' AFTER official_code',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @n := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'regions'
    AND COLUMN_NAME = 'dong_code' AND IS_NULLABLE = 'NO'
);
SET @s := IF(@n > 0,
  'ALTER TABLE regions MODIFY dong_code VARCHAR(10) NULL COMMENT ''동 코드. 공식 시·구 행은 NULL''',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @i := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'regions' AND INDEX_NAME = 'uk_regions_official_code'
);
SET @s := IF(@i = 0,
  'ALTER TABLE regions ADD UNIQUE KEY uk_regions_official_code (official_code)',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @i := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'regions' AND INDEX_NAME = 'idx_regions_unit_selectable'
);
SET @s := IF(@i = 0,
  'ALTER TABLE regions ADD KEY idx_regions_unit_selectable (unit_level, is_selectable)',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;
