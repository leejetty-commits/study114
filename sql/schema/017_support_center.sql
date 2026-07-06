-- =============================================================================
-- study114 schema 017 — P17 고객센터 공지 · 운영 문의 티켓
-- Apply AFTER 016_registration_hub.sql
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

CREATE TABLE support_notices (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  notice_key      VARCHAR(50) NOT NULL,
  notice_date     DATE NOT NULL,
  title           VARCHAR(200) NOT NULL,
  body_json       JSON NOT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_support_notices_key (notice_key),
  KEY idx_support_notices_date (notice_date, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='고객센터 공지';

CREATE TABLE support_tickets (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticket_no       VARCHAR(30) NOT NULL,
  email           VARCHAR(190) NOT NULL,
  category        ENUM('bug', 'policy', 'account', 'other') NOT NULL,
  role_type       ENUM('guest', 'parent', 'study_room', 'tutor') NOT NULL DEFAULT 'guest',
  body            TEXT NOT NULL,
  status          ENUM('open', 'in_progress', 'closed') NOT NULL DEFAULT 'open',
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_support_tickets_no (ticket_no),
  KEY idx_support_tickets_email (email),
  KEY idx_support_tickets_status (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='고객센터 운영 문의 티켓';

INSERT INTO support_notices (notice_key, notice_date, title, body_json) VALUES
  (
    'notice-001',
    '2026-07-01',
    '고객센터·안전과외 가이드 1차 오픈 (프리뷰)',
    JSON_ARRAY(
      '고객센터 좌측 메뉴·게시판형 FAQ/공지·안전과외 아코디언 UI를 프리뷰에 반영했습니다.',
      '1차는 정적 콘텐츠이며, 후순위에 관리자 게시판 연동 예정입니다.'
    )
  ),
  (
    'notice-002',
    '2026-06-15',
    '쪽지함 프리뷰(16a) 안내',
    JSON_ARRAY(
      '회원 간 공식 접촉은 쪽지함(16장)을 이용합니다.',
      '운영 문의는 고객센터 운영 문의 채널과 별도입니다.'
    )
  );
