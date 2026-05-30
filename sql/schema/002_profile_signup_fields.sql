-- =============================================================================
-- study114 schema 002 — user_profiles signup fields (SSOT 2장)
-- Apply after 001_init.sql
--
-- Usage:
--   mysql -u root -p study114 < sql/schema/002_profile_signup_fields.sql
-- =============================================================================

USE study114;

ALTER TABLE user_profiles
  ADD COLUMN gender           ENUM('male', 'female') NULL COMMENT '성별 (2장 잠금)' AFTER name,
  ADD COLUMN birth_date       DATE                   NULL COMMENT '생년월일 (2장 잠금)' AFTER gender,
  ADD COLUMN address          VARCHAR(500)           NULL COMMENT '1차 단일 주소 (UI name=address)' AFTER phone,
  ADD COLUMN sms_consent      TINYINT(1)             NOT NULL DEFAULT 0 COMMENT '문자 수신 동의' AFTER activity_address_detail,
  ADD COLUMN email_consent    TINYINT(1)             NOT NULL DEFAULT 0 COMMENT '이메일 수신 동의' AFTER sms_consent,
  ADD COLUMN safe_number_use  TINYINT(1)             NOT NULL DEFAULT 0 COMMENT '안전번호 사용 (확장 포인트)' AFTER email_consent;
