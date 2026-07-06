-- =============================================================================
-- study114 schema 019 — 소셜 신규 가입 회원구분 대기
-- Apply AFTER 018_user_oauth_accounts.sql
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

ALTER TABLE users
  ADD COLUMN oauth_role_pending TINYINT(1) NOT NULL DEFAULT 0
    COMMENT 'oauth signup role pick pending'
    AFTER email_verified_at;
