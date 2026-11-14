-- =============================================================================
-- 088 — 공급자 쪽지 허용 본인인증 (포트원 V2 × KG 통합인증)
-- 저장 칸 5개만: ci_hash · verified_at · provider · tx_id · 이름
-- CI 원문·생년월일·휴대폰 컬럼 금지. SMS OTP(053)와 별층.
-- Actions는 SQL을 실행하지 않는다. 닷홈 phpMyAdmin에서 아래를 한 번만 실행.
-- information_schema·PREPARE 없음. 닷홈은 그 조회가 빈 결과라
-- 인덱스 있음 판정이 항상 0이 되어 UNIQUE를 두 번 추가하다 실패한다.
-- 실행 전·적용 후 확인 쿼리:
--   docs/worklog/2026/11/2026-11-12-365-identity-inquiry-impl.md
-- identity% 컬럼이 이미 있으면 이 파일을 다시 실행하지 않는다.
-- 탈퇴 시: AccountWithdrawService가 5칸을 NULL로 비워 UNIQUE를 풀어 재사용 가능.
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

-- 1) user_profiles 5칸 + UNIQUE 2개 (한 번의 ALTER)
ALTER TABLE user_profiles
  ADD COLUMN identity_ci_hash CHAR(64) NULL
    COMMENT 'CI HMAC-SHA256 hex. 원문 CI 비보관' AFTER phone_verification_requested_at,
  ADD COLUMN identity_verified_at DATETIME NULL
    COMMENT '본인인증 완료 시각' AFTER identity_ci_hash,
  ADD COLUMN identity_provider VARCHAR(32) NULL
    COMMENT '예: inicis_unified' AFTER identity_verified_at,
  ADD COLUMN identity_tx_id VARCHAR(128) NULL
    COMMENT '포트원 identityVerificationId' AFTER identity_provider,
  ADD COLUMN identity_name VARCHAR(100) NULL
    COMMENT '인증 성명' AFTER identity_tx_id,
  ADD UNIQUE KEY uq_user_profiles_identity_ci_hash (identity_ci_hash),
  ADD UNIQUE KEY uq_user_profiles_identity_tx_id (identity_tx_id);

-- 2) 신규 기본값 paused (공부방·과외)
ALTER TABLE study_rooms
  MODIFY COLUMN inquiry_status ENUM('open', 'paused', 'capacity_full', 'waiting_only')
    NOT NULL DEFAULT 'paused'
    COMMENT '쪽지 수신: 신규 기본 paused(365 본인인증 후 open)';

ALTER TABLE tutors
  MODIFY COLUMN inquiry_status ENUM('open', 'paused', 'not_accepting')
    NOT NULL DEFAULT 'paused'
    COMMENT '과외쌤 쪽지 수신: 신규 기본 paused(365 본인인증 후 open)';

-- 3) 백업 표
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

-- 4) INSERT — open 이면서 미인증(프로필 없음 포함)만 백업
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

-- 5) UPDATE — 백업된 행만 paused
UPDATE study_rooms sr
  INNER JOIN _088_backup_study_rooms_inquiry b ON b.id = sr.id
   SET sr.inquiry_status = 'paused'
 WHERE sr.inquiry_status = 'open';

UPDATE tutors t
  INNER JOIN _088_backup_tutors_inquiry b ON b.id = t.id
   SET t.inquiry_status = 'paused'
 WHERE t.inquiry_status = 'open';
