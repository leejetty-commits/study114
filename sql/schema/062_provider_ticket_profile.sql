-- =============================================================================
-- 062 — 쪽지권 프로필 귀속 · 즉시발송 문맥 (PR-B)
-- Apply AFTER 056 (provider 문맥) · 061은 주문 스냅샷이라 독립
-- 운영 DB에는 수동 승인 전까지 적용하지 않는다.
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

-- 프로필 문맥
SET @c1 := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'provider_ticket_packs'
    AND COLUMN_NAME = 'provider_type'
);
SET @s1 := IF(@c1 = 0,
  'ALTER TABLE provider_ticket_packs
     ADD COLUMN provider_type ENUM(''study_room'',''tutor'') NULL AFTER user_id,
     ADD COLUMN provider_id BIGINT UNSIGNED NULL AFTER provider_type,
     ADD COLUMN source_order_ref VARCHAR(36) NULL AFTER source,
     ADD COLUMN grant_kind VARCHAR(32) NULL AFTER source_order_ref,
     ADD KEY idx_ticket_packs_provider (provider_type, provider_id, ticket_type, expires_at)',
  'SELECT 1');
PREPARE ps1 FROM @s1; EXECUTE ps1; DEALLOCATE PREPARE ps1;

UPDATE provider_ticket_packs
SET grant_kind = CASE
      WHEN source = 'payment' THEN 'payment_pack'
      WHEN source = 'position_bundle' THEN 'position_bundle'
      WHEN source = 'manual' THEN 'manual'
      WHEN source = 'migration' THEN 'migration'
      ELSE COALESCE(grant_kind, source)
    END
WHERE grant_kind IS NULL;

-- 소유 프로필이 정확히 1개(과외쌤만)인 user의 기존 팩만 tutor로 backfill
UPDATE provider_ticket_packs p
INNER JOIN (
  SELECT user_id, MIN(id) AS pid
  FROM tutors
  GROUP BY user_id
  HAVING COUNT(*) = 1
) t ON t.user_id = p.user_id
LEFT JOIN study_rooms sr
  ON sr.user_id = p.user_id AND sr.deleted_at IS NULL
SET p.provider_type = 'tutor', p.provider_id = t.pid
WHERE p.provider_id IS NULL
  AND sr.id IS NULL;

-- 소유 프로필이 정확히 1개(공부방만)인 user의 기존 팩만 study_room으로 backfill
UPDATE provider_ticket_packs p
INNER JOIN (
  SELECT user_id, MIN(id) AS pid
  FROM study_rooms
  WHERE deleted_at IS NULL
  GROUP BY user_id
  HAVING COUNT(*) = 1
) r ON r.user_id = p.user_id
LEFT JOIN tutors tu ON tu.user_id = p.user_id
SET p.provider_type = 'study_room', p.provider_id = r.pid
WHERE p.provider_id IS NULL
  AND tu.id IS NULL;

CREATE TABLE IF NOT EXISTS provider_immediate_memo_intents (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_ref          VARCHAR(36)     NOT NULL,
  user_id            BIGINT UNSIGNED NOT NULL,
  provider_type      ENUM('study_room','tutor') NOT NULL,
  provider_id        BIGINT UNSIGNED NOT NULL,
  student_id         BIGINT UNSIGNED NOT NULL,
  context_kind       VARCHAR(32)     NOT NULL DEFAULT 'student',
  body               TEXT            NOT NULL,
  context_label      VARCHAR(200)    NULL,
  peer_display_name  VARCHAR(100)    NULL,
  dispatch_status    ENUM('pending','sent','failed','blocked') NOT NULL DEFAULT 'pending',
  fail_reason        VARCHAR(255)    NULL,
  retryable          TINYINT(1)      NOT NULL DEFAULT 0,
  thread_id          BIGINT UNSIGNED NULL,
  created_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at            DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_immediate_order_ref (order_ref),
  KEY idx_immediate_user (user_id, dispatch_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='PR-B · 1회 즉시권 발송 문맥 (가격 스냅샷과 분리)';
