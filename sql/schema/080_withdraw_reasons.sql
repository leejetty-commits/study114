-- =============================================================================
-- 080 — 탈퇴 사유 받기 (정본 74 §1-4)
-- Actions는 이 SQL을 실행하지 않는다. 운영 phpMyAdmin에서 적용한다.
-- 새 표 2개만 만든다. 기존 표는 건드리지 않는다. 이미 있으면 건너뛴다.
-- 적용 전에 배포돼도 탈퇴·탈퇴 완료 메일은 그대로 동작한다(사유 칸·메일 링크만 빠짐).
-- 되돌리기: DROP TABLE IF EXISTS withdraw_reason_links; DROP TABLE IF EXISTS withdraw_reasons;
--
-- 누가 남겼는지 알 수 없게: 두 표 모두 회원 번호·이메일을 두지 않는다.
-- 사유는 날짜(KST)만 남긴다 — 시각을 남기면 탈퇴 기록과 맞춰 볼 수 있다.
-- =============================================================================
USE study114;

SET NAMES utf8mb4;

SET @t := (
  SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'withdraw_reasons'
);
SET @s := IF(@t = 0,
  'CREATE TABLE withdraw_reasons (
     id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
     role_type VARCHAR(20) NOT NULL DEFAULT '''' COMMENT ''study_room | tutor | student | 빈 값(역할 모름)'',
     reason_code VARCHAR(40) NOT NULL,
     reason_note VARCHAR(100) NULL COMMENT ''기타 한 줄. reason_code = other 일 때만'',
     source VARCHAR(10) NOT NULL COMMENT ''withdraw(탈퇴 화면) | mail(탈퇴 완료 메일 링크)'',
     answered_on DATE NOT NULL COMMENT ''KST 날짜만'',
     PRIMARY KEY (id),
     KEY idx_withdraw_reasons_on (answered_on, role_type)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
     COMMENT=''탈퇴 사유. 회원과 연결하지 않는다(정본 74).''',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @t := (
  SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'withdraw_reason_links'
);
SET @s := IF(@t = 0,
  'CREATE TABLE withdraw_reason_links (
     id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
     token_hash CHAR(64) NOT NULL COMMENT ''메일 링크 값의 sha256. 원래 값은 메일에만 있다'',
     role_type VARCHAR(20) NOT NULL DEFAULT '''',
     expires_at DATETIME NOT NULL COMMENT ''KST. 만든 때 + 30일'',
     PRIMARY KEY (id),
     UNIQUE KEY uq_withdraw_reason_links_token (token_hash),
     KEY idx_withdraw_reason_links_expires (expires_at)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
     COMMENT=''탈퇴 완료 메일의 사유 받기 링크. 한 번 쓰면 행을 지운다.''',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

-- 확인
SHOW TABLES LIKE 'withdraw_reason%';
