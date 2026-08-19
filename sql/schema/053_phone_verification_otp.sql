-- =============================================================================
-- study114 schema 053 — P20-05 휴대폰 SMS OTP (쪽지 수신 ON 게이트)
-- Apply AFTER 052_inquiry_default_paused.sql
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

ALTER TABLE user_profiles
  ADD COLUMN phone_verified_method           VARCHAR(16)  NULL COMMENT 'sms_otp 등' AFTER phone_verified_at,
  ADD COLUMN phone_verified_phone            VARCHAR(20)  NULL COMMENT '검증 당시 휴대폰(숫자)' AFTER phone_verified_method,
  ADD COLUMN phone_verification_code_hash    CHAR(64)     NULL COMMENT 'SHA-256 hex' AFTER phone_verified_phone,
  ADD COLUMN phone_verification_expires_at   DATETIME     NULL AFTER phone_verification_code_hash,
  ADD COLUMN phone_verification_attempts     TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER phone_verification_expires_at,
  ADD COLUMN phone_verification_requested_at DATETIME     NULL AFTER phone_verification_attempts;
