-- =============================================================================
-- study114 schema 021 — P23 게시판 엔진 (board_posts)
-- Apply AFTER 020_auth_policy_tokens.sql
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE board_posts (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  board_key       VARCHAR(50) NOT NULL,
  post_key        VARCHAR(80) NOT NULL,
  author_user_id  BIGINT UNSIGNED NULL,
  author_role     ENUM('guest', 'parent', 'study_room', 'tutor', 'admin', 'system') NOT NULL DEFAULT 'system',
  status          ENUM('draft', 'submitted', 'published', 'hidden') NOT NULL DEFAULT 'draft',
  title           VARCHAR(200) NOT NULL,
  description     TEXT NULL,
  memo            TEXT NULL,
  category_id     VARCHAR(50) NULL,
  file_label      VARCHAR(255) NULL,
  meta_json       JSON NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_board_posts_key (board_key, post_key),
  KEY idx_board_posts_board (board_key, status, updated_at),
  KEY idx_board_posts_author (board_key, author_role, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='게시판 엔진 통합 게시물 (다운로드형·제출형)';

INSERT INTO board_posts (board_key, post_key, author_role, status, title, description, file_label, meta_json) VALUES
  (
    'library',
    'lib-1',
    'system',
    'published',
    '안전과외 체크리스트 (학부모용)',
    '첫 상담 전 확인할 질문 목록',
    'safe-prep-checklist.pdf',
    JSON_OBJECT('format', 'PDF', 'section', 'library', 'audience', JSON_ARRAY('all', 'parent'))
  ),
  (
    'library',
    'lib-2',
    'system',
    'published',
    '공부방 상담 수용 안내 템플릿',
    '상담 가능·정원 마감 안내 문구 예시',
    'room-inquiry-template.docx',
    JSON_OBJECT('format', 'DOCX', 'section', 'library', 'audience', JSON_ARRAY('study_room'))
  ),
  (
    'library-template',
    'tpl-1',
    'system',
    'published',
    '과외 첫 수업 안내 양식',
    '학부모·학생에게 보낼 첫 안내 메모',
    'tutor-first-lesson.hwp',
    JSON_OBJECT('format', 'HWP', 'section', 'templates', 'audience', JSON_ARRAY('tutor'))
  ),
  (
    'library-template',
    'tpl-2',
    'system',
    'published',
    '학습 요청 조건 정리표',
    '자녀 등록 전 희망 조건 메모용',
    'student-request-sheet.xlsx',
    JSON_OBJECT('format', 'XLSX', 'section', 'templates', 'audience', JSON_ARRAY('parent'))
  ),
  (
    'library-guide-pdf',
    'pdf-1',
    'system',
    'published',
    '안전과외 가이드 — 선지급 주의 (PDF)',
    'P17-03 safe/prepay 요약본',
    'safe-prepay-guide.pdf',
    JSON_OBJECT('format', 'PDF', 'section', 'guides', 'audience', JSON_ARRAY('all'))
  ),
  (
    'library-guide-pdf',
    'pdf-2',
    'system',
    'published',
    '제출자료 안내 — 발급기관 재확인',
    '22·28장 톤 · 플랫폼 인증 아님',
    'submission-doc-notice.pdf',
    JSON_OBJECT('format', 'PDF', 'section', 'guides', 'audience', JSON_ARRAY('study_room', 'tutor'))
  );

INSERT INTO board_posts (board_key, post_key, author_role, status, title, description, category_id, file_label, memo, created_at, updated_at) VALUES
  (
    'submission',
    'sub-seed-1',
    'tutor',
    'published',
    '학력 증명서 사본',
    '과외 프로필 등록 시 참고용으로 제출한 학력 증빙입니다.',
    'education',
    'education-cert.pdf',
    'tutor-ui 등록과 동일 항목',
    '2026-06-20 00:00:00',
    NOW()
  ),
  (
    'submission',
    'sub-seed-2',
    'tutor',
    'submitted',
    '경력 확인 서류',
    '경력 항목 보완용 첨부.',
    'education',
    'career-proof.jpg',
    '',
    NOW(),
    NOW()
  ),
  (
    'submission',
    'sub-seed-room-1',
    'study_room',
    'published',
    '시설 안전 점검 체크리스트',
    '공부방 시설 안전 점검 기록.',
    'facility',
    'safety-checklist.pdf',
    '',
    '2026-06-15 00:00:00',
    NOW()
  );
