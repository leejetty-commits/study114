-- =============================================================================
-- study114 schema 050 — 공부방 상세1: 소개 확장 · 수업 그룹
-- Apply AFTER 049_study_room_primary_audiences.sql
-- 런타임 StudyRoomLessonDetailStore::ensureSchema 도 멱등 적용.
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'study_rooms' AND COLUMN_NAME = 'monthly_fee_manwon'
);
SET @sql := IF(
  @col = 0,
  'ALTER TABLE study_rooms
     ADD COLUMN monthly_fee_manwon VARCHAR(32) NULL
       COMMENT ''월 평균 수업료(만원 서술)''
       AFTER price_amount',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'study_rooms' AND COLUMN_NAME = 'card_payment_available'
);
SET @sql := IF(
  @col = 0,
  'ALTER TABLE study_rooms
     ADD COLUMN card_payment_available TINYINT(1) NULL
       COMMENT ''카드결제 여부''
       AFTER one_on_one_available',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'study_rooms' AND COLUMN_NAME = 'cash_receipt_available'
);
SET @sql := IF(
  @col = 0,
  'ALTER TABLE study_rooms
     ADD COLUMN cash_receipt_available TINYINT(1) NULL
       COMMENT ''현금영수증 여부''
       AFTER card_payment_available',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'study_rooms' AND COLUMN_NAME = 'correction_available'
);
SET @sql := IF(
  @col = 0,
  'ALTER TABLE study_rooms
     ADD COLUMN correction_available TINYINT(1) NULL
       COMMENT ''첨삭식''
       AFTER cash_receipt_available',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS study_room_classes (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  study_room_id   BIGINT UNSIGNED NOT NULL,
  class_name      VARCHAR(255)    NOT NULL DEFAULT '' COMMENT '수업명',
  school_level    VARCHAR(32)     NULL COMMENT '대상(학교급)',
  grade_band      VARCHAR(64)     NULL COMMENT '학년',
  subject_name    VARCHAR(100)    NULL,
  subject_custom  VARCHAR(100)    NULL,
  attendance_days VARCHAR(32)     NULL COMMENT '출석요일 mon,tue,...',
  lessons_per_week SMALLINT UNSIGNED NULL COMMENT '주횟수',
  monthly_fee     VARCHAR(100)    NOT NULL DEFAULT '' COMMENT '월 수업료',
  fee_note        VARCHAR(255)    NOT NULL DEFAULT '' COMMENT '수업료 설명',
  lesson_note     TEXT            NULL COMMENT '수업 참고사항',
  sort_order      SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_src_room (study_room_id, sort_order),
  CONSTRAINT fk_src_room FOREIGN KEY (study_room_id) REFERENCES study_rooms (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='공부방 상세1 수업 그룹';
