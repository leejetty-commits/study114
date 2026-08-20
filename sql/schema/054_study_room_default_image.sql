-- 054: 공부방 카드 시스템 기본 이미지 플래그
SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'study_room_images'
    AND COLUMN_NAME = 'is_system_default'
);
SET @sql := IF(
  @col = 0,
  'ALTER TABLE study_room_images ADD COLUMN is_system_default TINYINT(1) NOT NULL DEFAULT 0 COMMENT ''시스템 기본 카드 이미지'' AFTER caption',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
