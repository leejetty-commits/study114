-- PR-A CI 전용 임시 DB. 운영에 적용하지 않는다.
-- 031 주문 테이블 + 056 provider 컬럼까지. 061(catalog_version)은 별도 적용.

CREATE DATABASE IF NOT EXISTS study114
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE study114;
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS provider_paid_badges;
DROP TABLE IF EXISTS provider_position_subscriptions;
DROP TABLE IF EXISTS provider_ticket_packs;
DROP TABLE IF EXISTS provider_payment_orders;
DROP TABLE IF EXISTS study_rooms;
DROP TABLE IF EXISTS tutors;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL DEFAULT '',
  status ENUM('active', 'inactive', 'withdrawn') NOT NULL DEFAULT 'active',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE tutors (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  tutor_display_name VARCHAR(50) NOT NULL DEFAULT 'e2e',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE study_rooms (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE provider_payment_orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  order_ref VARCHAR(36) NOT NULL,
  product_id VARCHAR(32) NOT NULL,
  variant_label VARCHAR(32) NOT NULL,
  product_kind ENUM('position', 'count', 'badge_addon') NOT NULL,
  provider_type ENUM('study_room', 'tutor') NULL,
  provider_id BIGINT UNSIGNED NULL,
  amount_won INT UNSIGNED NOT NULL DEFAULT 10,
  status ENUM('pending', 'paid', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
  pg_provider VARCHAR(32) NOT NULL DEFAULT 'dev_mock',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_payment_order_ref (order_ref)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE provider_position_subscriptions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  sku_code ENUM('prime', 'pick') NOT NULL,
  duration_type ENUM('day', 'month') NOT NULL DEFAULT 'month',
  duration_value INT UNSIGNED NOT NULL DEFAULT 1,
  period_days INT UNSIGNED NOT NULL DEFAULT 30,
  started_on DATE NOT NULL,
  end_exclusive_on DATE NOT NULL,
  starts_at DATETIME NOT NULL,
  ends_at DATETIME NOT NULL,
  provider_type ENUM('study_room', 'tutor') NULL,
  provider_id BIGINT UNSIGNED NULL,
  source VARCHAR(32) NOT NULL DEFAULT 'manual',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE provider_paid_badges (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  provider_type ENUM('study_room', 'tutor') NOT NULL,
  provider_id BIGINT UNSIGNED NOT NULL,
  badge_code VARCHAR(32) NOT NULL,
  status ENUM('active', 'revoked') NOT NULL DEFAULT 'active',
  starts_on DATE NOT NULL,
  end_exclusive_on DATE NOT NULL,
  source_order_ref VARCHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at DATETIME NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE provider_ticket_packs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  ticket_type ENUM('memo', 'request_view') NOT NULL,
  pack_size INT UNSIGNED NOT NULL,
  remaining INT UNSIGNED NOT NULL,
  purchased_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  source VARCHAR(32) NOT NULL DEFAULT 'manual',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO users (id, email) VALUES (4, 'tutor-owner1@dev.local');
INSERT INTO tutors (id, user_id) VALUES (1, 4);
INSERT INTO study_rooms (id, user_id, deleted_at) VALUES (1, 4, NULL);
INSERT INTO provider_position_subscriptions
  (user_id, sku_code, duration_type, duration_value, period_days,
   started_on, end_exclusive_on, starts_at, ends_at, provider_type, provider_id, source)
VALUES
  (4, 'pick', 'month', 1, 30, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 MONTH),
   NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH), 'tutor', 1, 'manual');
