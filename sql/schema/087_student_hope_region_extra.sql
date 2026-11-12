-- =============================================================================
-- 087 — 학생 희망지역 추가 (본 지역과 같은 구조, 1개, 선택)
-- 086 은 미머지 339(086_pg_cancel_ops_log.sql), 088 은 미머지 365 가 쓰고 있어 087 을 쓴다.
-- Actions는 이 SQL을 실행하지 않는다. 운영 phpMyAdmin에서 먼저 적용한다.
-- preferred_region_note 는 지우지 않고, 이 칸으로 옮기지 않는다.
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

SET @c := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students'
    AND COLUMN_NAME = 'preferred_tutor_region_extra_id'
);
SET @s := IF(@c = 0,
  'ALTER TABLE students
     ADD COLUMN preferred_tutor_region_extra_id BIGINT UNSIGNED NULL
     COMMENT ''희망지역 추가(과외 시·군)''
     AFTER preferred_tutor_region_id',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @c := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students'
    AND COLUMN_NAME = 'preferred_studyroom_region_extra_id'
);
SET @s := IF(@c = 0,
  'ALTER TABLE students
     ADD COLUMN preferred_studyroom_region_extra_id BIGINT UNSIGNED NULL
     COMMENT ''희망지역 추가(공부방 동)''
     AFTER preferred_studyroom_region_id',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @c := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students'
    AND COLUMN_NAME = 'preferred_studyroom_complex_extra_id'
);
SET @s := IF(@c = 0,
  'ALTER TABLE students
     ADD COLUMN preferred_studyroom_complex_extra_id BIGINT UNSIGNED NULL
     COMMENT ''희망지역 추가(공부방 단지)''
     AFTER preferred_studyroom_complex_id',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @c := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students'
    AND COLUMN_NAME = 'preferred_studyroom_region_extra_basis'
);
SET @s := IF(@c = 0,
  'ALTER TABLE students
     ADD COLUMN preferred_studyroom_region_extra_basis ENUM(''dong'', ''complex'') NULL
     COMMENT ''희망지역 추가 기준: 행정동|아파트단지''
     AFTER preferred_studyroom_region_basis',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @c := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students'
    AND INDEX_NAME = 'idx_students_tutor_region_extra'
);
SET @s := IF(@c = 0,
  'ALTER TABLE students ADD KEY idx_students_tutor_region_extra (preferred_tutor_region_extra_id)',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @c := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students'
    AND INDEX_NAME = 'idx_students_studyroom_region_extra'
);
SET @s := IF(@c = 0,
  'ALTER TABLE students ADD KEY idx_students_studyroom_region_extra (preferred_studyroom_region_extra_id)',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @c := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students'
    AND INDEX_NAME = 'idx_students_studyroom_complex_extra'
);
SET @s := IF(@c = 0,
  'ALTER TABLE students ADD KEY idx_students_studyroom_complex_extra (preferred_studyroom_complex_extra_id)',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @c := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'students'
    AND CONSTRAINT_NAME = 'fk_students_tutor_region_extra' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @s := IF(@c = 0,
  'ALTER TABLE students
     ADD CONSTRAINT fk_students_tutor_region_extra
     FOREIGN KEY (preferred_tutor_region_extra_id) REFERENCES regions (id)',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @c := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'students'
    AND CONSTRAINT_NAME = 'fk_students_studyroom_region_extra' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @s := IF(@c = 0,
  'ALTER TABLE students
     ADD CONSTRAINT fk_students_studyroom_region_extra
     FOREIGN KEY (preferred_studyroom_region_extra_id) REFERENCES regions (id)',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @c := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'students'
    AND CONSTRAINT_NAME = 'fk_students_studyroom_complex_extra' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @s := IF(@c = 0,
  'ALTER TABLE students
     ADD CONSTRAINT fk_students_studyroom_complex_extra
     FOREIGN KEY (preferred_studyroom_complex_extra_id) REFERENCES complexes (id)',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;
