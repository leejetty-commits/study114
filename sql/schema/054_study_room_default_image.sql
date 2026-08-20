-- =============================================================================
-- study114 schema 054 — 공부방 카드 시스템 기본 이미지 플래그
-- Apply AFTER 053_phone_verification_otp.sql
-- 이미 컬럼이 있으면 있으면 Duplicate column 오류 → 무시해도 됨
-- (런타임 StudyRoomDefaultImageService::ensureColumns 도 동일 컬럼을 추가한다)
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

ALTER TABLE study_room_images
  ADD COLUMN is_system_default TINYINT(1) NOT NULL DEFAULT 0 COMMENT '시스템 기본 카드 이미지' AFTER caption;
