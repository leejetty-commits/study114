-- =============================================================================
-- 088 — 공급자 쪽지 허용 본인인증 (포트원 V2 × KG 통합인증)
-- 저장 칸 5개만: ci_hash · verified_at · provider · tx_id · 이름
-- CI 원문·생년월일·휴대폰 컬럼 금지. SMS OTP(053)와 별층.
-- Actions는 SQL을 실행하지 않는다. 운영 phpMyAdmin / 로컬 Docker에서 적용.
-- 탈퇴 시: AccountWithdrawService가 5칸을 NULL로 비워 UNIQUE를 풀어 재사용 가능.
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- 1) user_profiles 5칸 + UNIQUE(ci_hash) + UNIQUE(tx_id)
-- ---------------------------------------------------------------------------
SET @c1 := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_profiles'
    AND COLUMN_NAME = 'identity_ci_hash'
);
SET @s1 := IF(@c1 = 0,
  'ALTER TABLE user_profiles
     ADD COLUMN identity_ci_hash CHAR(64) NULL
       COMMENT ''CI HMAC-SHA256 hex. 원문 CI 비보관'' AFTER phone_verification_requested_at,
     ADD COLUMN identity_verified_at DATETIME NULL
       COMMENT ''본인인증 완료 시각'' AFTER identity_ci_hash,
     ADD COLUMN identity_provider VARCHAR(32) NULL
       COMMENT ''예: inicis_unified'' AFTER identity_verified_at,
     ADD COLUMN identity_tx_id VARCHAR(128) NULL
       COMMENT ''포트원 identityVerificationId'' AFTER identity_provider,
     ADD COLUMN identity_name VARCHAR(100) NULL
       COMMENT ''인증 성명'' AFTER identity_tx_id,
     ADD UNIQUE KEY uq_user_profiles_identity_ci_hash (identity_ci_hash),
     ADD UNIQUE KEY uq_user_profiles_identity_tx_id (identity_tx_id)',
  'SELECT 1');
PREPARE ps1 FROM @s1; EXECUTE ps1; DEALLOCATE PREPARE ps1;

SET @txu := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_profiles'
    AND INDEX_NAME = 'uq_user_profiles_identity_tx_id'
);
SET @stx := IF(@txu = 0,
  'ALTER TABLE user_profiles ADD UNIQUE KEY uq_user_profiles_identity_tx_id (identity_tx_id)',
  'SELECT 1');
PREPARE pstx FROM @stx; EXECUTE pstx; DEALLOCATE PREPARE pstx;

-- ---------------------------------------------------------------------------
-- 2) 신규 기본값 paused (공부방·과외)
-- ---------------------------------------------------------------------------
ALTER TABLE study_rooms
  MODIFY COLUMN inquiry_status ENUM('open', 'paused', 'capacity_full', 'waiting_only')
    NOT NULL DEFAULT 'paused'
    COMMENT '쪽지 수신: 신규 기본 paused(365 본인인증 후 open)';

ALTER TABLE tutors
  MODIFY COLUMN inquiry_status ENUM('open', 'paused', 'not_accepting')
    NOT NULL DEFAULT 'paused'
    COMMENT '과외쌤 쪽지 수신: 신규 기본 paused(365 본인인증 후 open)';

-- ---------------------------------------------------------------------------
-- 3) open→paused 대상 ID 백업 후 UPDATE
--    user_profiles 없는 소유자도 paused (LEFT JOIN + 미인증 조건)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS _088_backup_study_rooms_inquiry (
  id INT UNSIGNED NOT NULL PRIMARY KEY,
  inquiry_status_was VARCHAR(32) NOT NULL,
  backed_up_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='088: open→paused 된 study_rooms.id 백업. rollback 복구용';

CREATE TABLE IF NOT EXISTS _088_backup_tutors_inquiry (
  id INT UNSIGNED NOT NULL PRIMARY KEY,
  inquiry_status_was VARCHAR(32) NOT NULL,
  backed_up_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='088: open→paused 된 tutors.id 백업. rollback 복구용';

INSERT IGNORE INTO _088_backup_study_rooms_inquiry (id, inquiry_status_was)
SELECT sr.id, sr.inquiry_status
  FROM study_rooms sr
  LEFT JOIN user_profiles up ON up.user_id = sr.user_id
 WHERE sr.inquiry_status = 'open'
   AND (
     up.user_id IS NULL
     OR up.identity_verified_at IS NULL
     OR NULLIF(TRIM(up.identity_ci_hash), '') IS NULL
     OR NULLIF(TRIM(up.identity_tx_id), '') IS NULL
   );

UPDATE study_rooms sr
  INNER JOIN _088_backup_study_rooms_inquiry b ON b.id = sr.id
   SET sr.inquiry_status = 'paused'
 WHERE sr.inquiry_status = 'open';
SELECT CONCAT('088 study_rooms open→paused rows=', ROW_COUNT()) AS migration_note;

INSERT IGNORE INTO _088_backup_tutors_inquiry (id, inquiry_status_was)
SELECT t.id, t.inquiry_status
  FROM tutors t
  LEFT JOIN user_profiles up ON up.user_id = t.user_id
 WHERE t.inquiry_status = 'open'
   AND (
     up.user_id IS NULL
     OR up.identity_verified_at IS NULL
     OR NULLIF(TRIM(up.identity_ci_hash), '') IS NULL
     OR NULLIF(TRIM(up.identity_tx_id), '') IS NULL
   );

UPDATE tutors t
  INNER JOIN _088_backup_tutors_inquiry b ON b.id = t.id
   SET t.inquiry_status = 'paused'
 WHERE t.inquiry_status = 'open';
SELECT CONCAT('088 tutors open→paused rows=', ROW_COUNT()) AS migration_note;
