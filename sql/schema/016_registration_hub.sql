-- =============================================================================
-- study114 schema 016 — 20장 inquiry_status · 등록 허브 API 보강
-- Apply AFTER 015_messages_p16_finish.sql
-- SSOT: docs/ssot/20-study-room-registration-management.md §4-3
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

ALTER TABLE study_rooms
  ADD COLUMN inquiry_status ENUM('open', 'paused', 'capacity_full', 'waiting_only')
    NOT NULL DEFAULT 'open'
    COMMENT '20장 상담 수용 상태'
    AFTER profile_status;

UPDATE study_rooms SET inquiry_status = 'open' WHERE id IN (1, 2);
UPDATE study_rooms SET inquiry_status = 'waiting_only' WHERE id = 3;

-- tutors — published_at (students·study_rooms 와 동일 패턴)
ALTER TABLE tutors
  ADD COLUMN published_at DATETIME NULL COMMENT '최초 공개 시각' AFTER profile_status;

UPDATE tutors SET published_at = updated_at WHERE profile_status = 'published' AND published_at IS NULL;
