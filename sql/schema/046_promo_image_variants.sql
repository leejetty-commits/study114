-- =============================================================================
-- study114 schema 046 — 홍보사진 원본 + Prime/Basic 파생본
-- Apply AFTER 045_facility_masters_env.sql
-- 런타임 PromoImageService::ensureColumns 도 동일 컬럼을 멱등으로 추가한다.
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

-- study_room_images
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'study_room_images' AND COLUMN_NAME = 'original_path');
SET @sql := IF(@col = 0, 'ALTER TABLE study_room_images ADD COLUMN original_path VARCHAR(500) NULL COMMENT ''원본 경로'' AFTER image_path', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'study_room_images' AND COLUMN_NAME = 'prime_1280_path');
SET @sql := IF(@col = 0, 'ALTER TABLE study_room_images ADD COLUMN prime_1280_path VARCHAR(500) NULL AFTER original_path', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'study_room_images' AND COLUMN_NAME = 'prime_1600_path');
SET @sql := IF(@col = 0, 'ALTER TABLE study_room_images ADD COLUMN prime_1600_path VARCHAR(500) NULL AFTER prime_1280_path', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'study_room_images' AND COLUMN_NAME = 'basic_360_path');
SET @sql := IF(@col = 0, 'ALTER TABLE study_room_images ADD COLUMN basic_360_path VARCHAR(500) NULL AFTER prime_1600_path', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'study_room_images' AND COLUMN_NAME = 'basic_720_path');
SET @sql := IF(@col = 0, 'ALTER TABLE study_room_images ADD COLUMN basic_720_path VARCHAR(500) NULL AFTER basic_360_path', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'study_room_images' AND COLUMN_NAME = 'crop_offset_x');
SET @sql := IF(@col = 0, 'ALTER TABLE study_room_images ADD COLUMN crop_offset_x DECIMAL(6,4) NOT NULL DEFAULT 0.5000 AFTER basic_720_path', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'study_room_images' AND COLUMN_NAME = 'crop_offset_y');
SET @sql := IF(@col = 0, 'ALTER TABLE study_room_images ADD COLUMN crop_offset_y DECIMAL(6,4) NOT NULL DEFAULT 0.5000 AFTER crop_offset_x', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'study_room_images' AND COLUMN_NAME = 'original_width');
SET @sql := IF(@col = 0, 'ALTER TABLE study_room_images ADD COLUMN original_width SMALLINT UNSIGNED NULL AFTER crop_offset_y', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'study_room_images' AND COLUMN_NAME = 'original_height');
SET @sql := IF(@col = 0, 'ALTER TABLE study_room_images ADD COLUMN original_height SMALLINT UNSIGNED NULL AFTER original_width', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'study_room_images' AND COLUMN_NAME = 'original_bytes');
SET @sql := IF(@col = 0, 'ALTER TABLE study_room_images ADD COLUMN original_bytes INT UNSIGNED NULL AFTER original_height', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'study_room_images' AND COLUMN_NAME = 'original_mime');
SET @sql := IF(@col = 0, 'ALTER TABLE study_room_images ADD COLUMN original_mime VARCHAR(40) NULL AFTER original_bytes', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- tutor_images (동일 파생 스펙, 업로드 API는 후속)
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tutor_images' AND COLUMN_NAME = 'original_path');
SET @sql := IF(@col = 0, 'ALTER TABLE tutor_images ADD COLUMN original_path VARCHAR(500) NULL AFTER image_path', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tutor_images' AND COLUMN_NAME = 'prime_1280_path');
SET @sql := IF(@col = 0, 'ALTER TABLE tutor_images ADD COLUMN prime_1280_path VARCHAR(500) NULL AFTER original_path', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tutor_images' AND COLUMN_NAME = 'prime_1600_path');
SET @sql := IF(@col = 0, 'ALTER TABLE tutor_images ADD COLUMN prime_1600_path VARCHAR(500) NULL AFTER prime_1280_path', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tutor_images' AND COLUMN_NAME = 'basic_360_path');
SET @sql := IF(@col = 0, 'ALTER TABLE tutor_images ADD COLUMN basic_360_path VARCHAR(500) NULL AFTER prime_1600_path', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tutor_images' AND COLUMN_NAME = 'basic_720_path');
SET @sql := IF(@col = 0, 'ALTER TABLE tutor_images ADD COLUMN basic_720_path VARCHAR(500) NULL AFTER basic_360_path', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
