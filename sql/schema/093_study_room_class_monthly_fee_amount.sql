-- 093 — 공부방 수업 그룹 월 수업료(원)
-- 화면은 천원, DB는 원. monthly_fee VARCHAR는 그대로 둔다.
-- 운영에는 2026-11-18 종현이 백업·컬럼·id 26·34·39 UPDATE를 이미 실행했다.
-- 이 파일은 컬럼 추가 기록이다. 기존 행 UPDATE는 넣지 않는다.

SET NAMES utf8mb4;

SET @c := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'study_room_classes'
    AND COLUMN_NAME = 'monthly_fee_amount'
);
SET @sql := IF(
  @c = 0,
  'ALTER TABLE study_room_classes ADD COLUMN monthly_fee_amount INT UNSIGNED NULL COMMENT ''월 수업료(원)'' AFTER monthly_fee',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
