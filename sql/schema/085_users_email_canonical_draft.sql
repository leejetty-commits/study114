-- 085 DRAFT ONLY — 적용 금지 (종현 승인 전)
-- 358: Gmail canonical 중복을 컬럼·인덱스로 옮길 때 초안.
-- 현행 권장: 스키마 변경 없이 SQL 비교 (GmailAliasAvailability).

-- ALTER TABLE users
--   ADD COLUMN email_canonical VARCHAR(255) NULL AFTER email,
--   ADD INDEX idx_users_email_canonical (email_canonical);

-- 백필 예시(실행 금지):
-- UPDATE users SET email_canonical = ... WHERE ...;
