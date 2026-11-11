-- =============================================================================
-- 088 rollback
-- 1) _088_backup_* 목록으로 inquiry_status 를 open 으로 복구
-- 2) identity 컬럼·인덱스 DROP
-- 3) 백업 테이블 DROP
-- Actions는 실행하지 않는다.
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- 1) 백업 목록으로 open 복구 (백업 테이블이 있을 때만)
-- ---------------------------------------------------------------------------
SET @bs := (
  SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '_088_backup_study_rooms_inquiry'
);
SET @us := IF(@bs > 0,
  'UPDATE study_rooms sr
      INNER JOIN _088_backup_study_rooms_inquiry b ON b.id = sr.id
       SET sr.inquiry_status = b.inquiry_status_was
     WHERE sr.inquiry_status = ''paused''',
  'SELECT ''088 rollback: study_rooms backup table missing — inquiry not restored'' AS migration_note');
PREPARE pus FROM @us; EXECUTE pus; DEALLOCATE PREPARE pus;

SET @bt := (
  SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '_088_backup_tutors_inquiry'
);
SET @ut := IF(@bt > 0,
  'UPDATE tutors t
      INNER JOIN _088_backup_tutors_inquiry b ON b.id = t.id
       SET t.inquiry_status = b.inquiry_status_was
     WHERE t.inquiry_status = ''paused''',
  'SELECT ''088 rollback: tutors backup table missing — inquiry not restored'' AS migration_note');
PREPARE put FROM @ut; EXECUTE put; DEALLOCATE PREPARE put;

-- ---------------------------------------------------------------------------
-- 2) identity 인덱스·컬럼 DROP
-- ---------------------------------------------------------------------------
SET @txu := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_profiles'
    AND INDEX_NAME = 'uq_user_profiles_identity_tx_id'
);
SET @dtx := IF(@txu > 0,
  'ALTER TABLE user_profiles DROP INDEX uq_user_profiles_identity_tx_id',
  'SELECT 1');
PREPARE pdtx FROM @dtx; EXECUTE pdtx; DEALLOCATE PREPARE pdtx;

SET @ciu := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_profiles'
    AND INDEX_NAME = 'uq_user_profiles_identity_ci_hash'
);
SET @dci := IF(@ciu > 0,
  'ALTER TABLE user_profiles DROP INDEX uq_user_profiles_identity_ci_hash',
  'SELECT 1');
PREPARE pdci FROM @dci; EXECUTE pdci; DEALLOCATE PREPARE pdci;

SET @c1 := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_profiles'
    AND COLUMN_NAME = 'identity_ci_hash'
);
SET @drop := IF(@c1 > 0,
  'ALTER TABLE user_profiles
     DROP COLUMN identity_name,
     DROP COLUMN identity_tx_id,
     DROP COLUMN identity_provider,
     DROP COLUMN identity_verified_at,
     DROP COLUMN identity_ci_hash',
  'SELECT 1');
PREPARE pdrop FROM @drop; EXECUTE pdrop; DEALLOCATE PREPARE pdrop;

-- ---------------------------------------------------------------------------
-- 3) 백업 테이블 정리
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS _088_backup_study_rooms_inquiry;
DROP TABLE IF EXISTS _088_backup_tutors_inquiry;

SELECT '088 rollback: inquiry restored from backup (if present); identity columns dropped' AS migration_note;
