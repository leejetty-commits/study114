-- =============================================================================
-- study114 schema 055 — 유료 카드 배지 entitlement (paid_badges[] 소스)
-- Apply AFTER 031_provider_payment_orders.sql
-- SSOT: docs/internal/57-paid-badges-api-contract.md · card-visual.js
-- 허용 코드: study_room=hot|subject_track · tutor=hot|jjokjipge|sky
-- 금지: recommend, new, trust codes, 전문
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS provider_paid_badges (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  provider_type      ENUM('study_room', 'tutor') NOT NULL,
  provider_id        BIGINT UNSIGNED NOT NULL,
  badge_code         VARCHAR(32)     NOT NULL
    COMMENT 'hot|subject_track|jjokjipge|sky',
  starts_on          DATE            NOT NULL,
  end_exclusive_on   DATE            NOT NULL
    COMMENT '종료일 미포함 (active: starts_on <= CURDATE() < end_exclusive_on)',
  source_order_ref   VARCHAR(36)     NULL,
  created_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_paid_badges_active (provider_type, provider_id, badge_code, starts_on, end_exclusive_on),
  KEY idx_paid_badges_order (source_order_ref)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='카드 paid_badges[] entitlement · SearchService 주입 소스';
