-- =============================================================================
-- 070 — 사이트 기본 (점검·배너·약관·가입 차단)
-- Actions는 이 SQL을 실행하지 않는다. 운영 DB 적용은 사람이 한다.
-- 시드 INSERT 없음. 행이 없으면 손님 화면은 점검 없음·정적 약관.
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS site_settings (
  setting_key VARCHAR(64) NOT NULL,
  value_json JSON NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by VARCHAR(190) NULL,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
