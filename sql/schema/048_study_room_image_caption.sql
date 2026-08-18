-- =============================================================================
-- study114 schema 048 — 홍보사진 한 줄 제목
-- Apply AFTER 047_region_ensure_from_kakao.sql
-- 런타임 PromoImageService::ensureColumns 도 동일 컬럼을 멱등으로 추가한다.
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'study_room_images' AND COLUMN_NAME = 'caption');
SET @sql := IF(@col = 0, 'ALTER TABLE study_room_images ADD COLUMN caption VARCHAR(80) NULL COMMENT ''홍보사진 한 줄 제목'' AFTER original_filename', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
