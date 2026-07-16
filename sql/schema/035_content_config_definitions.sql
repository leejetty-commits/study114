-- =============================================================================
-- study114 schema 035 — 채널/우측 슬롯 영구 설정 (board_channel · right_rail_slot)
-- Apply AFTER 034_board_operational_channels.sql
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE board_channel_definitions (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  board_key           VARCHAR(50) NOT NULL,
  menu_label          VARCHAR(100) NOT NULL,
  board_type          VARCHAR(30) NOT NULL,
  preset_id           VARCHAR(30) NOT NULL,
  section_owner       VARCHAR(50) NOT NULL,
  route_slug          VARCHAR(120) NOT NULL DEFAULT '',
  visibility          VARCHAR(20) NOT NULL DEFAULT 'public',
  download_policy     VARCHAR(20) NOT NULL DEFAULT 'none',
  allowed_roles_json  JSON NULL,
  allow_write         TINYINT(1) NOT NULL DEFAULT 0,
  allow_comment       TINYINT(1) NOT NULL DEFAULT 0,
  allow_upload        TINYINT(1) NOT NULL DEFAULT 0,
  require_review      TINYINT(1) NOT NULL DEFAULT 0,
  is_gnu_separated    TINYINT(1) NOT NULL DEFAULT 1,
  enabled             TINYINT(1) NOT NULL DEFAULT 1,
  archived            TINYINT(1) NOT NULL DEFAULT 0,
  sort_order          INT NOT NULL DEFAULT 0,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by          VARCHAR(100) NULL,
  updated_by          VARCHAR(100) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_board_channel_key (board_key),
  KEY idx_board_channel_enabled (enabled, archived, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='게시판 채널 정의 (A28-05)';

CREATE TABLE right_rail_slot_definitions (
  id                      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slot_key                VARCHAR(50) NOT NULL,
  page_type               VARCHAR(30) NOT NULL,
  source_type             VARCHAR(20) NOT NULL DEFAULT 'mixed',
  source_board_key        VARCHAR(50) NOT NULL DEFAULT '',
  source_board_keys_json  JSON NULL,
  selection_mode          VARCHAR(20) NOT NULL DEFAULT 'curated',
  item_limit              TINYINT UNSIGNED NOT NULL DEFAULT 3,
  section_title           VARCHAR(120) NOT NULL,
  cta_label               VARCHAR(80) NOT NULL DEFAULT '바로가기',
  cta_target              VARCHAR(120) NOT NULL DEFAULT '#/support',
  mobile_behavior         VARCHAR(20) NOT NULL DEFAULT 'stack',
  visibility_rule         VARCHAR(20) NOT NULL DEFAULT 'public',
  role_target             VARCHAR(30) NOT NULL DEFAULT 'all',
  enabled                 TINYINT(1) NOT NULL DEFAULT 1,
  status                  VARCHAR(20) NOT NULL DEFAULT 'active',
  priority                INT NOT NULL DEFAULT 50,
  sort_order              INT NOT NULL DEFAULT 0,
  created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by              VARCHAR(100) NULL,
  updated_by              VARCHAR(100) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_right_rail_slot_key (slot_key),
  KEY idx_right_rail_enabled (enabled, status, priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='우측 레일 슬롯 정의 (A28-05)';

INSERT INTO board_channel_definitions
  (board_key, menu_label, board_type, preset_id, section_owner, route_slug, visibility, download_policy,
   allowed_roles_json, allow_write, allow_comment, allow_upload, require_review, is_gnu_separated, enabled, archived, sort_order)
VALUES
  ('notice', '공지사항', 'operational', 'notice', 'support', '#/support/notice', 'public', 'none', JSON_ARRAY('admin'), 1, 0, 0, 0, 1, 1, 0, 10),
  ('faq', 'FAQ', 'operational', 'faq', 'support', '#/support/faq', 'public', 'none', JSON_ARRAY('admin'), 1, 0, 0, 0, 1, 1, 0, 20),
  ('safe-guide', '안전과외 가이드', 'operational', 'guide', 'support', '#/support/safe', 'public', 'none', JSON_ARRAY('admin'), 1, 0, 0, 0, 1, 1, 0, 30),
  ('policy-log', '정책 변경 이력', 'operational', 'guide', 'policy', '#/policy/changelog', 'public', 'none', JSON_ARRAY('admin'), 1, 0, 0, 0, 1, 1, 0, 40),
  ('library', '자료실', 'download', 'library', 'library', '#/library', 'login', 'login', JSON_ARRAY('admin'), 1, 0, 0, 0, 1, 1, 0, 50),
  ('library-template', '양식·체크리스트', 'download', 'library', 'library', '#/library/templates', 'login', 'login', JSON_ARRAY('admin'), 1, 0, 0, 0, 1, 1, 0, 60),
  ('library-guide-pdf', '가이드 PDF', 'download', 'library', 'library', '#/library/guides', 'public', 'login', JSON_ARRAY('admin'), 1, 0, 0, 0, 1, 1, 0, 70),
  ('submission', '제출자료', 'upload', 'submission', 'mypage', '#/mypage/submission-board', 'role', 'none', JSON_ARRAY('study_room', 'tutor', 'admin'), 1, 0, 1, 0, 1, 1, 0, 80),
  ('showcase', '사례 공유', 'curation', 'curation', 'community', '', 'role', 'none', JSON_ARRAY('admin'), 0, 0, 0, 1, 1, 0, 0, 90);

INSERT INTO right_rail_slot_definitions
  (slot_key, page_type, source_type, source_board_key, source_board_keys_json, selection_mode, item_limit,
   section_title, cta_label, cta_target, mobile_behavior, visibility_rule, role_target, enabled, status, priority, sort_order)
VALUES
  ('home_right_rail', 'home', 'mixed', 'notice', JSON_ARRAY('notice', 'library', 'safe-guide'), 'curated', 3,
   '오늘의 안내', '고객센터 보기', '#/support', 'stack', 'public', 'all', 1, 'active', 10, 10),
  ('search_right_rail', 'search', 'mixed', 'faq', JSON_ARRAY('faq', 'library-template', 'safe-guide'), 'curated', 3,
   '탐색 도움말', 'FAQ 보기', '#/support/faq', 'stack', 'public', 'all', 1, 'active', 20, 20),
  ('detail_right_rail', 'detail', 'mixed', 'safe-guide', JSON_ARRAY('safe-guide', 'submission', 'notice'), 'curated', 3,
   '상세 확인 전 안내', '안전과외 가이드', '#/support/safe', 'collapse', 'public', 'all', 1, 'active', 30, 30),
  ('register_right_rail', 'register', 'mixed', 'library-template', JSON_ARRAY('library-template', 'faq', 'safe-guide'), 'curated', 3,
   '작성 전 체크', '서식함 보기', '#/library/templates', 'stack', 'login', 'provider', 1, 'active', 40, 40),
  ('plans_right_rail', 'plans', 'mixed', 'notice', JSON_ARRAY('notice', 'faq', 'safe-guide'), 'curated', 3,
   '상품 이용 안내', '상품 FAQ', '#/support/faq', 'collapse', 'public', 'provider', 1, 'active', 50, 50),
  ('support_right_rail', 'support', 'mixed', 'notice', JSON_ARRAY('notice', 'faq', 'library-guide-pdf'), 'latest', 3,
   '빠른 도움말', '자료실 보기', '#/library/guides', 'stack', 'public', 'all', 1, 'active', 60, 60);
