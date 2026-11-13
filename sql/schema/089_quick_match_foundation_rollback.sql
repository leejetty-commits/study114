-- =============================================================================
-- 089 롤백 — 실시간 퀵매칭 공통 기반
-- Actions는 이 SQL을 실행하지 않는다.
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

DROP TABLE IF EXISTS quick_match_student_runs;
DROP TABLE IF EXISTS quick_match_dispatches;
DROP TABLE IF EXISTS quick_match_provider_settings;

SET @c := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'message_threads'
    AND INDEX_NAME = 'idx_message_threads_origin'
);
SET @s := IF(@c > 0,
  'ALTER TABLE message_threads DROP INDEX idx_message_threads_origin',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @c := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'message_threads'
    AND COLUMN_NAME = 'thread_origin'
);
SET @s := IF(@c > 0,
  'ALTER TABLE message_threads DROP COLUMN thread_origin',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @c := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students'
    AND COLUMN_NAME = 'quick_match_prefs'
);
SET @s := IF(@c > 0,
  'ALTER TABLE students DROP COLUMN quick_match_prefs',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @c := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students'
    AND COLUMN_NAME = 'preferred_tutor_age_bands'
);
SET @s := IF(@c > 0,
  'ALTER TABLE students DROP COLUMN preferred_tutor_age_bands',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @c := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students'
    AND COLUMN_NAME = 'preferred_director_age_bands'
);
SET @s := IF(@c > 0,
  'ALTER TABLE students DROP COLUMN preferred_director_age_bands',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @c := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'study_rooms'
    AND COLUMN_NAME = 'director_age_band'
);
SET @s := IF(@c > 0,
  'ALTER TABLE study_rooms DROP COLUMN director_age_band',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;
