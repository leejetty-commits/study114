-- =============================================================================
-- study114 schema 043 — 공부방 상세정보 수업요일·가격 행
-- Apply AFTER 042_user_recommendations.sql
-- 닷홈: 저장 API가 동일 DDL을 멱등으로 적용한다 (StudyRoomLessonDetailStore).
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

-- 1) study_rooms 확장 컬럼
SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'study_rooms' AND COLUMN_NAME = 'lesson_extra_json'
);
SET @sql := IF(
  @col = 0,
  'ALTER TABLE study_rooms
     ADD COLUMN lesson_extra_json TEXT NULL
       COMMENT ''수업요일·지도스타일·가격행 JSON''
       AFTER price_description',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'study_rooms' AND COLUMN_NAME = 'attendance_days'
);
SET @sql := IF(
  @col = 0,
  'ALTER TABLE study_rooms
     ADD COLUMN attendance_days VARCHAR(32) NULL
       COMMENT ''출석일 mon,tue,...''
       AFTER teaching_style',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'study_rooms' AND COLUMN_NAME = 'lessons_per_week'
);
SET @sql := IF(
  @col = 0,
  'ALTER TABLE study_rooms
     ADD COLUMN lessons_per_week SMALLINT UNSIGNED NULL
       COMMENT ''주 수업 일수''
       AFTER attendance_days',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'study_rooms' AND COLUMN_NAME = 'minutes_per_lesson'
);
SET @sql := IF(
  @col = 0,
  'ALTER TABLE study_rooms
     ADD COLUMN minutes_per_lesson SMALLINT UNSIGNED NULL
       COMMENT ''1일 수업 분''
       AFTER lessons_per_week',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'study_rooms' AND COLUMN_NAME = 'lesson_note'
);
SET @sql := IF(
  @col = 0,
  'ALTER TABLE study_rooms
     ADD COLUMN lesson_note TEXT NULL
       COMMENT ''수업참고사항''
       AFTER minutes_per_lesson',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'study_rooms' AND COLUMN_NAME = 'teaching_style_ids'
);
SET @sql := IF(
  @col = 0,
  'ALTER TABLE study_rooms
     ADD COLUMN teaching_style_ids VARCHAR(255) NULL
       COMMENT ''지도스타일 id 쉼표구분''
       AFTER teaching_style',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'study_rooms' AND COLUMN_NAME = 'teaching_style_note'
);
SET @sql := IF(
  @col = 0,
  'ALTER TABLE study_rooms
     ADD COLUMN teaching_style_note VARCHAR(500) NULL
       COMMENT ''지도스타일 서술''
       AFTER teaching_style_ids',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2) 가격 행 (추가/삭제)
CREATE TABLE IF NOT EXISTS study_room_price_items (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  study_room_id BIGINT UNSIGNED NOT NULL,
  item_label    VARCHAR(255)    NOT NULL DEFAULT '' COMMENT '수업내역',
  monthly_fee   VARCHAR(100)    NOT NULL DEFAULT '' COMMENT '월 수업료(서술)',
  fee_note      VARCHAR(255)    NOT NULL DEFAULT '' COMMENT '수업료 설명',
  sort_order    SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_srpi_room (study_room_id, sort_order),
  CONSTRAINT fk_srpi_room FOREIGN KEY (study_room_id) REFERENCES study_rooms (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='공부방 상세정보 가격 행';
