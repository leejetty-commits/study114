-- =============================================================================
-- study114 schema 018 — 소셜 로그인 (네이버 · 카카오 · 구글)
-- Apply AFTER 004_member_ssot_align.sql
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS user_oauth_accounts (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id           BIGINT UNSIGNED NOT NULL,
  provider          ENUM('naver', 'kakao', 'google') NOT NULL,
  provider_user_id  VARCHAR(128)    NOT NULL COMMENT '공급자 고유 ID',
  provider_email    VARCHAR(255)    NULL,
  profile_json      JSON            NULL COMMENT '원본 프로필 스냅샷(참고)',
  linked_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_oauth_provider_user (provider, provider_user_id),
  KEY idx_oauth_user (user_id),
  CONSTRAINT fk_oauth_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='소셜 로그인 연동 (한국 3축)';
