-- =============================================================================
-- study114 schema 040 — 공급자 후기 (공부방·과외쌤 공통)
-- Apply AFTER 039_position_duration_calendar.sql
-- SSOT: 5§11-4 · 11장 · 24장 · 노션 부록-후기·리액션
-- student-review(관심 학생)와 별개 — provider_reviews
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

CREATE TABLE provider_reviews (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  provider_type      ENUM('study_room', 'tutor') NOT NULL,
  provider_id        BIGINT UNSIGNED NOT NULL COMMENT 'study_rooms.id | tutors.id',
  author_user_id     BIGINT UNSIGNED NOT NULL,
  review_origin_type ENUM('consultation', 'experience') NOT NULL DEFAULT 'consultation',
  review_status      ENUM('visible', 'hidden', 'reported') NOT NULL DEFAULT 'visible',
  review_body        VARCHAR(300) NOT NULL,
  point_tags_json    JSON NULL COMMENT '["상담이 편해요", ...]',
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_provider_review_author (provider_type, provider_id, author_user_id),
  KEY idx_provider_reviews_target (provider_type, provider_id, review_status, created_at),
  CONSTRAINT fk_provider_reviews_author
    FOREIGN KEY (author_user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='공급자 후기 본문 · 별점 없음 · student-review와 무관';

CREATE TABLE provider_review_replies (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  review_id         BIGINT UNSIGNED NOT NULL,
  provider_user_id  BIGINT UNSIGNED NOT NULL,
  body              VARCHAR(200) NOT NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_provider_review_reply_once (review_id),
  CONSTRAINT fk_provider_review_replies_review
    FOREIGN KEY (review_id) REFERENCES provider_reviews (id) ON DELETE CASCADE,
  CONSTRAINT fk_provider_review_replies_user
    FOREIGN KEY (provider_user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='공급자 공식 답글 1회';

-- dev seed: guardian1(user 6) → study_room 1, tutor 1 (쪽지 시드와 맞춤)
INSERT INTO provider_reviews
  (provider_type, provider_id, author_user_id, review_origin_type, review_status, review_body, point_tags_json)
SELECT 'study_room', 1, 6, 'consultation', 'visible',
       '상담이 부담스럽지 않았고 설명이 차분했어요.',
       JSON_ARRAY('상담이 편해요', '설명이 쉬워요')
FROM DUAL
WHERE EXISTS (SELECT 1 FROM users WHERE id = 6)
  AND EXISTS (SELECT 1 FROM study_rooms WHERE id = 1)
  AND NOT EXISTS (
    SELECT 1 FROM provider_reviews WHERE provider_type = 'study_room' AND provider_id = 1 AND author_user_id = 6
  );

INSERT INTO provider_reviews
  (provider_type, provider_id, author_user_id, review_origin_type, review_status, review_body, point_tags_json)
SELECT 'tutor', 1, 6, 'experience', 'visible',
       '개념 설명이 차근차근이라 아이도 따라가기 쉬웠어요.',
       JSON_ARRAY('개념 설명이 잘해요', '아이와 잘 맞아요')
FROM DUAL
WHERE EXISTS (SELECT 1 FROM users WHERE id = 6)
  AND EXISTS (SELECT 1 FROM tutors WHERE id = 1)
  AND NOT EXISTS (
    SELECT 1 FROM provider_reviews WHERE provider_type = 'tutor' AND provider_id = 1 AND author_user_id = 6
  );
