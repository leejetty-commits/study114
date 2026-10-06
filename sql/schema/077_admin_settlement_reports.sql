-- =============================================================================
-- 077 — 관리자 보고서(162) 일·주·월 스냅샷
-- Actions는 이 SQL을 실행하지 않는다. 운영 phpMyAdmin에서 배포 전에 먼저 적용한다.
-- 이미 있으면 건너뛴다. 되돌리기: DROP TABLE IF EXISTS admin_settlement_reports;
-- =============================================================================
USE study114;

SET NAMES utf8mb4;

SET @t := (
  SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_settlement_reports'
);
SET @s := IF(@t = 0,
  'CREATE TABLE admin_settlement_reports (
     id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
     period_kind ENUM(''day'',''week'',''month'') NOT NULL,
     period_start DATE NOT NULL COMMENT ''KST 기간 시작일'',
     period_end DATE NOT NULL COMMENT ''KST 기간 마지막 날(포함)'',
     pay_count INT UNSIGNED NOT NULL DEFAULT 0,
     pay_amount_won BIGINT UNSIGNED NOT NULL DEFAULT 0,
     pay_study_room_count INT UNSIGNED NOT NULL DEFAULT 0,
     pay_study_room_amount_won BIGINT UNSIGNED NOT NULL DEFAULT 0,
     pay_tutor_count INT UNSIGNED NOT NULL DEFAULT 0,
     pay_tutor_amount_won BIGINT UNSIGNED NOT NULL DEFAULT 0,
     pay_student_count INT UNSIGNED NOT NULL DEFAULT 0,
     pay_student_amount_won BIGINT UNSIGNED NOT NULL DEFAULT 0,
     pay_unknown_count INT UNSIGNED NOT NULL DEFAULT 0,
     pay_unknown_amount_won BIGINT UNSIGNED NOT NULL DEFAULT 0,
     inquiry_count INT UNSIGNED NULL COMMENT ''일간=생성 순간 open+in_progress, 주·월=기간 신규. 보충 행은 NULL'',
     report_count INT UNSIGNED NULL COMMENT ''일간=생성 순간 open+protect, 주·월=기간 신규. 보충 행은 NULL'',
     reg_study_room_count INT UNSIGNED NOT NULL DEFAULT 0,
     reg_tutor_count INT UNSIGNED NOT NULL DEFAULT 0,
     reg_student_count INT UNSIGNED NOT NULL DEFAULT 0,
     withdraw_total INT UNSIGNED NOT NULL DEFAULT 0 COMMENT ''계정 수'',
     withdraw_study_room_count INT UNSIGNED NOT NULL DEFAULT 0,
     withdraw_tutor_count INT UNSIGNED NOT NULL DEFAULT 0,
     withdraw_student_count INT UNSIGNED NOT NULL DEFAULT 0,
     delete_total INT UNSIGNED NOT NULL DEFAULT 0 COMMENT ''계정 수'',
     delete_study_room_count INT UNSIGNED NOT NULL DEFAULT 0,
     delete_tutor_count INT UNSIGNED NOT NULL DEFAULT 0,
     delete_student_count INT UNSIGNED NOT NULL DEFAULT 0,
     delete_unknown_count INT UNSIGNED NOT NULL DEFAULT 0,
     home_popup_count INT UNSIGNED NULL COMMENT ''생성 순간 켜진 팝업. 보충 행은 NULL'',
     snapshot_json JSON NULL COMMENT ''자세히 보기 목록 id·시간대 측정값'',
     is_backfill TINYINT(1) NOT NULL DEFAULT 0,
     mail_status ENUM(''pending'',''sending'',''sent'',''failed'',''skipped'') NOT NULL DEFAULT ''pending'',
     mail_claimed_at DATETIME NULL,
     mail_sent_at DATETIME NULL,
     mail_error VARCHAR(255) NULL,
     created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
     PRIMARY KEY (id),
     UNIQUE KEY uk_settlement_period (period_kind, period_start),
     KEY idx_settlement_mail (mail_status, period_end)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
     COMMENT=''162 보고서 5줄 스냅샷. 화면·인쇄·메일은 이 행을 읽는다.''',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

-- 확인
SHOW TABLES LIKE 'admin_settlement_reports';
SHOW INDEX FROM admin_settlement_reports WHERE Key_name = 'uk_settlement_period';
