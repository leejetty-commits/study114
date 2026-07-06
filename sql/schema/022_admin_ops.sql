-- =============================================================================
-- study114 schema 022 — A28 운영 로그 · 제출자료 내부 확인
-- Apply AFTER 021_board_engine.sql
-- =============================================================================

SET NAMES utf8mb4;

ALTER TABLE board_posts
  ADD COLUMN internal_memo TEXT NULL COMMENT 'A28 내부 메모 (사용자 미노출)' AFTER memo;

CREATE TABLE admin_operation_logs (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  log_key         VARCHAR(40) NOT NULL,
  acted_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  operator_id     VARCHAR(100) NOT NULL,
  target_type     VARCHAR(50) NOT NULL,
  target_id       VARCHAR(100) NOT NULL,
  action_kind     VARCHAR(50) NOT NULL,
  reason_category VARCHAR(50) NULL,
  detail_memo     TEXT NULL,
  reversible      TINYINT(1) NOT NULL DEFAULT 1,
  revert_history  JSON NULL,
  user_notified   TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_operation_logs_key (log_key),
  KEY idx_admin_logs_target (target_type, target_id, acted_at),
  KEY idx_admin_logs_acted (acted_at, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='A28 운영 조치 로그 (28§9)';
