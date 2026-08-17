-- =============================================================================
-- study114 schema 044 — 공부방 사업장 상세주소
-- Apply AFTER 043_study_room_lesson_detail.sql
-- 저장 API도 동일 컬럼을 멱등으로 추가한다 (StudyRoomRegisterService).
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'study_rooms' AND COLUMN_NAME = 'address_line2'
);
SET @sql := IF(
  @col = 0,
  'ALTER TABLE study_rooms
     ADD COLUMN address_line2 VARCHAR(255) NULL
       COMMENT ''사업장 상세주소(동·호수, 선택)''
       AFTER address_text',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
