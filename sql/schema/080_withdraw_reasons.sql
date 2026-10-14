-- =============================================================================
-- 080 — 탈퇴 사유 받기 (정본 74 §1-4)
-- Actions는 이 SQL을 실행하지 않는다. 운영 phpMyAdmin에서 적용한다.
-- 새 표 2개만 만든다. 기존 표는 건드리지 않는다. 이미 있으면 건너뛴다.
-- 적용 전에 배포돼도 탈퇴·탈퇴 완료 메일은 그대로 동작한다(사유 칸·메일 링크만 빠짐).
-- 되돌리기: DROP TABLE IF EXISTS withdraw_reason_links; DROP TABLE IF EXISTS withdraw_reasons;
--
-- 관리자는 누가 남긴 사유인지 본다(2026-10-14 사용자 결정): 탈퇴 회원 번호(user_id)를 함께 둔다.
-- 이메일·연락처는 두지 않는다(탈퇴 때 지워짐). 회원 번호는 답한 날로부터 1년이 지나면 NULL로 지운다
-- (개인정보처리방침 「개인정보 보유 및 이용 기간」). users 와 외래 키는 걸지 않는다 — 회원 정리 SQL을 막지 않게.
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
     user_id BIGINT UNSIGNED NULL COMMENT ''탈퇴 회원 번호. 답한 날로부터 1년이 지나면 NULL'',
     role_type VARCHAR(20) NOT NULL DEFAULT '''' COMMENT ''study_room | tutor | student | 빈 값(역할 모름)'',
     reason_code VARCHAR(40) NOT NULL,
     reason_note VARCHAR(100) NULL COMMENT ''기타 한 줄. reason_code = other 일 때만'',
     source VARCHAR(10) NOT NULL COMMENT ''withdraw(탈퇴 화면) | mail(탈퇴 완료 메일 링크)'',
     answered_on DATE NOT NULL COMMENT ''답한 날(KST)'',
     PRIMARY KEY (id),
     KEY idx_withdraw_reasons_on (answered_on, role_type),
     KEY idx_withdraw_reasons_user (user_id)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
     COMMENT=''탈퇴 사유. 회원 번호는 1년 보관(정본 74).''',
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
     user_id BIGINT UNSIGNED NULL COMMENT ''탈퇴 회원 번호 — 답하면 사유에 옮긴다'',
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
