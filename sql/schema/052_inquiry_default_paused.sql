-- =============================================================================
-- study114 schema 052 — P20-05 쪽지 수신 기본값 paused (신규 생성만)
-- SSOT: docs/ssot/20-study-room-registration-management.md (P20-05 리뉴얼)
-- 기존 실데이터 inquiry_status는 일괄 변경하지 않음
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

ALTER TABLE study_rooms
  MODIFY COLUMN inquiry_status ENUM('open', 'paused', 'capacity_full', 'waiting_only')
    NOT NULL DEFAULT 'paused'
    COMMENT '쪽지 수신 상태 (운영 스위치)';
