-- =============================================================================
-- study114 schema 027 — 18a P18-02 ROI (조회·찜·비교 담김)
-- Apply AFTER 026_admin_dev_seed.sql
-- SSOT: docs/ssot/18-paid-services-rough.md §6 · P18-02
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- provider_profile_views — 공급자 프로필 조회 (ROI views)
-- ---------------------------------------------------------------------------
CREATE TABLE provider_profile_views (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  target_type     ENUM('study_room', 'tutor') NOT NULL,
  target_id       BIGINT UNSIGNED NOT NULL,
  viewer_user_id  BIGINT UNSIGNED NULL COMMENT '비로그인 NULL',
  viewed_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ppviews_target_time (target_type, target_id, viewed_at),
  KEY idx_ppviews_viewer (viewer_user_id, viewed_at),
  CONSTRAINT fk_ppviews_viewer
    FOREIGN KEY (viewer_user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='18a · P18-02 조회 — user_recent_views와 별도 집계';

-- dev: 기존 최근열람에서 study_room/tutor view_detail 백필
INSERT INTO provider_profile_views (target_type, target_id, viewer_user_id, viewed_at)
SELECT target_type, target_id, user_id, viewed_at
FROM user_recent_views
WHERE target_type IN ('study_room', 'tutor')
  AND last_action = 'view_detail';
