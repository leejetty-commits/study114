-- =============================================================================
-- study114 schema 039 — Prime/Pick 기간: day / calendar month + end_exclusive
-- Apply AFTER 038_dual_capability_admin.sql
-- SSOT: 18b 기간군 2주·3주·1·2·3개월 · 포함형 표시 / end_exclusive 저장
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

ALTER TABLE provider_position_subscriptions
  ADD COLUMN duration_type ENUM('day', 'month') NOT NULL DEFAULT 'day'
    COMMENT 'day=일수형 · month=calendar month' AFTER sku_code,
  ADD COLUMN duration_value INT UNSIGNED NOT NULL DEFAULT 0
    COMMENT 'day면 일수 · month면 개월 수' AFTER duration_type,
  ADD COLUMN started_on DATE NULL
    COMMENT '이용 시작일(날짜)' AFTER period_days,
  ADD COLUMN end_exclusive_on DATE NULL
    COMMENT '만료 반개구간 끝 · CURDATE() < end_exclusive_on 이면 활성' AFTER started_on;

-- 기존 행: starts_at/ends_at(+N DAY)를 day 타입 end_exclusive로 정규화
UPDATE provider_position_subscriptions
SET
  started_on = DATE(starts_at),
  end_exclusive_on = DATE(ends_at),
  duration_type = 'day',
  duration_value = CASE WHEN period_days > 0 THEN period_days ELSE 1 END
WHERE started_on IS NULL OR end_exclusive_on IS NULL;

UPDATE provider_position_subscriptions
SET
  starts_at = TIMESTAMP(started_on),
  ends_at = TIMESTAMP(end_exclusive_on)
WHERE started_on IS NOT NULL AND end_exclusive_on IS NOT NULL;

ALTER TABLE provider_position_subscriptions
  MODIFY COLUMN started_on DATE NOT NULL,
  MODIFY COLUMN end_exclusive_on DATE NOT NULL,
  ADD KEY idx_position_user_end_exclusive (user_id, end_exclusive_on);
