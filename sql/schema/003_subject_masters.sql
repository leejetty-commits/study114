-- =============================================================================
-- study114 schema 003 — subject_masters (5장 §5-1 · 4장 §3)
-- Apply AFTER 001_init.sql (+ 002 optional)
-- =============================================================================

USE study114;

CREATE TABLE subject_masters (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  subject_group_code VARCHAR(20)     NOT NULL COMMENT '전과목/영어/수학/국어/과탐/사탐/한자/기타',
  subject_name       VARCHAR(50)     NOT NULL COMMENT '세부 과목명 또는 표시명',
  parent_subject_id  BIGINT UNSIGNED NULL COMMENT '상위 과목 FK',
  sort_order         SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_active          TINYINT(1)      NOT NULL DEFAULT 1,
  created_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_subject_masters_group (subject_group_code, sort_order),
  KEY idx_subject_masters_parent (parent_subject_id),
  CONSTRAINT fk_subject_masters_parent
    FOREIGN KEY (parent_subject_id) REFERENCES subject_masters (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='공통 과목 마스터 (공부방/과외쌤/학생)';

-- 상위 8그룹 + 대표 과목 최소 시드
INSERT INTO subject_masters (subject_group_code, subject_name, parent_subject_id, sort_order, is_active) VALUES
  ('all', '전과목', NULL, 1, 1),
  ('english', '영어', NULL, 2, 1),
  ('english', '영어회화', 2, 1, 1),
  ('english', '영어문법', 2, 2, 1),
  ('math', '수학', NULL, 3, 1),
  ('math', '수학(중등)', 5, 1, 1),
  ('math', '수학(고등)', 5, 2, 1),
  ('korean', '국어', NULL, 4, 1),
  ('korean', '국어문법', 8, 1, 1),
  ('science', '과탐', NULL, 5, 1),
  ('science', '물리', 10, 1, 1),
  ('science', '화학', 10, 2, 1),
  ('social', '사탐', NULL, 6, 1),
  ('social', '한국사', 13, 1, 1),
  ('hanja', '한자', NULL, 7, 1),
  ('other', '기타', NULL, 8, 1),
  ('other', '코딩', 16, 1, 1);
