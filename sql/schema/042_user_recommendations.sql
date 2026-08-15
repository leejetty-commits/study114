-- =============================================================================
-- study114 schema 042 — 카드 추천(엄지) 사용자별 기록 + recommend_count 동기화
-- Apply AFTER 041_list_sort_counters.sql
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS user_recommendations (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      BIGINT UNSIGNED NOT NULL,
  target_type  ENUM('study_room', 'tutor') NOT NULL,
  target_id    BIGINT UNSIGNED NOT NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_recommendations (user_id, target_type, target_id),
  KEY idx_user_recommendations_target (target_type, target_id, created_at),
  CONSTRAINT fk_user_recommendations_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='카드 추천(엄지) · recommend_count 캐시와 동기';
