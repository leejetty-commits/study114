-- =============================================================================
-- study114 schema 010 — tutor extended (8장 §11-8·§11-9)
-- Apply AFTER 008_tutors.sql
-- =============================================================================

USE study114;

ALTER TABLE tutors
  ADD COLUMN detail_completion_status ENUM('basic_only', 'expanded_in_progress', 'expanded_complete') NOT NULL DEFAULT 'basic_only' COMMENT '기본/상세등록' AFTER profile_status,
  ADD COLUMN youtube_url VARCHAR(500) NULL COMMENT '상세등록 YouTube URL 1개' AFTER contact_time_note;
