-- =============================================================================
-- study114 schema 049 — 공부방 주대상(학교급) 복수
-- Apply AFTER 048_study_room_image_caption.sql
-- 런타임 StudyRoomRegisterService::ensurePrimaryAudienceTable 도 동일 테이블을 멱등으로 만든다.
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS study_room_primary_audiences (
  study_room_id BIGINT UNSIGNED NOT NULL,
  school_level  ENUM('preschool', 'elementary', 'middle', 'high', 'n_su') NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (study_room_id, school_level),
  KEY idx_srpa_level (school_level),
  CONSTRAINT fk_srpa_room FOREIGN KEY (study_room_id) REFERENCES study_rooms (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='공부방 주대상 학교급 (기본정보 · 복수)';
