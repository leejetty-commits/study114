-- =============================================================================
-- study114 schema 067 — 공개/쪽지 분리 · 쪽지 기본값 open · 사업장 우편번호
-- 정본: 2026-09 공개≠쪽지≠Pick/Prime 정책 재정렬
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

-- 1) 쪽지 기본값 open (신규 생성만). 기존 행은 일괄 변경하지 않음.
ALTER TABLE study_rooms
  MODIFY COLUMN inquiry_status ENUM('open', 'paused', 'capacity_full', 'waiting_only')
    NOT NULL DEFAULT 'open'
    COMMENT '쪽지 수신 상태 (공개와 독립)';

-- 2) 사업장 우편번호 — 폼 address_zip 과 1:1
SET @col_zip := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'study_rooms' AND COLUMN_NAME = 'address_zip'
);
SET @sql_zip := IF(
  @col_zip = 0,
  'ALTER TABLE study_rooms ADD COLUMN address_zip VARCHAR(10) NULL COMMENT ''사업장 우편번호'' AFTER address_text',
  'SELECT 1'
);
PREPARE stmt_zip FROM @sql_zip;
EXECUTE stmt_zip;
DEALLOCATE PREPARE stmt_zip;

-- 3) 홍보지역 슬롯 우편번호 (재진입 복원)
SET @col_rz := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'study_room_regions'
    AND COLUMN_NAME = 'address_zip'
);
SET @sql_rz := IF(
  @col_rz = 0,
  'ALTER TABLE study_room_regions ADD COLUMN address_zip VARCHAR(10) NULL COMMENT ''홍보지역 우편번호'' AFTER region_basis_type',
  'SELECT 1'
);
PREPARE stmt_rz FROM @sql_rz;
EXECUTE stmt_rz;
DEALLOCATE PREPARE stmt_rz;
