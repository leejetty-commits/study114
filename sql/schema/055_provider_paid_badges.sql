-- =============================================================================
-- study114 schema 055 — 유료 카드 배지 entitlement (paid_badges[] 소스)
-- Apply AFTER 031_provider_payment_orders.sql
-- SSOT: docs/internal/57-paid-badges-api-contract.md · card-visual.js
-- 허용 코드: study_room=hot|subject_track · tutor=hot|jjokjipge|sky
-- 금지: recommend, new, trust codes, 전문
--
-- 활성 조건: status='active' AND starts_on <= CURDATE() < end_exclusive_on
-- 환불/취소: status='revoked' (행 삭제가 아닌 회수)
-- 중복 구매: 동일 badge_code 활성 행이 있으면 end_exclusive_on 연장 (fulfill 로직)
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS provider_paid_badges (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  provider_type      ENUM('study_room', 'tutor') NOT NULL,
  provider_id        BIGINT UNSIGNED NOT NULL,
  badge_code         VARCHAR(32)     NOT NULL
    COMMENT 'hot|subject_track|jjokjipge|sky',
  status             ENUM('active', 'revoked') NOT NULL DEFAULT 'active',
  starts_on          DATE            NOT NULL,
  end_exclusive_on   DATE            NOT NULL
    COMMENT '종료일 미포함 (active: starts_on <= CURDATE() < end_exclusive_on)',
  source_order_ref   VARCHAR(36)     NULL,
  created_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at         DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_paid_badges_order_code (source_order_ref, badge_code),
  KEY idx_paid_badges_active (provider_type, provider_id, status, badge_code, starts_on, end_exclusive_on),
  KEY idx_paid_badges_order (source_order_ref)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='카드 paid_badges[] entitlement · SearchService 주입 소스';
