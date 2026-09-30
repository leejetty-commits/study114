-- =============================================================================
-- 071 — 회원 삭제 시 결제·구독 이력 익명 보존
-- Actions는 이 SQL을 실행하지 않는다. 운영 DB 적용은 사람이 한다.
-- user_id FK(ON DELETE CASCADE)를 풀고 NULL을 허용한다.
-- 삭제된 회원 번호와 성+○○ 표시명만 남긴다. 이메일·전화·실명은 넣지 않는다.
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

-- provider_payment_orders
SET @fk1 := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'provider_payment_orders'
    AND CONSTRAINT_NAME = 'fk_payment_orders_user'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @s1 := IF(@fk1 > 0,
  'ALTER TABLE provider_payment_orders DROP FOREIGN KEY fk_payment_orders_user',
  'SELECT 1');
PREPARE ps1 FROM @s1; EXECUTE ps1; DEALLOCATE PREPARE ps1;

SET @n1 := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'provider_payment_orders'
    AND COLUMN_NAME = 'user_id'
    AND IS_NULLABLE = 'NO'
);
SET @s2 := IF(@n1 > 0,
  'ALTER TABLE provider_payment_orders MODIFY user_id BIGINT UNSIGNED NULL',
  'SELECT 1');
PREPARE ps2 FROM @s2; EXECUTE ps2; DEALLOCATE PREPARE ps2;

SET @c1 := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'provider_payment_orders'
    AND COLUMN_NAME = 'deleted_user_ref'
);
SET @s3 := IF(@c1 = 0,
  'ALTER TABLE provider_payment_orders
     ADD COLUMN deleted_user_ref BIGINT UNSIGNED NULL
       COMMENT ''삭제된 users.id. FK 아님'' AFTER user_id,
     ADD COLUMN deleted_display_name VARCHAR(32) NULL
       COMMENT ''성+○○. 이메일·전화·실명 없음'' AFTER deleted_user_ref',
  'SELECT 1');
PREPARE ps3 FROM @s3; EXECUTE ps3; DEALLOCATE PREPARE ps3;

-- provider_position_subscriptions
SET @fk2 := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'provider_position_subscriptions'
    AND CONSTRAINT_NAME = 'fk_position_subs_user'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @s4 := IF(@fk2 > 0,
  'ALTER TABLE provider_position_subscriptions DROP FOREIGN KEY fk_position_subs_user',
  'SELECT 1');
PREPARE ps4 FROM @s4; EXECUTE ps4; DEALLOCATE PREPARE ps4;

SET @n2 := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'provider_position_subscriptions'
    AND COLUMN_NAME = 'user_id'
    AND IS_NULLABLE = 'NO'
);
SET @s5 := IF(@n2 > 0,
  'ALTER TABLE provider_position_subscriptions MODIFY user_id BIGINT UNSIGNED NULL',
  'SELECT 1');
PREPARE ps5 FROM @s5; EXECUTE ps5; DEALLOCATE PREPARE ps5;

SET @c2 := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'provider_position_subscriptions'
    AND COLUMN_NAME = 'deleted_user_ref'
);
SET @s6 := IF(@c2 = 0,
  'ALTER TABLE provider_position_subscriptions
     ADD COLUMN deleted_user_ref BIGINT UNSIGNED NULL
       COMMENT ''삭제된 users.id. FK 아님'' AFTER user_id,
     ADD COLUMN deleted_display_name VARCHAR(32) NULL
       COMMENT ''성+○○. 이메일·전화·실명 없음'' AFTER deleted_user_ref',
  'SELECT 1');
PREPARE ps6 FROM @s6; EXECUTE ps6; DEALLOCATE PREPARE ps6;
