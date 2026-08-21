-- =============================================================================
-- study114 schema 057 — 후기 엔진 정책 잠금 (증언 자산)
-- Apply AFTER 040_provider_reviews.sql
-- SSOT: Notion 「후기 정책 초안」 §19–21 · docs/ssot/05-study-room-db.md §11-4
--
-- 잠금 결정 (지시문 1 — 이후 UX는 이 값을 바꾸지 않음)
-- 1) title 컬럼 없음. 리스트 헤드라인 = review_body snippet
-- 2) 동일 사용자+동일 대상 신규 생성 누적 최대 3회. 삭제해도 차감 없음
-- 3) 후기차단은 message_thread_participant_state 와 분리된 provider_review_blocks
-- 4) 대상 작성 상태 = open | closed 만 (paused/pending/restricted 금지)
-- 5) 외부 카운터 = review_count = review_status='visible' 만. 추천과 섞지 않음
-- 6) 운영 검수 큐 / 승인 게시 / 댓글 / 공감 검증 없음
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- 1) 레코드 상태: visible | hidden | deleted  (reported 는 검수큐이므로 visible 로 흡수)
-- ---------------------------------------------------------------------------
UPDATE provider_reviews
   SET review_status = 'visible'
 WHERE review_status = 'reported';

ALTER TABLE provider_reviews
  MODIFY COLUMN review_status ENUM('visible', 'hidden', 'deleted') NOT NULL DEFAULT 'visible'
  COMMENT 'visible=공개집계 · hidden=작성자 비공개 · deleted=소프트삭제(쿼터 유지)';

SET @c_del := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'provider_reviews' AND COLUMN_NAME = 'deleted_at'
);
SET @s_del := IF(@c_del = 0,
  'ALTER TABLE provider_reviews ADD COLUMN deleted_at DATETIME NULL AFTER updated_at',
  'SELECT 1');
PREPARE ps_del FROM @s_del; EXECUTE ps_del; DEALLOCATE PREPARE ps_del;

-- 1인 1건 UNIQUE 해제 → 누적 3회 생성 허용
SET @uk := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'provider_reviews'
    AND INDEX_NAME = 'uk_provider_review_author'
);
SET @s_uk := IF(@uk > 0,
  'ALTER TABLE provider_reviews DROP INDEX uk_provider_review_author',
  'SELECT 1');
PREPARE ps_uk FROM @s_uk; EXECUTE ps_uk; DEALLOCATE PREPARE ps_uk;

SET @idx_a := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'provider_reviews'
    AND INDEX_NAME = 'idx_provider_review_author'
);
SET @s_idx := IF(@idx_a = 0,
  'ALTER TABLE provider_reviews ADD KEY idx_provider_review_author (provider_type, provider_id, author_user_id, created_at)',
  'SELECT 1');
PREPARE ps_idx FROM @s_idx; EXECUTE ps_idx; DEALLOCATE PREPARE ps_idx;

-- ---------------------------------------------------------------------------
-- 2) 누적 생성 횟수 — 삭제해도 절대 차감하지 않는 카운터
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS provider_review_quotas (
  provider_type  ENUM('study_room', 'tutor') NOT NULL,
  provider_id    BIGINT UNSIGNED NOT NULL,
  author_user_id BIGINT UNSIGNED NOT NULL,
  created_count  TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '누적 생성 횟수 0~3 · 삭제해도 유지',
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (provider_type, provider_id, author_user_id),
  CONSTRAINT fk_provider_review_quotas_author
    FOREIGN KEY (author_user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='후기 신규 생성 쿼터 · MAX 3 · 쪽지차단과 무관';

INSERT INTO provider_review_quotas (provider_type, provider_id, author_user_id, created_count)
SELECT provider_type, provider_id, author_user_id, COUNT(*)
  FROM provider_reviews
 GROUP BY provider_type, provider_id, author_user_id
    ON DUPLICATE KEY UPDATE created_count = GREATEST(created_count, VALUES(created_count));

-- ---------------------------------------------------------------------------
-- 3) 후기차단 — 쪽지차단(message_thread_participant_state.is_blocked)과 분리
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS provider_review_blocks (
  id                     BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  provider_type          ENUM('study_room', 'tutor') NOT NULL,
  provider_id            BIGINT UNSIGNED NOT NULL,
  blocked_author_user_id BIGINT UNSIGNED NOT NULL COMMENT '후기를 쓰지 못하게 막을 사용자',
  blocked_by_user_id     BIGINT UNSIGNED NOT NULL COMMENT '대상 소유자',
  created_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_provider_review_block (provider_type, provider_id, blocked_author_user_id),
  KEY idx_provider_review_blocks_author (blocked_author_user_id),
  CONSTRAINT fk_provider_review_blocks_author
    FOREIGN KEY (blocked_author_user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_provider_review_blocks_by
    FOREIGN KEY (blocked_by_user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='후기차단(자기 방어) · 기존 후기 자동삭제 없음 · 쪽지차단과 분리';

-- ---------------------------------------------------------------------------
-- 4) 대상 작성 상태 open | closed
-- ---------------------------------------------------------------------------
SET @c_sr := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'study_rooms' AND COLUMN_NAME = 'review_write_status'
);
SET @s_sr := IF(@c_sr = 0,
  'ALTER TABLE study_rooms ADD COLUMN review_write_status ENUM(''open'',''closed'') NOT NULL DEFAULT ''open'' COMMENT ''후기 신규 작성 열림/닫힘'' AFTER profile_status',
  'SELECT 1');
PREPARE ps_sr FROM @s_sr; EXECUTE ps_sr; DEALLOCATE PREPARE ps_sr;

SET @c_tu := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tutors' AND COLUMN_NAME = 'review_write_status'
);
SET @s_tu := IF(@c_tu = 0,
  'ALTER TABLE tutors ADD COLUMN review_write_status ENUM(''open'',''closed'') NOT NULL DEFAULT ''open'' COMMENT ''후기 신규 작성 열림/닫힘'' AFTER profile_status',
  'SELECT 1');
PREPARE ps_tu FROM @s_tu; EXECUTE ps_tu; DEALLOCATE PREPARE ps_tu;
