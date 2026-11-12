-- =============================================================================
-- 087 롤백 — 학생 희망지역 추가 칸만 제거
-- preferred_region_note 는 지우지 않는다.
-- Actions는 이 SQL을 실행하지 않는다.
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

SET @c := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'students'
    AND CONSTRAINT_NAME = 'fk_students_tutor_region_extra' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @s := IF(@c > 0, 'ALTER TABLE students DROP FOREIGN KEY fk_students_tutor_region_extra', 'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @c := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'students'
    AND CONSTRAINT_NAME = 'fk_students_studyroom_region_extra' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @s := IF(@c > 0, 'ALTER TABLE students DROP FOREIGN KEY fk_students_studyroom_region_extra', 'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @c := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'students'
    AND CONSTRAINT_NAME = 'fk_students_studyroom_complex_extra' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @s := IF(@c > 0, 'ALTER TABLE students DROP FOREIGN KEY fk_students_studyroom_complex_extra', 'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @c := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND INDEX_NAME = 'idx_students_tutor_region_extra'
);
SET @s := IF(@c > 0, 'ALTER TABLE students DROP INDEX idx_students_tutor_region_extra', 'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @c := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND INDEX_NAME = 'idx_students_studyroom_region_extra'
);
SET @s := IF(@c > 0, 'ALTER TABLE students DROP INDEX idx_students_studyroom_region_extra', 'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @c := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND INDEX_NAME = 'idx_students_studyroom_complex_extra'
);
SET @s := IF(@c > 0, 'ALTER TABLE students DROP INDEX idx_students_studyroom_complex_extra', 'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @c := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'preferred_tutor_region_extra_id'
);
SET @s := IF(@c > 0, 'ALTER TABLE students DROP COLUMN preferred_tutor_region_extra_id', 'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @c := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'preferred_studyroom_region_extra_id'
);
SET @s := IF(@c > 0, 'ALTER TABLE students DROP COLUMN preferred_studyroom_region_extra_id', 'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @c := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'preferred_studyroom_complex_extra_id'
);
SET @s := IF(@c > 0, 'ALTER TABLE students DROP COLUMN preferred_studyroom_complex_extra_id', 'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @c := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'preferred_studyroom_region_extra_basis'
);
SET @s := IF(@c > 0, 'ALTER TABLE students DROP COLUMN preferred_studyroom_region_extra_basis', 'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;
