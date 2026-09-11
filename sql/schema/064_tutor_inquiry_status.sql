-- =============================================================================
-- 064 — 과외쌤 쪽지 수신 상태 (P21-05) 배포 전 필수
-- Actions는 이 SQL을 실행하지 않는다. 운영 phpMyAdmin에서 먼저 적용한다.
-- 미적용 시 PATCH inquiry_status 는 schema_missing(503)으로 실패한다.
--
-- open          = 쪽지 받는 중
-- paused        = 잠시 쉼 (일시 중단. 다시 열 수 있음) · DEFAULT
-- not_accepting = 신규 학생 안 받음 (신규 모집을 닫음. paused와 다른 운영 상태)
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

SET @c1 := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tutors'
    AND COLUMN_NAME = 'inquiry_status'
);
SET @s1 := IF(@c1 = 0,
  'ALTER TABLE tutors
     ADD COLUMN inquiry_status ENUM(''open'',''paused'',''not_accepting'') NOT NULL DEFAULT ''paused''
     COMMENT ''과외쌤 쪽지 수신: open=받는 중, paused=잠시 쉼(일시 중단), not_accepting=신규 학생 안 받음(신규 모집 닫힘)''
     AFTER profile_status',
  'SELECT 1');
PREPARE ps1 FROM @s1; EXECUTE ps1; DEALLOCATE PREPARE ps1;
