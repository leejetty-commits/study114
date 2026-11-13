-- =============================================================================
-- study114 schema 090 — 포트원 PG 메타 컬럼 (추가만)
-- 종현이 phpMyAdmin에서 089 뒤에 적용. Actions는 이 SQL을 실행하지 않는다.
-- 롤백은 091 다음 090.
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

ALTER TABLE provider_payment_orders
  ADD COLUMN pg_payment_id VARCHAR(64) NULL DEFAULT NULL
    COMMENT '339: 포트원 paymentId (주문번호 기반)' AFTER pg_provider,
  ADD UNIQUE KEY uk_payment_orders_pg_payment_id (pg_payment_id);

ALTER TABLE provider_refund_requests
  ADD COLUMN pg_cancel_id VARCHAR(64) NULL DEFAULT NULL
    COMMENT '339: 포트원 취소 ID' AFTER refunded_at,
  ADD COLUMN pg_cancelled_at DATETIME NULL DEFAULT NULL
    COMMENT '339: 포트원 취소 시각' AFTER pg_cancel_id,
  ADD COLUMN pg_cancel_amount_won INT UNSIGNED NULL DEFAULT NULL
    COMMENT '339: 누적 취소 금액(원)' AFTER pg_cancelled_at,
  ADD COLUMN pg_remaining_won INT UNSIGNED NULL DEFAULT NULL
    COMMENT '339: 취소 후 남은 금액(원)' AFTER pg_cancel_amount_won;
