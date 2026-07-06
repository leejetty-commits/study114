-- =============================================================================
-- study114 schema 024 — A28-04 신고 처리 큐
-- Apply AFTER 023_promo_social_links.sql
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE admin_reports (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  report_key      VARCHAR(30) NOT NULL,
  kind            VARCHAR(50) NOT NULL,
  target_type     VARCHAR(50) NOT NULL,
  target_id       VARCHAR(100) NOT NULL,
  target_label    VARCHAR(200) NULL,
  reason          TEXT NOT NULL,
  status          ENUM('open', 'protect', 'resolved', 'dismissed') NOT NULL DEFAULT 'open',
  internal_memo   TEXT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_reports_key (report_key),
  KEY idx_admin_reports_status (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='A28 신고 처리 큐 (문의 티켓과 분리)';

INSERT INTO admin_reports (report_key, kind, target_type, target_id, target_label, reason, status, created_at) VALUES
  ('RPT-101', '허위 정보', 'tutor', '12', 'tutor #12', '활동 지역 불일치 신고', 'open', '2026-07-05 10:00:00'),
  ('RPT-102', '안전 이슈', 'thread', '8', 'thread #8', '부적절 접촉 의심', 'protect', '2026-07-06 14:30:00');
