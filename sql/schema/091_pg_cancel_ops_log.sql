-- =============================================================================
-- study114 schema 091 — 포트원 취소 ops 로그 (트랜잭션 롤백과 분리 기록용)
-- 090_pg_portone_columns.sql 다음. 종현이 phpMyAdmin에서 089 뒤에 적용.
-- Actions는 이 SQL을 실행하지 않는다.
-- 롤백은 이 파일(091)을 090보다 먼저.
-- 키·카드정보 저장 금지. paymentId · cancel_id · 금액만.
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS provider_pg_cancel_ops_log (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  payment_id   VARCHAR(64)     NOT NULL,
  cancel_id    VARCHAR(64)     NOT NULL,
  amount_won   INT UNSIGNED    NOT NULL DEFAULT 0,
  order_ref    VARCHAR(36)     NULL,
  note         VARCHAR(128)    NULL COMMENT 'orphan_after_meta_fail · orphan_after_later_fail 등',
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pg_cancel_ops_payment (payment_id, created_at),
  KEY idx_pg_cancel_ops_order (order_ref)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='339: 포트원 취소 성공 후 DB 저장 실패·롤백 대비 ops 기록';
