-- =============================================================================
-- study114 schema 075 — 고민방 댓글·반응·신고 테이블
-- Apply AFTER 021_board_engine.sql
-- 멱등: IF NOT EXISTS / IF NOT IN ENUM
-- =============================================================================
-- 021 원본: status ENUM('draft','submitted','published','hidden') NOT NULL DEFAULT 'draft'
-- 075 변경: 'deleted' 추가. NOT NULL / DEFAULT 'draft' 유지.

SET NAMES utf8mb4;

ALTER TABLE board_posts
  MODIFY COLUMN status ENUM('draft','submitted','published','hidden','deleted')
  NOT NULL DEFAULT 'draft';

-- ─── 댓글 ───
CREATE TABLE IF NOT EXISTS board_post_comments (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  post_id            BIGINT UNSIGNED NOT NULL COMMENT 'board_posts.id',
  parent_comment_id  BIGINT UNSIGNED NULL     COMMENT 'NULL=댓글, 값=대댓글 (2단계까지)',
  author_user_id     BIGINT UNSIGNED NOT NULL,
  author_role        ENUM('parent','study_room','tutor','admin') NOT NULL,
  author_display_name VARCHAR(50)    NOT NULL,
  body               TEXT            NOT NULL,
  status             ENUM('visible','hidden','deleted') NOT NULL DEFAULT 'visible',
  created_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_comments_post (post_id, status, created_at),
  KEY idx_comments_parent (parent_comment_id),
  KEY idx_comments_author (author_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='고민방 댓글 (2단계 대댓글)';

-- ─── 반응 ───
-- comment_id: 0=글 대상, >0=댓글 대상.
-- NOT NULL이어야 UNIQUE KEY가 글 대상(comment_id=0)에서도 중복을 방지한다.
CREATE TABLE IF NOT EXISTS board_post_reactions (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  post_id     BIGINT UNSIGNED NOT NULL COMMENT 'board_posts.id',
  comment_id  BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '0=글 반응, >0=댓글 반응',
  user_id     BIGINT UNSIGNED NOT NULL,
  kind        ENUM('empathy','helpful','cheer') NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_reaction_post_user (post_id, comment_id, user_id),
  KEY idx_reactions_post (post_id, kind),
  KEY idx_reactions_comment (comment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='고민방 반응 (공감·도움됐어요·응원해요)';

-- ─── 신고 ───
-- comment_id: 0=글 신고, >0=댓글 신고. 반응과 같은 규칙.
CREATE TABLE IF NOT EXISTS board_post_reports (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  post_id          BIGINT UNSIGNED NOT NULL COMMENT 'board_posts.id',
  comment_id       BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '0=글 신고, >0=댓글 신고',
  reporter_user_id BIGINT UNSIGNED NOT NULL,
  reason           VARCHAR(500)    NOT NULL DEFAULT '',
  created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_report_target_user (post_id, comment_id, reporter_user_id),
  KEY idx_reports_post (post_id),
  KEY idx_reports_comment (comment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='고민방 신고 (3명 이상 자동 숨김)';
