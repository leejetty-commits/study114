-- =============================================================================
-- study114 schema 069 — 공급자 휴대폰 본인확인 (PASS/KMC/NICE/PG)
-- SMS OTP(053 phone_verified_* / sms_otp)와 별도 컬럼이다.
-- sms_otp 완료를 이 컬럼에 복사하지 않는다.
-- CI/DI는 업체 계약의 보관 목적·기간이 확정되기 전까지 컬럼을 두지 않는다.
-- Actions는 이 SQL을 실행하지 않는다. 운영 phpMyAdmin 적용이 선행이다.
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

ALTER TABLE user_profiles
  ADD COLUMN phone_identity_verified_at DATETIME NULL COMMENT '휴대폰 본인확인 완료 시각. SMS OTP 완료가 아님' AFTER phone_verification_requested_at,
  ADD COLUMN phone_identity_phone       VARCHAR(20) NULL COMMENT '본인확인 당시 휴대폰(숫자)' AFTER phone_identity_verified_at,
  ADD COLUMN phone_identity_method       VARCHAR(32) NULL COMMENT 'niceid|kmc|pass|pg_partner. sms_otp 금지' AFTER phone_identity_phone,
  ADD COLUMN phone_identity_tx_id        VARCHAR(64) NULL COMMENT '업체 거래 식별자' AFTER phone_identity_method;
