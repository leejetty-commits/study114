-- =============================================================================
-- study114 schema 030 — 18c 요청문 열람 잠금 해제 (학생당 1회 차감)
-- Apply AFTER 029_dev_email_verified.sql
-- SSOT: 18§19 · 13§8
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

CREATE TABLE provider_request_unlocks (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  provider_user_id   BIGINT UNSIGNED NOT NULL,
  student_id         BIGINT UNSIGNED NOT NULL,
  unlocked_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_provider_student_unlock (provider_user_id, student_id),
  KEY idx_unlock_student (student_id),
  CONSTRAINT fk_request_unlock_provider
    FOREIGN KEY (provider_user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_request_unlock_student
    FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='18c · paid_only 요청문 학생당 1회 열람';

-- dev: tutor-owner1 (user 4) — 요청문 열람권 5회
INSERT INTO provider_ticket_packs (user_id, ticket_type, pack_size, remaining, purchased_at, expires_at, source)
VALUES (4, 'request_view', 5, 5, NOW(), DATE_ADD(NOW(), INTERVAL 6 MONTH), 'manual');

-- dev: student 1 — paid_only 요청문 (P24 · E2E)
UPDATE students
SET request_summary_visibility = 'paid_only',
    request_summary = COALESCE(NULLIF(request_summary, ''), '주 2회 저녁, 내신 대비 희망')
WHERE id = 1;
