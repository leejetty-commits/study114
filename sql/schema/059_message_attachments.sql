-- =============================================================================
-- study114 schema 059 — 쪽지 첨부 (증빙 서류)
-- Apply AFTER 014_messages.sql
-- 확장자: 상세정보1 홍보사진(jpg/jpeg/png/webp) ∪ 제출·증빙(pdf)
-- 용량: 파일당 5MB · 메시지당 최대 3개 (config/storage.php message)
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS message_attachments (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  message_id      BIGINT UNSIGNED NOT NULL,
  thread_id       BIGINT UNSIGNED NOT NULL,
  original_name   VARCHAR(180)    NOT NULL,
  storage_path    VARCHAR(255)    NOT NULL COMMENT 'attachments_root 기준 상대경로',
  mime_type       VARCHAR(80)     NOT NULL,
  size_bytes      INT UNSIGNED    NOT NULL,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ma_message (message_id),
  KEY idx_ma_thread (thread_id),
  CONSTRAINT fk_ma_message
    FOREIGN KEY (message_id) REFERENCES messages (id) ON DELETE CASCADE,
  CONSTRAINT fk_ma_thread
    FOREIGN KEY (thread_id) REFERENCES message_threads (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='쪽지 첨부 · 공부방/과외쌤→고객 증빙 (선택)';
