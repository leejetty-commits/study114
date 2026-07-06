-- =============================================================================
-- study114 schema 031 — 18d PG 더미 주문 (dev mock)
-- Apply AFTER 030_provider_request_unlocks.sql
-- SSOT: 18§12 · 18b
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

CREATE TABLE provider_payment_orders (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         BIGINT UNSIGNED NOT NULL,
  order_ref       VARCHAR(36)     NOT NULL,
  product_id      VARCHAR(32)     NOT NULL,
  variant_label   VARCHAR(32)     NOT NULL,
  product_kind    ENUM('position', 'count', 'badge_addon') NOT NULL,
  amount_won      INT UNSIGNED    NOT NULL DEFAULT 10,
  status          ENUM('pending', 'paid', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
  pg_provider     VARCHAR(32)     NOT NULL DEFAULT 'dev_mock',
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at         DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_payment_order_ref (order_ref),
  KEY idx_payment_orders_user (user_id, created_at DESC),
  CONSTRAINT fk_payment_orders_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='18d · PG 더미 주문';
