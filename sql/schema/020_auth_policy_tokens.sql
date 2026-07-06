-- =============================================================================
-- study114 schema 020 — 인증 토큰 (비밀번호 재설정 · 이메일 인증)
-- Apply AFTER 019_oauth_role_pending.sql
-- SSOT: 9장 부록 §16-2 · §16-5
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS auth_tokens (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NOT NULL,
  token_hash  CHAR(64)        NOT NULL COMMENT 'SHA-256 hex',
  purpose     ENUM('password_reset', 'email_verify') NOT NULL,
  expires_at  DATETIME        NOT NULL,
  used_at     DATETIME        NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_auth_token_hash (token_hash),
  KEY idx_auth_tokens_user_purpose (user_id, purpose),
  KEY idx_auth_tokens_expires (expires_at),
  CONSTRAINT fk_auth_tokens_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='일회성 인증 토큰';
