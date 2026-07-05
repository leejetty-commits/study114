-- =============================================================================
-- study114 schema 013 — 25장 부록 B Handoff basket DDL
-- favorite · compare · recent_view · student_review
-- Apply AFTER 012_search_dev_seed.sql
-- SSOT: docs/ssot/25-decision-handoff-layer.md 부록 B
-- Preview bridge: preview/home-ui/src/*-store.js · user-actions-state.js
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- user_favorites — P15-06 찜 · P25-03 (학생 ✕)
-- ---------------------------------------------------------------------------
CREATE TABLE user_favorites (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      BIGINT UNSIGNED NOT NULL COMMENT 'users.id · 학부모 등',
  target_type  ENUM('study_room', 'tutor') NOT NULL,
  target_id    BIGINT UNSIGNED NOT NULL COMMENT 'study_rooms.id | tutors.id',
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_favorites (user_id, target_type, target_id),
  KEY idx_user_favorites_user (user_id, target_type, created_at),
  CONSTRAINT fk_user_favorites_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='25장 §5 찜 · compare_session과 별개';

-- ---------------------------------------------------------------------------
-- user_compare_items — P25-03 비교 후보 (max 3 / kind · 혼합 ✕)
-- ---------------------------------------------------------------------------
CREATE TABLE user_compare_items (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      BIGINT UNSIGNED NOT NULL,
  target_type  ENUM('study_room', 'tutor') NOT NULL,
  target_id    BIGINT UNSIGNED NOT NULL,
  sort_order   TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '0~2 · 담은 순서',
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_compare (user_id, target_type, target_id),
  KEY idx_user_compare_list (user_id, target_type, sort_order),
  CONSTRAINT fk_user_compare_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='25장 §5 compare_session 영속 basket';

-- ---------------------------------------------------------------------------
-- user_recent_views — P15-07 최근열람 · resume token
-- ---------------------------------------------------------------------------
CREATE TABLE user_recent_views (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         BIGINT UNSIGNED NOT NULL,
  target_type     ENUM('study_room', 'tutor', 'student') NOT NULL,
  target_id       BIGINT UNSIGNED NOT NULL,
  title_snapshot  VARCHAR(120)    NOT NULL DEFAULT '' COMMENT '목록 표시용 스냅샷',
  last_route      VARCHAR(32)     NULL COMMENT 'search|detail|wishlist|mypage|student-review',
  last_action     VARCHAR(32)     NOT NULL DEFAULT 'view_detail' COMMENT 'view_detail|wish_add|compare_add|review_add',
  viewed_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_recent (user_id, target_type, target_id),
  KEY idx_user_recent_feed (user_id, viewed_at DESC),
  CONSTRAINT fk_user_recent_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='25장 §6 · P15-07 · max 30건 앱 prune';

-- ---------------------------------------------------------------------------
-- provider_student_reviews — P25-S10 학생 검토함
-- ---------------------------------------------------------------------------
CREATE TABLE provider_student_reviews (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  provider_user_id BIGINT UNSIGNED NOT NULL COMMENT 'tutor | study_room_owner users.id',
  student_id       BIGINT UNSIGNED NOT NULL COMMENT 'students.id',
  provider_role    ENUM('tutor', 'study_room') NOT NULL,
  saved_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_provider_student_review (provider_user_id, student_id),
  KEY idx_provider_review_feed (provider_user_id, saved_at DESC),
  CONSTRAINT fk_psr_provider
    FOREIGN KEY (provider_user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_psr_student
    FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='25장 §8 · 찜·비교와 별개 · max 50건 앱 prune';
