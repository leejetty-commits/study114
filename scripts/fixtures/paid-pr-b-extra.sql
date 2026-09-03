-- PR-B CI 전용. 운영에 적용하지 않는다. paid-pr-a-temp-db + 062 이후 적용.

USE study114;
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE users ADD COLUMN email_verified_at DATETIME NULL;
ALTER TABLE users ADD COLUMN real_name VARCHAR(50) NULL;

UPDATE users SET email_verified_at = NOW(), status = 'active';

CREATE TABLE IF NOT EXISTS user_roles (
  user_id BIGINT UNSIGNED NOT NULL,
  role_type VARCHAR(32) NOT NULL,
  is_primary TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, role_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS students (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  guardian_user_id BIGINT UNSIGNED NOT NULL,
  student_name VARCHAR(50) NOT NULL DEFAULT '학생',
  exposure_status ENUM('draft', 'published', 'hidden', 'deleted') NOT NULL DEFAULT 'draft',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS message_threads (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  participant_low_user_id BIGINT UNSIGNED NOT NULL,
  participant_high_user_id BIGINT UNSIGNED NOT NULL,
  context_kind VARCHAR(32) NOT NULL,
  context_id BIGINT UNSIGNED NOT NULL,
  context_label VARCHAR(80) NOT NULL DEFAULT '',
  peer_display_name VARCHAR(80) NOT NULL DEFAULT '',
  scope_badge VARCHAR(80) NOT NULL DEFAULT '',
  scope_hint VARCHAR(255) NOT NULL DEFAULT '',
  show_request_in_panel TINYINT(1) NOT NULL DEFAULT 0,
  request_summary TEXT NULL,
  structured_line VARCHAR(255) NOT NULL DEFAULT '',
  initiated_by_user_id BIGINT UNSIGNED NOT NULL,
  last_message_preview VARCHAR(120) NOT NULL DEFAULT '',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  thread_id BIGINT UNSIGNED NOT NULL,
  sender_user_id BIGINT UNSIGNED NOT NULL,
  body TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS message_thread_reads (
  thread_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  read_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (thread_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS message_thread_participant_state (
  thread_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  is_archived TINYINT(1) NOT NULL DEFAULT 0,
  is_blocked TINYINT(1) NOT NULL DEFAULT 0,
  block_reason VARCHAR(120) NULL,
  reported_at DATETIME NULL,
  report_reason VARCHAR(50) NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (thread_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id BIGINT UNSIGNED NOT NULL,
  real_name VARCHAR(50) NULL,
  PRIMARY KEY (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS provider_entitlements (
  user_id BIGINT UNSIGNED NOT NULL,
  subscription_tier ENUM('free', 'paid') NOT NULL DEFAULT 'free',
  cold_memo_allowed TINYINT(1) NOT NULL DEFAULT 0,
  memo_credits INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO users (id, email, email_verified_at, status) VALUES
  (40, 'tutor40@dev.local', NOW(), 'active'),
  (41, 'tutor41@dev.local', NOW(), 'active'),
  (42, 'tutor42@dev.local', NOW(), 'active'),
  (50, 'parent50@dev.local', NOW(), 'active'),
  (60, 'tutor60@dev.local', NOW(), 'active')
ON DUPLICATE KEY UPDATE email = VALUES(email), email_verified_at = VALUES(email_verified_at);

INSERT INTO tutors (id, user_id) VALUES
  (40, 40),
  (41, 41),
  (42, 42),
  (60, 60),
  (61, 60)
ON DUPLICATE KEY UPDATE user_id = VALUES(user_id);

INSERT INTO user_roles (user_id, role_type, is_primary) VALUES
  (4, 'tutor', 1),
  (40, 'tutor', 1),
  (41, 'tutor', 1),
  (42, 'tutor', 1),
  (50, 'parent', 1),
  (60, 'tutor', 1)
ON DUPLICATE KEY UPDATE is_primary = VALUES(is_primary);

INSERT INTO students (id, guardian_user_id, student_name, exposure_status) VALUES
  (50, 50, '공개학생', 'published'),
  (51, 50, '닫힌학생', 'hidden')
ON DUPLICATE KEY UPDATE exposure_status = VALUES(exposure_status);

INSERT INTO provider_entitlements (user_id, subscription_tier, cold_memo_allowed, memo_credits) VALUES
  (4, 'free', 0, 0),
  (40, 'free', 0, 0),
  (41, 'free', 0, 0),
  (42, 'free', 0, 0),
  (60, 'free', 0, 0)
ON DUPLICATE KEY UPDATE memo_credits = 0, cold_memo_allowed = 0;

SET FOREIGN_KEY_CHECKS = 1;
