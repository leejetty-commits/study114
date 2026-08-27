-- =============================================================================
-- study114 schema 058 — 쪽지 중요 표시 (참가자별)
-- Apply AFTER 015_messages_p16_finish.sql
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

ALTER TABLE message_thread_participant_state
  ADD COLUMN is_important TINYINT(1) NOT NULL DEFAULT 0 AFTER is_blocked,
  ADD KEY idx_mtps_user_important (user_id, is_important);
