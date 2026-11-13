-- =============================================================================
-- 089 — 실시간 퀵매칭 공통 기반
-- 086 은 미머지 339, 088 은 미머지 365 가 예약. main 최신은 087.
-- Actions는 이 SQL을 실행하지 않는다. 운영 phpMyAdmin에서 먼저 적용한다.
-- 종현 2026-11-14: 선택조건 칸 1개, 운영 기록표 3개, thread_origin 승인.
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

SET @c := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'study_rooms'
    AND COLUMN_NAME = 'director_age_band'
);
SET @s := IF(@c = 0,
  'ALTER TABLE study_rooms
     ADD COLUMN director_age_band ENUM(''20s'',''30s'',''40s'',''50_plus'') NULL
     COMMENT ''원장 나이대. 매칭 전용, 카드·공개 화면 비노출''
     AFTER slogan',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @c := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students'
    AND COLUMN_NAME = 'preferred_director_age_bands'
);
SET @s := IF(@c = 0,
  'ALTER TABLE students
     ADD COLUMN preferred_director_age_bands SET(''20s'',''30s'',''40s'',''50_plus'') NULL
     COMMENT ''희망하는 원장샘 나이대. 다중, OR, 비우면 통과''
     AFTER prime_match_opt_in',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @c := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students'
    AND COLUMN_NAME = 'preferred_tutor_age_bands'
);
SET @s := IF(@c = 0,
  'ALTER TABLE students
     ADD COLUMN preferred_tutor_age_bands SET(''20s'',''30s'',''40s'',''50_plus'') NULL
     COMMENT ''희망하는 과외쌤 나이대. 다중, OR, 비우면 통과''
     AFTER preferred_director_age_bands',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @c := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students'
    AND COLUMN_NAME = 'quick_match_prefs'
);
SET @s := IF(@c = 0,
  'ALTER TABLE students
     ADD COLUMN quick_match_prefs SET(''sky'',''jjokjipge'',''grad_school'',''edu_office'',''franchise'') NULL
     COMMENT ''퀵매칭 선택 조건. 비우면 그 축은 통과''
     AFTER preferred_tutor_age_bands',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @c := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'message_threads'
    AND COLUMN_NAME = 'thread_origin'
);
SET @s := IF(@c = 0,
  'ALTER TABLE message_threads
     ADD COLUMN thread_origin ENUM(''general'',''quick_match'') NOT NULL DEFAULT ''general''
     COMMENT ''쪽지함 탭 구분''
     AFTER context_id',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @c := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'message_threads'
    AND INDEX_NAME = 'idx_message_threads_origin'
);
SET @s := IF(@c = 0,
  'ALTER TABLE message_threads ADD KEY idx_message_threads_origin (thread_origin)',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

CREATE TABLE IF NOT EXISTS quick_match_provider_settings (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  provider_type    ENUM('tutor','study_room') NOT NULL,
  provider_id      BIGINT UNSIGNED NOT NULL,
  user_id          BIGINT UNSIGNED NOT NULL,
  optional_toggles JSON NOT NULL COMMENT '{"sky":1,"teaching_style":0}',
  first_saved_at   DATETIME NULL,
  last_changed_at  DATETIME NULL COMMENT '주 1회 제한 기준',
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_qm_settings_provider (provider_type, provider_id),
  KEY idx_qm_settings_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quick_match_dispatches (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id       BIGINT UNSIGNED NOT NULL,
  provider_type    ENUM('tutor','study_room') NOT NULL,
  provider_id      BIGINT UNSIGNED NOT NULL,
  provider_user_id BIGINT UNSIGNED NOT NULL,
  thread_id        BIGINT UNSIGNED NULL,
  trigger_kind     ENUM('register','rematch') NOT NULL,
  sent_on          DATE NOT NULL COMMENT 'KST 날짜. 하루 20건 셈',
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_qm_dispatch_once (student_id, provider_type, provider_id),
  KEY idx_qm_dispatch_provider_day (provider_type, provider_id, sent_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quick_match_student_runs (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id    BIGINT UNSIGNED NOT NULL,
  trigger_kind  ENUM('register','rematch') NOT NULL,
  run_on        DATE NOT NULL COMMENT 'KST. 재매칭 학생당 하루 1회',
  matched_count INT UNSIGNED NOT NULL DEFAULT 0,
  sent_count    INT UNSIGNED NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_qm_runs_student_day (student_id, run_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
