-- =============================================================================
-- study114 schema 015 — 16장 P16 마무리 (entitlement · moderation)
-- Apply AFTER 014_messages.sql
-- SSOT: 16§7 P16-04 · 16§5 신고/차단 · 보관함(1차 탭)
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- provider_entitlements — P16-04 콜드 메모 · P18 placeholder
-- ---------------------------------------------------------------------------
CREATE TABLE provider_entitlements (
  user_id           BIGINT UNSIGNED NOT NULL,
  subscription_tier ENUM('free', 'paid') NOT NULL DEFAULT 'free',
  cold_memo_allowed TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '콜드 메모 허용',
  memo_credits      INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT '쪽지권 잔여 횟수 (레거시 컬럼명)',
  updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_provider_entitlements_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='16§7 · 18장 entitlement placeholder';

INSERT INTO provider_entitlements (user_id, subscription_tier, cold_memo_allowed, memo_credits) VALUES
  (1, 'free', 0, 0),
  (2, 'free', 0, 0),
  (3, 'free', 0, 0),
  (4, 'free', 0, 0),
  (5, 'paid', 1, 10);

-- ---------------------------------------------------------------------------
-- message_thread_participant_state — 보관 · 차단 · 신고 (참가자별)
-- ---------------------------------------------------------------------------
CREATE TABLE message_thread_participant_state (
  thread_id      BIGINT UNSIGNED NOT NULL,
  user_id        BIGINT UNSIGNED NOT NULL,
  is_archived    TINYINT(1)      NOT NULL DEFAULT 0,
  is_blocked     TINYINT(1)      NOT NULL DEFAULT 0,
  block_reason   VARCHAR(120)    NULL,
  reported_at    DATETIME        NULL,
  report_reason  VARCHAR(50)     NULL,
  updated_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (thread_id, user_id),
  CONSTRAINT fk_mtps_thread
    FOREIGN KEY (thread_id) REFERENCES message_threads (id) ON DELETE CASCADE,
  CONSTRAINT fk_mtps_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='16§5 신고/차단 · 보관함(참가자별)';
