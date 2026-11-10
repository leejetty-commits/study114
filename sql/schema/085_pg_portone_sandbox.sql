-- =============================================================================
-- study114 schema 085 — 포트원 샌드박스용 PG 메타 컬럼 (추가만)
-- Apply AFTER 084_student_prime_match_opt_in.sql
-- Ticket: 339 — 로컬 Docker DB만 적용. 운영 DB 적용 금지.
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
