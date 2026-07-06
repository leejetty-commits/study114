-- =============================================================================
-- study114 schema 025 — submission 보드 첨부 (board_post_attachments)
-- Apply AFTER 024_admin_reports.sql
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE board_post_attachments (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  board_key       VARCHAR(50) NOT NULL,
  post_key        VARCHAR(80) NOT NULL,
  attachment_key  VARCHAR(40) NOT NULL DEFAULT 'primary',
  original_name   VARCHAR(255) NOT NULL,
  storage_path    VARCHAR(500) NOT NULL COMMENT 'attachments_root 기준 상대경로',
  mime_type       VARCHAR(100) NOT NULL,
  size_bytes      INT UNSIGNED NOT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_board_post_attachment (board_key, post_key, attachment_key),
  KEY idx_board_post_attachments_post (board_key, post_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='게시판 첨부 (1차: submission primary 1개)';
