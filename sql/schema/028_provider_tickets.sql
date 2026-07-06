-- =============================================================================
-- study114 schema 028 — 18b 횟수권 · 기간형 포지션
-- Apply AFTER 027_provider_roi.sql
-- SSOT: 18§19 · 18b
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- provider_ticket_packs — 쪽지권 · 요청문 열람권 (FIFO · 6개월)
-- ---------------------------------------------------------------------------
CREATE TABLE provider_ticket_packs (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         BIGINT UNSIGNED NOT NULL,
  ticket_type     ENUM('memo', 'request_view') NOT NULL,
  pack_size       INT UNSIGNED    NOT NULL COMMENT '구매 당시 회차',
  remaining       INT UNSIGNED    NOT NULL,
  purchased_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at      DATETIME        NOT NULL,
  source          VARCHAR(32)     NOT NULL DEFAULT 'manual' COMMENT 'manual | payment | migration',
  PRIMARY KEY (id),
  KEY idx_ticket_packs_user (user_id, ticket_type, expires_at, id),
  CONSTRAINT fk_ticket_packs_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='18b · 횟수권 묶음';

-- ---------------------------------------------------------------------------
-- provider_position_subscriptions — Prime / Pick 기간형
-- ---------------------------------------------------------------------------
CREATE TABLE provider_position_subscriptions (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         BIGINT UNSIGNED NOT NULL,
  sku_code        ENUM('prime', 'pick') NOT NULL,
  period_days     INT UNSIGNED    NOT NULL,
  starts_at       DATETIME        NOT NULL,
  ends_at         DATETIME        NOT NULL,
  source          VARCHAR(32)     NOT NULL DEFAULT 'manual',
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_position_user_ends (user_id, ends_at),
  CONSTRAINT fk_position_subs_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='18b · Prime/Pick 기간형';

-- dev: 기존 memo_credits → 쪽지권 팩 (6개월)
INSERT INTO provider_ticket_packs (user_id, ticket_type, pack_size, remaining, purchased_at, expires_at, source)
SELECT user_id, 'memo', memo_credits, memo_credits, NOW(), DATE_ADD(NOW(), INTERVAL 6 MONTH), 'migration'
FROM provider_entitlements
WHERE memo_credits > 0;

-- dev: tutor-owner1 (user 4) — 쪽지권 5회 · Pick 2주
INSERT INTO provider_ticket_packs (user_id, ticket_type, pack_size, remaining, purchased_at, expires_at, source)
VALUES (4, 'memo', 5, 5, NOW(), DATE_ADD(NOW(), INTERVAL 6 MONTH), 'manual');

INSERT INTO provider_position_subscriptions (user_id, sku_code, period_days, starts_at, ends_at, source)
VALUES (4, 'pick', 14, NOW(), DATE_ADD(NOW(), INTERVAL 14 DAY), 'manual');
