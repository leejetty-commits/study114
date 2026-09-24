-- =============================================================================
-- 069 — 홈 팝업 (Phase 3)
-- Actions는 이 SQL을 실행하지 않는다. 로컬은 study114_dev에만 적용한다.
-- 시드 INSERT 없음. published 기본 0.
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS home_popups (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(10) NOT NULL,
  family CHAR(1) NOT NULL DEFAULT 'a',
  audience VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  start_at DATE NULL,
  end_at DATE NULL,
  published TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_home_popups_pub (published, start_at, end_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
