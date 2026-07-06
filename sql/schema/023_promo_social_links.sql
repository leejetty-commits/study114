-- =============================================================================
-- study114 schema 023 — 외부 홍보 링크 (facebook · instagram)
-- youtube_url 은 009/010 에 이미 존재
-- Apply AFTER 022_admin_ops.sql
-- =============================================================================

SET NAMES utf8mb4;

ALTER TABLE study_rooms
  ADD COLUMN facebook_url VARCHAR(500) NULL COMMENT '상세등록 Facebook URL 1개' AFTER youtube_url,
  ADD COLUMN instagram_url VARCHAR(500) NULL COMMENT '상세등록 Instagram URL 1개' AFTER facebook_url;

ALTER TABLE tutors
  ADD COLUMN facebook_url VARCHAR(500) NULL COMMENT '상세등록 Facebook URL 1개' AFTER youtube_url,
  ADD COLUMN instagram_url VARCHAR(500) NULL COMMENT '상세등록 Instagram URL 1개' AFTER facebook_url;
