-- =============================================================================
-- 12 — 관리자 「통계」 숫자 대조용 SQL (읽기 전용 · SELECT만)
-- 작성: 2026-11-19 KST · 우동공과3 · 코드 기준 origin/main 8b52282c
-- 지시서: docs/handoff/12-admin-stats-min.md
--
-- 사용법 (dothome phpMyAdmin → study114 DB → SQL 탭)
--   1) 아래 ★ 한 곳에 테스트 계정 이메일을 쉼표로 붙여 넣는다.
--      값의 출처: 서버 env STUDY114_TEST_ACCOUNT_EMAILS (TestAccountAllowlist가 읽는 값.
--      DB에는 이 목록이 없다). 비워 두면 테스트 제외 없이 센다.
--   2) 파일 전체를 한 번에 붙여 넣고 실행한다. (@변수는 한 번 실행 안에서만 유지된다.
--      블록 하나만 돌릴 때도 0단계를 같이 붙여 넣는다.)
--   3) 결과 탭별로 화면 숫자와 대조한다. 금액은 원 · 천원 둘 다 보여 준다.
--
-- 이 파일은 INSERT/UPDATE/DELETE/ALTER/CREATE를 쓰지 않는다. 표를 만들지 않는다.
-- 공통 제외(회원 집계): 탈퇴(status='withdrawn')·deleted_at 있음·운영자(admin_level 또는 admin 역할)·테스트 계정.
-- 결제 집계만: 테스트·운영자 주문은 빼고, 탈퇴/삭제 회원(user_id NULL 포함) 주문은 넣는다.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0단계 — 설정 (★ 여기 한 곳만 고친다)
-- -----------------------------------------------------------------------------
SET @test_emails := '';   -- ★ 예: 'a@example.com,b@example.com'  (따옴표 안에 쉼표 구분)

SET @t := CONVERT(LOWER(REPLACE(REPLACE(REPLACE(@test_emails, ' ', ''), '\r', ''), '\n', '')) USING utf8mb4) COLLATE utf8mb4_unicode_ci;
SET @days := 14;          -- B 기간 (7 / 14 / 30 중 화면과 같은 값)

-- KST 처리: DB 저장 시각(created_at 기본값)은 DB 세션 시간대다. 코드(ReportPeriod)와 같은 식으로 맞춘다.
SET @db_off := TIMESTAMPDIFF(MINUTE, UTC_TIMESTAMP(), NOW());           -- ReportPeriod::dbOffsetMinutes()
SET @kst_today := DATE(DATE_ADD(UTC_TIMESTAMP(), INTERVAL 540 MINUTE));  -- 오늘(KST)
SET @today_start_db := DATE_ADD(DATE_SUB(TIMESTAMP(@kst_today), INTERVAL 540 MINUTE), INTERVAL @db_off MINUTE); -- toStorage(KST 00:00,'db')
SET @tomorrow_start_db := DATE_ADD(@today_start_db, INTERVAL 1 DAY);
SET @range_start_db := DATE_SUB(@today_start_db, INTERVAL (@days - 1) DAY);

-- 0-1. 시간대 확인 (CURDATE가 KST 오늘과 다르면 노출 구독 판정이 하루 어긋날 수 있다 → 종현에게 보고)
SELECT NOW() AS db_now, UTC_TIMESTAMP() AS utc_now, @db_off AS db_offset_min,
       CURDATE() AS db_curdate, @kst_today AS kst_today,
       (CURDATE() = @kst_today) AS curdate_is_kst,
       @today_start_db AS today_start_db, @range_start_db AS range_start_db;

-- 0-2. 테스트 계정 매칭 확인 (이메일은 출력하지 않는다 · 붙여 넣은 개수와 찾은 개수 비교)
SELECT
  IF(@t = '', 0, LENGTH(@t) - LENGTH(REPLACE(@t, ',', '')) + 1) AS pasted_emails,
  (SELECT COUNT(*) FROM users u
    WHERE FIND_IN_SET(LOWER(TRIM(u.email)) COLLATE utf8mb4_unicode_ci, @t) > 0) AS matched_users,
  (SELECT GROUP_CONCAT(u.id ORDER BY u.id) FROM users u
    WHERE FIND_IN_SET(LOWER(TRIM(u.email)) COLLATE utf8mb4_unicode_ci, @t) > 0) AS matched_user_ids;

-- 0-3. 시·도 이름 확인 (C 표의 행 이름은 regions.sido_name 저장값 그대로다)
SELECT DISTINCT sido_name FROM regions ORDER BY sido_name;

-- =============================================================================
-- A. 상단 6개
-- =============================================================================

-- A1 전체 회원 · A2 오늘 가입
SELECT
  COUNT(*) AS a1_members_total,
  SUM(u.created_at >= @today_start_db AND u.created_at < @tomorrow_start_db) AS a2_signups_today
FROM users u
WHERE u.status <> 'withdrawn' AND u.deleted_at IS NULL
  AND u.admin_level IS NULL
  AND NOT EXISTS (SELECT 1 FROM user_roles ra WHERE ra.user_id = u.id AND ra.role_type = 'admin')
  AND FIND_IN_SET(LOWER(TRIM(u.email)) COLLATE utf8mb4_unicode_ci, @t) = 0;

-- A3 등록 카드 (BasicCardRegisteredQuery 조건에서 기간만 뺌 · 카드 주인 제외 규칙 적용)
SELECT
  (SELECT COUNT(*) FROM study_rooms sr JOIN users u ON u.id = sr.user_id
    WHERE sr.deleted_at IS NULL
      AND EXISTS (SELECT 1 FROM study_room_regions r WHERE r.study_room_id = sr.id AND r.slot = 1 AND r.region_id IS NOT NULL AND r.region_id <> 0)
      AND u.status <> 'withdrawn' AND u.deleted_at IS NULL AND u.admin_level IS NULL
      AND NOT EXISTS (SELECT 1 FROM user_roles ra WHERE ra.user_id = u.id AND ra.role_type = 'admin')
      AND FIND_IN_SET(LOWER(TRIM(u.email)) COLLATE utf8mb4_unicode_ci, @t) = 0) AS a3_study_room,
  (SELECT COUNT(*) FROM tutors t JOIN users u ON u.id = t.user_id
    WHERE EXISTS (SELECT 1 FROM tutor_regions r WHERE r.tutor_id = t.id AND r.priority_order = 0 AND r.region_id IS NOT NULL AND r.region_id <> 0)
      AND u.status <> 'withdrawn' AND u.deleted_at IS NULL AND u.admin_level IS NULL
      AND NOT EXISTS (SELECT 1 FROM user_roles ra WHERE ra.user_id = u.id AND ra.role_type = 'admin')
      AND FIND_IN_SET(LOWER(TRIM(u.email)) COLLATE utf8mb4_unicode_ci, @t) = 0) AS a3_tutor,
  (SELECT COUNT(*) FROM students s JOIN users u ON u.id = s.guardian_user_id
    WHERE s.published_at IS NOT NULL AND s.deleted_at IS NULL
      AND u.status <> 'withdrawn' AND u.deleted_at IS NULL AND u.admin_level IS NULL
      AND NOT EXISTS (SELECT 1 FROM user_roles ra WHERE ra.user_id = u.id AND ra.role_type = 'admin')
      AND FIND_IN_SET(LOWER(TRIM(u.email)) COLLATE utf8mb4_unicode_ci, @t) = 0) AS a3_student;

-- A4 유료 이용 중 (활성 = CURDATE() < end_exclusive_on · 카드 = provider_type+provider_id)
SELECT
  COUNT(DISTINCT s.provider_type, s.provider_id) AS a4_paid_cards,
  COUNT(DISTINCT CASE WHEN s.sku_code = 'prime' AND s.provider_id IS NOT NULL THEN CONCAT(s.provider_type, ':', s.provider_id) END) AS a4_prime_cards,
  COUNT(DISTINCT CASE WHEN s.sku_code = 'pick'  AND s.provider_id IS NOT NULL THEN CONCAT(s.provider_type, ':', s.provider_id) END) AS a4_pick_cards,
  COALESCE(SUM(s.provider_id IS NULL), 0) AS a4_unlinked_rows
FROM provider_position_subscriptions s
JOIN users u ON u.id = s.user_id
WHERE s.sku_code IN ('prime', 'pick') AND CURDATE() < s.end_exclusive_on
  AND u.status <> 'withdrawn' AND u.deleted_at IS NULL AND u.admin_level IS NULL
  AND NOT EXISTS (SELECT 1 FROM user_roles ra WHERE ra.user_id = u.id AND ra.role_type = 'admin')
  AND FIND_IN_SET(LOWER(TRIM(u.email)) COLLATE utf8mb4_unicode_ci, @t) = 0;

-- A5 유료 전환 후보 = (a) 무료 카드 + (b) 1~7일 안에 끝나는 유료 카드 · (c) 카드 없는 역할 회원(따로)
SELECT
  (SELECT COUNT(*) FROM study_rooms sr JOIN users u ON u.id = sr.user_id
    WHERE sr.deleted_at IS NULL
      AND EXISTS (SELECT 1 FROM study_room_regions r WHERE r.study_room_id = sr.id AND r.slot = 1 AND r.region_id IS NOT NULL AND r.region_id <> 0)
      AND NOT EXISTS (SELECT 1 FROM provider_position_subscriptions s
                       WHERE s.provider_type = 'study_room' AND s.provider_id = sr.id
                         AND s.sku_code IN ('prime', 'pick') AND CURDATE() < s.end_exclusive_on)
      AND u.status <> 'withdrawn' AND u.deleted_at IS NULL AND u.admin_level IS NULL
      AND NOT EXISTS (SELECT 1 FROM user_roles ra WHERE ra.user_id = u.id AND ra.role_type = 'admin')
      AND FIND_IN_SET(LOWER(TRIM(u.email)) COLLATE utf8mb4_unicode_ci, @t) = 0)
  +
  (SELECT COUNT(*) FROM tutors t JOIN users u ON u.id = t.user_id
    WHERE EXISTS (SELECT 1 FROM tutor_regions r WHERE r.tutor_id = t.id AND r.priority_order = 0 AND r.region_id IS NOT NULL AND r.region_id <> 0)
      AND NOT EXISTS (SELECT 1 FROM provider_position_subscriptions s
                       WHERE s.provider_type = 'tutor' AND s.provider_id = t.id
                         AND s.sku_code IN ('prime', 'pick') AND CURDATE() < s.end_exclusive_on)
      AND u.status <> 'withdrawn' AND u.deleted_at IS NULL AND u.admin_level IS NULL
      AND NOT EXISTS (SELECT 1 FROM user_roles ra WHERE ra.user_id = u.id AND ra.role_type = 'admin')
      AND FIND_IN_SET(LOWER(TRIM(u.email)) COLLATE utf8mb4_unicode_ci, @t) = 0) AS a5a_free_cards,
  (SELECT COUNT(DISTINCT s.provider_type, s.provider_id)
     FROM provider_position_subscriptions s JOIN users u ON u.id = s.user_id
    WHERE s.sku_code IN ('prime', 'pick') AND CURDATE() < s.end_exclusive_on
      AND DATEDIFF(s.end_exclusive_on, CURDATE()) BETWEEN 1 AND 7
      AND s.provider_id IS NOT NULL
      AND u.status <> 'withdrawn' AND u.deleted_at IS NULL AND u.admin_level IS NULL
      AND NOT EXISTS (SELECT 1 FROM user_roles ra WHERE ra.user_id = u.id AND ra.role_type = 'admin')
      AND FIND_IN_SET(LOWER(TRIM(u.email)) COLLATE utf8mb4_unicode_ci, @t) = 0) AS a5b_expiring_cards;

-- A5-c 카드 없는 역할 회원 (숫자만)
SELECT ur.role_type, COUNT(DISTINCT u.id) AS a5c_no_card_members
FROM users u
JOIN user_roles ur ON ur.user_id = u.id AND ur.status = 'active'
                  AND ur.role_type IN ('study_room_owner', 'tutor', 'guardian_student')
WHERE u.status <> 'withdrawn' AND u.deleted_at IS NULL AND u.admin_level IS NULL
  AND NOT EXISTS (SELECT 1 FROM user_roles ra WHERE ra.user_id = u.id AND ra.role_type = 'admin')
  AND FIND_IN_SET(LOWER(TRIM(u.email)) COLLATE utf8mb4_unicode_ci, @t) = 0
  AND (
    (ur.role_type = 'study_room_owner' AND NOT EXISTS (
       SELECT 1 FROM study_rooms sr WHERE sr.user_id = u.id AND sr.deleted_at IS NULL
         AND EXISTS (SELECT 1 FROM study_room_regions r WHERE r.study_room_id = sr.id AND r.slot = 1 AND r.region_id IS NOT NULL AND r.region_id <> 0)))
    OR (ur.role_type = 'tutor' AND NOT EXISTS (
       SELECT 1 FROM tutors t WHERE t.user_id = u.id
         AND EXISTS (SELECT 1 FROM tutor_regions r WHERE r.tutor_id = t.id AND r.priority_order = 0 AND r.region_id IS NOT NULL AND r.region_id <> 0)))
    OR (ur.role_type = 'guardian_student' AND NOT EXISTS (
       SELECT 1 FROM students s WHERE s.guardian_user_id = u.id AND s.published_at IS NOT NULL AND s.deleted_at IS NULL))
  )
GROUP BY ur.role_type
ORDER BY ur.role_type;

-- A6 누적 결제 (paid + refund_requested + refunded · 기간 없음)
SELECT
  COUNT(*) AS a6_payment_count,
  COALESCE(SUM(o.amount_won), 0) AS a6_amount_won,
  ROUND(COALESCE(SUM(o.amount_won), 0) / 1000, 1) AS a6_amount_cheonwon
FROM provider_payment_orders o
LEFT JOIN users pu ON pu.id = o.user_id
WHERE o.status IN ('paid', 'refund_requested', 'refunded')
  AND (pu.id IS NULL OR (
        pu.admin_level IS NULL
        AND NOT EXISTS (SELECT 1 FROM user_roles ra WHERE ra.user_id = pu.id AND ra.role_type = 'admin')
        AND FIND_IN_SET(LOWER(TRIM(pu.email)) COLLATE utf8mb4_unicode_ci, @t) = 0));

-- =============================================================================
-- B. 역할별 일별 가입 (대표 역할 1개 · KST 날짜 · 가입 0인 날은 행이 없음 — 화면은 0으로 채움)
-- =============================================================================
SELECT
  x.kst_date,
  SUM(x.pr = 'study_room_owner') AS b_study_room,
  SUM(x.pr = 'tutor')            AS b_tutor,
  SUM(x.pr = 'guardian_student') AS b_student,
  SUM(x.pr IS NULL)              AS b_none,
  COUNT(*)                       AS b_total
FROM (
  SELECT
    DATE(DATE_ADD(u.created_at, INTERVAL (540 - @db_off) MINUTE)) AS kst_date,
    (SELECT r.role_type FROM user_roles r
      WHERE r.user_id = u.id AND r.is_primary = 1 AND r.status = 'active'
      ORDER BY r.id LIMIT 1) AS pr
  FROM users u
  WHERE u.created_at >= @range_start_db AND u.created_at < @tomorrow_start_db
    AND u.status <> 'withdrawn' AND u.deleted_at IS NULL AND u.admin_level IS NULL
    AND NOT EXISTS (SELECT 1 FROM user_roles ra WHERE ra.user_id = u.id AND ra.role_type = 'admin')
    AND FIND_IN_SET(LOWER(TRIM(u.email)) COLLATE utf8mb4_unicode_ci, @t) = 0
) x
GROUP BY x.kst_date
ORDER BY x.kst_date;

-- =============================================================================
-- C. 시·도 표 (카드 대표 지역 기준 · 프라임/픽은 구독한 카드의 대표 지역)
--    sido = NULL 행이 「미분류」. 합계는 C-합계 쿼리.
--    provider_id NULL 옛 구독 행은 카드로 잇지 못해 행 단위로 미분류에 들어간다.
-- =============================================================================
SELECT
  COALESCE(g.sido, '(미분류)') AS sido,
  SUM(g.k = 'study_room') AS c_study_room,
  SUM(g.k = 'tutor')      AS c_tutor,
  SUM(g.k = 'student')    AS c_student,
  SUM(g.k = 'prime')      AS c_prime,
  SUM(g.k = 'pick')       AS c_pick
FROM (
  SELECT 'study_room' AS k, rg.sido_name AS sido
  FROM study_rooms sr
  JOIN users u ON u.id = sr.user_id
  LEFT JOIN regions rg ON rg.id = (SELECT srr.region_id FROM study_room_regions srr
                                    WHERE srr.study_room_id = sr.id AND srr.slot = 1 AND srr.region_id IS NOT NULL AND srr.region_id <> 0 LIMIT 1)
  WHERE sr.deleted_at IS NULL
    AND EXISTS (SELECT 1 FROM study_room_regions r WHERE r.study_room_id = sr.id AND r.slot = 1 AND r.region_id IS NOT NULL AND r.region_id <> 0)
    AND u.status <> 'withdrawn' AND u.deleted_at IS NULL AND u.admin_level IS NULL
    AND NOT EXISTS (SELECT 1 FROM user_roles ra WHERE ra.user_id = u.id AND ra.role_type = 'admin')
    AND FIND_IN_SET(LOWER(TRIM(u.email)) COLLATE utf8mb4_unicode_ci, @t) = 0
  UNION ALL
  SELECT 'tutor', rg.sido_name
  FROM tutors t
  JOIN users u ON u.id = t.user_id
  LEFT JOIN regions rg ON rg.id = (SELECT tr.region_id FROM tutor_regions tr
                                    WHERE tr.tutor_id = t.id AND tr.priority_order = 0 AND tr.region_id IS NOT NULL AND tr.region_id <> 0 LIMIT 1)
  WHERE EXISTS (SELECT 1 FROM tutor_regions r WHERE r.tutor_id = t.id AND r.priority_order = 0 AND r.region_id IS NOT NULL AND r.region_id <> 0)
    AND u.status <> 'withdrawn' AND u.deleted_at IS NULL AND u.admin_level IS NULL
    AND NOT EXISTS (SELECT 1 FROM user_roles ra WHERE ra.user_id = u.id AND ra.role_type = 'admin')
    AND FIND_IN_SET(LOWER(TRIM(u.email)) COLLATE utf8mb4_unicode_ci, @t) = 0
  UNION ALL
  SELECT 'student', rg.sido_name
  FROM students s
  JOIN users u ON u.id = s.guardian_user_id
  LEFT JOIN regions rg ON rg.id = (CASE WHEN s.preferred_lesson_type = 'tutor' THEN s.preferred_tutor_region_id
                                        WHEN s.preferred_lesson_type = 'study_room' THEN s.preferred_studyroom_region_id
                                        ELSE NULL END)
  WHERE s.published_at IS NOT NULL AND s.deleted_at IS NULL
    AND u.status <> 'withdrawn' AND u.deleted_at IS NULL AND u.admin_level IS NULL
    AND NOT EXISTS (SELECT 1 FROM user_roles ra WHERE ra.user_id = u.id AND ra.role_type = 'admin')
    AND FIND_IN_SET(LOWER(TRIM(u.email)) COLLATE utf8mb4_unicode_ci, @t) = 0
  UNION ALL
  SELECT d.sku_code, rg.sido_name
  FROM (
    SELECT s.sku_code, s.provider_type, s.provider_id
    FROM provider_position_subscriptions s JOIN users u ON u.id = s.user_id
    WHERE s.sku_code IN ('prime', 'pick') AND CURDATE() < s.end_exclusive_on AND s.provider_id IS NOT NULL
      AND u.status <> 'withdrawn' AND u.deleted_at IS NULL AND u.admin_level IS NULL
      AND NOT EXISTS (SELECT 1 FROM user_roles ra WHERE ra.user_id = u.id AND ra.role_type = 'admin')
      AND FIND_IN_SET(LOWER(TRIM(u.email)) COLLATE utf8mb4_unicode_ci, @t) = 0
    GROUP BY s.sku_code, s.provider_type, s.provider_id
    UNION ALL
    SELECT s.sku_code, s.provider_type, s.provider_id
    FROM provider_position_subscriptions s JOIN users u ON u.id = s.user_id
    WHERE s.sku_code IN ('prime', 'pick') AND CURDATE() < s.end_exclusive_on AND s.provider_id IS NULL
      AND u.status <> 'withdrawn' AND u.deleted_at IS NULL AND u.admin_level IS NULL
      AND NOT EXISTS (SELECT 1 FROM user_roles ra WHERE ra.user_id = u.id AND ra.role_type = 'admin')
      AND FIND_IN_SET(LOWER(TRIM(u.email)) COLLATE utf8mb4_unicode_ci, @t) = 0
  ) d
  LEFT JOIN regions rg ON rg.id = (CASE
      WHEN d.provider_type = 'study_room' THEN (SELECT srr.region_id FROM study_room_regions srr
             WHERE srr.study_room_id = d.provider_id AND srr.slot = 1 AND srr.region_id IS NOT NULL AND srr.region_id <> 0 LIMIT 1)
      WHEN d.provider_type = 'tutor' THEN (SELECT tr.region_id FROM tutor_regions tr
             WHERE tr.tutor_id = d.provider_id AND tr.priority_order = 0 AND tr.region_id IS NOT NULL AND tr.region_id <> 0 LIMIT 1)
      ELSE NULL END)
) g
GROUP BY g.sido
ORDER BY (g.sido IS NULL), g.sido;

-- C-합계: 위 결과의 열 합계를 손으로 더해도 된다. 대조 기준:
--   c_study_room 합 = A3 a3_study_room, c_tutor 합 = a3_tutor, c_student 합 = a3_student
--   c_prime 합 = A4 a4_prime_cards + (provider_id NULL 프라임 행 수), c_pick도 같은 방식

-- =============================================================================
-- D. 결제 요약 — 경로(pg_provider) × 상품(product_kind) × 구매 계정(provider_type)
--    pending·failed·cancelled는 세지 않는다. 금액 원 + 천원.
-- =============================================================================
SELECT
  o.pg_provider,
  o.product_kind,
  COALESCE(o.provider_type, '—') AS buyer_type,
  SUM(o.status = 'paid')                                              AS d_paid_count,
  SUM(CASE WHEN o.status = 'paid' THEN o.amount_won ELSE 0 END)       AS d_paid_won,
  SUM(o.status = 'refund_requested')                                  AS d_refund_requested_count,
  SUM(CASE WHEN o.status = 'refund_requested' THEN o.amount_won ELSE 0 END) AS d_refund_requested_won,
  SUM(o.status = 'refunded')                                          AS d_refunded_count,
  SUM(CASE WHEN o.status = 'refunded' THEN o.amount_won ELSE 0 END)   AS d_refunded_won,
  COALESCE(SUM(rr.refund_won), 0)                                     AS d_refund_won,
  ROUND(SUM(CASE WHEN o.status = 'paid' THEN o.amount_won ELSE 0 END) / 1000, 1) AS d_paid_cheonwon,
  ROUND(COALESCE(SUM(rr.refund_won), 0) / 1000, 1)                    AS d_refund_cheonwon
FROM provider_payment_orders o
LEFT JOIN provider_refund_requests rr ON rr.order_ref = o.order_ref AND rr.status = 'refunded'
LEFT JOIN users pu ON pu.id = o.user_id
WHERE o.status IN ('paid', 'refund_requested', 'refunded')
  AND (pu.id IS NULL OR (
        pu.admin_level IS NULL
        AND NOT EXISTS (SELECT 1 FROM user_roles ra WHERE ra.user_id = pu.id AND ra.role_type = 'admin')
        AND FIND_IN_SET(LOWER(TRIM(pu.email)) COLLATE utf8mb4_unicode_ci, @t) = 0))
GROUP BY o.pg_provider, o.product_kind, o.provider_type
ORDER BY o.pg_provider, o.product_kind, o.provider_type;

-- D-경로별 소계 (화면 소계 행과 대조)
SELECT
  o.pg_provider,
  COUNT(*) AS d_rows_count,
  SUM(o.status = 'paid') AS d_paid_count,
  SUM(o.status = 'refund_requested') AS d_refund_requested_count,
  SUM(o.status = 'refunded') AS d_refunded_count,
  COALESCE(SUM(o.amount_won), 0) AS d_amount_won,
  ROUND(COALESCE(SUM(o.amount_won), 0) / 1000, 1) AS d_amount_cheonwon
FROM provider_payment_orders o
LEFT JOIN users pu ON pu.id = o.user_id
WHERE o.status IN ('paid', 'refund_requested', 'refunded')
  AND (pu.id IS NULL OR (
        pu.admin_level IS NULL
        AND NOT EXISTS (SELECT 1 FROM user_roles ra WHERE ra.user_id = pu.id AND ra.role_type = 'admin')
        AND FIND_IN_SET(LOWER(TRIM(pu.email)) COLLATE utf8mb4_unicode_ci, @t) = 0))
GROUP BY o.pg_provider
ORDER BY o.pg_provider;

-- 끝. (E 후보 명단은 화면에서만 본다. 이 파일은 명단·이메일·전화를 출력하지 않는다.)
