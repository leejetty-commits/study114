-- =============================================================================
-- 076 backfill — support_tickets.user_id
-- Actions는 이 SQL을 실행하지 않는다. 운영 phpMyAdmin에서 076 본문 다음에 적용한다.
-- 1건만 맞는 행만 채운다. 0건·2건 이상·탈퇴(withdrawn.*) 행은 NULL.
-- 비교는 LOWER(TRIM(email)) — EmailNormalizer.php 와 같다.
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

-- (1) 적용 전 건수
SELECT
  COUNT(*) AS total,
  SUM(n = 1) AS one_match,
  SUM(n = 0) AS zero_match,
  SUM(n >= 2) AS many_match
FROM (
  SELECT
    st.id,
    CASE
      WHEN st.email LIKE 'withdrawn.%@users.study114.local' THEN 0
      ELSE (
        SELECT COUNT(*)
        FROM users u
        WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(st.email))
          AND u.email NOT LIKE 'withdrawn.%@users.study114.local'
      )
    END AS n
  FROM support_tickets st
) counted;

-- (2) 1건만 맞는 행
UPDATE support_tickets st
INNER JOIN (
  SELECT LOWER(TRIM(email)) AS email_key, MIN(id) AS user_id, COUNT(*) AS n
  FROM users
  WHERE email NOT LIKE 'withdrawn.%@users.study114.local'
  GROUP BY LOWER(TRIM(email))
  HAVING n = 1
) matched ON LOWER(TRIM(st.email)) = matched.email_key
SET st.user_id = matched.user_id
WHERE st.user_id IS NULL
  AND st.email NOT LIKE 'withdrawn.%@users.study114.local';

-- (3) 결과. SUM(user_id IS NOT NULL) 이 (1)의 one_match 와 같아야 한다.
SELECT SUM(user_id IS NOT NULL) AS filled
FROM support_tickets;
