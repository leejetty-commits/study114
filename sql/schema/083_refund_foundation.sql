-- =============================================================================
-- study114 schema 083 — 환불 기반: ENUM 확장 + provider_refund_requests
-- Apply AFTER 082_promo_channel_links.sql
-- SSOT: 18c-memo-ticket-refund-lock.md
-- Ticket: 325
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

-- 1) provider_payment_orders.status ENUM 확장: 4값 → 6값
--    기존: pending, paid, failed, cancelled
--    추가: refund_requested, refunded
ALTER TABLE provider_payment_orders
  MODIFY COLUMN status
    ENUM('pending', 'paid', 'failed', 'cancelled', 'refund_requested', 'refunded')
    NOT NULL DEFAULT 'pending'
    COMMENT '325: refund_requested·refunded 추가';

-- 2) provider_refund_requests — 환불 요청·처리 이력
CREATE TABLE provider_refund_requests (
  id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_ref            VARCHAR(36)     NOT NULL,
  user_id              BIGINT UNSIGNED NOT NULL,
  product_kind         ENUM('position', 'count', 'badge_addon') NOT NULL,
  variant              VARCHAR(32)     NOT NULL        COMMENT '1회·5회권·10회권 등',
  amount_won           INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT '원 결제금액',
  table_won            INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT '환불표 기준 금액',
  refund_won           INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT '확정 환불액',
  reason_code          VARCHAR(64)     NOT NULL DEFAULT '' COMMENT 'within7_used0 등',
  reason_text          TEXT            NULL              COMMENT '사용자·관리자 사유',
  status               ENUM('requested', 'approved', 'rejected', 'refunded', 'cancelled')
                         NOT NULL DEFAULT 'requested',
  withdraw_linked      TINYINT(1)     NOT NULL DEFAULT 0 COMMENT '탈퇴 연동 여부',
  identity_checked_at  DATETIME       NULL              COMMENT '본인확인 시각',
  identity_method      VARCHAR(32)    NULL              COMMENT '본인확인 수단',
  requested_at         DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  decided_at           DATETIME       NULL              COMMENT '승인/거절 시각',
  refunded_at          DATETIME       NULL              COMMENT '실제 환불 완료 시각',
  created_at           DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_refund_order_ref (order_ref),
  KEY idx_refund_user (user_id, requested_at DESC),
  KEY idx_refund_status (status, requested_at DESC),
  CONSTRAINT fk_refund_order_ref
    FOREIGN KEY (order_ref) REFERENCES provider_payment_orders (order_ref) ON DELETE CASCADE,
  CONSTRAINT fk_refund_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='325: 환불 요청·처리 이력 (18c)';
