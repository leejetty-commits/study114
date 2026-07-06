-- 18d — 만료·소진 시스템 안내 (온사이트 · 발송 dedupe)

CREATE TABLE provider_system_notices (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      BIGINT UNSIGNED NOT NULL,
  notice_kind  VARCHAR(64)     NOT NULL COMMENT 'position_expiry_7d · memo_remaining_1 등',
  dedupe_key   VARCHAR(191)    NOT NULL,
  title        VARCHAR(200)    NOT NULL,
  body         TEXT            NOT NULL,
  action_href  VARCHAR(500)    NULL,
  is_read      TINYINT(1)      NOT NULL DEFAULT 0,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_provider_notice_dedupe (dedupe_key),
  KEY idx_provider_notice_user (user_id, is_read, created_at),
  CONSTRAINT fk_provider_notice_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='15§1-1 시스템 안내 · 유료 만료·소진';

CREATE TABLE provider_reminder_dispatches (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id        BIGINT UNSIGNED NOT NULL,
  channel        ENUM('email','sms','onsite') NOT NULL,
  reminder_kind  VARCHAR(64)     NOT NULL,
  dedupe_key     VARCHAR(191)    NOT NULL,
  sent_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_provider_dispatch_dedupe (dedupe_key),
  KEY idx_provider_dispatch_user (user_id, sent_at),
  CONSTRAINT fk_provider_dispatch_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='메일·문자·온사이트 중복 발송 방지';
