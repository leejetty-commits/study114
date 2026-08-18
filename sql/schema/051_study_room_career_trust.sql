-- =============================================================================
-- study114 schema 051 — 공부방 상세2: 출신대학·증빙
-- Apply AFTER 050_study_room_detail1_classes.sql
-- 런타임 StudyRoomRegisterService::ensureCareerTrustColumns 도 멱등 적용.
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'study_rooms' AND COLUMN_NAME = 'university_name'
);
SET @sql := IF(
  @col = 0,
  'ALTER TABLE study_rooms
     ADD COLUMN university_name VARCHAR(100) NULL
       COMMENT ''출신대학''
       AFTER academy_career_years',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'study_rooms' AND COLUMN_NAME = 'major_name'
);
SET @sql := IF(
  @col = 0,
  'ALTER TABLE study_rooms
     ADD COLUMN major_name VARCHAR(100) NULL
       COMMENT ''전공학과''
       AFTER university_name',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'study_rooms' AND COLUMN_NAME = 'business_registration_available'
);
SET @sql := IF(
  @col = 0,
  'ALTER TABLE study_rooms
     ADD COLUMN business_registration_available TINYINT(1) NULL
       COMMENT ''사업자등록증 보유''
       AFTER education_office_reg_no',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'study_rooms' AND COLUMN_NAME = 'other_proof_notes'
);
SET @sql := IF(
  @col = 0,
  'ALTER TABLE study_rooms
     ADD COLUMN other_proof_notes TEXT NULL
       COMMENT ''기타 증빙 내역 JSON 배열''
       AFTER business_registration_available',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
