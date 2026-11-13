-- H1 운영 확인용 (읽기 전용). phpMyAdmin > study114 DB > SQL 탭에서 한 줄씩 실행.
-- 새 SQL 적용은 없음. 아래 결과만 캡처해서 알려 주세요.

-- 1) status 에 cancelled 가 들어 있는지 (Type 칸에 'cancelled' 가 보여야 함)
SHOW COLUMNS FROM provider_payment_orders LIKE 'status';

-- 2) 지급 상태 컬럼 2개가 있는지 (2줄 나와야 함)
SHOW COLUMNS FROM provider_payment_orders LIKE 'fulfillment%';

-- 3) 포트원 결제번호 컬럼 (090) 이 있는지 (1줄)
SHOW COLUMNS FROM provider_payment_orders LIKE 'pg_payment_id';

-- 4) 취소 기록 테이블 (091) 이 있는지 (1줄)
SHOW TABLES LIKE 'provider_pg_cancel_ops_log';
