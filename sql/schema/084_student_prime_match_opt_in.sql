-- =============================================================================
-- 084 — 학생 프라임 추천 동의 (C-03)
-- Actions는 이 SQL을 실행하지 않는다. 운영 phpMyAdmin에서 먼저 적용한다.
-- 기본 0(체크 해제). 0이면 프라임 과외쌤 요약 프로필 쪽지 추천 대상에서 빠진다.
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

SET @c1 := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students'
    AND COLUMN_NAME = 'prime_match_opt_in'
);
SET @s1 := IF(@c1 = 0,
  'ALTER TABLE students
     ADD COLUMN prime_match_opt_in TINYINT(1) NOT NULL DEFAULT 0
     COMMENT ''프라임 과외쌤에게 요약 프로필 쪽지 추천 동의. 0=대상 제외''
     AFTER request_summary',
  'SELECT 1');
PREPARE ps1 FROM @s1; EXECUTE ps1; DEALLOCATE PREPARE ps1;
