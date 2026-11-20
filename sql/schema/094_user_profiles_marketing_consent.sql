-- 094 — user_profiles 마케팅 정보 수신 동의
-- Actions는 이 SQL을 실행하지 않는다.
-- 운영에는 2026-11-21 종현이 이미 실행했다. 다시 실행하면 컬럼이 있어 실패한다.
-- 기존 행은 marketing_consent 0, marketing_consent_at NULL.

SET NAMES utf8mb4;

ALTER TABLE user_profiles
  ADD COLUMN marketing_consent TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN marketing_consent_at DATETIME NULL;
