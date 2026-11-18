-- =============================================================================
-- 16c. 오픈 전 테스트 흔적 정리 — 16b 점검 결과 후속
-- 작성: 우동공과3 (2026-11-18). 기준 코드: main 64d4ddf1.
-- 표·컬럼 이름은 sql/schema 마이그레이션과 16b ① 컬럼 확인(운영 0행)으로 맞췄다.
--
-- 돌리는 법 (dothome phpMyAdmin → study114 DB → SQL 탭)
--   · 세 구역(①②③)은 따로따로 돌린다. 순서는 ① → ② → ③.
--   · 각 구역은 「미리보기」를 먼저 붙여넣고 실행한다.
--   · 미리보기 행 수가 아래 적힌 숫자와 다르면 멈추고 봇에게 결과를 보낸다.
--   · 숫자가 맞을 때만 그 구역의 「지우기」 블록을 통째로 붙여넣고 실행한다.
--     (START TRANSACTION 부터 COMMIT 까지 한 번에. 중간에 끊지 않는다.)
--   · 「지우기」 뒤에 「확인」을 실행한다. 0이 아니면 봇에게.
--   · ③은 지우지 않는다. 미리보기만 하고 결과를 봇에게 보낸다.
--   · 결과는 외부 AI에 붙이지 않는다. 이메일은 앞 2글자와 도메인만 나온다.
-- =============================================================================


-- =============================================================================
-- ① 주인 없는 수업·가격 행 (16b A2)
--    원인: 공부방 행이 DB에서 실제로 지워졌는데, 런타임이 만든 두 표에는 FK가 없어
--          (StudyRoomLessonDetailStore::ensureSchema) 수업·가격 행이 같이 안 지워졌다.
--    이 두 표를 가리키는 다른 표는 없다(스키마·코드 전체 검색).
-- =============================================================================

-- ①-1 미리보기 — 기대 10행
--   study_room_classes      5행: id 15,17,20,24,26
--   study_room_price_items  5행: id 24,26,29,33,35
--   (수업 id 26은 093에서 수업료를 채운 행이다. 지우면 16b F1.filled 기대값은 3 → 2.)
SELECT 'study_room_classes' AS tbl, x.id, x.study_room_id, x.class_name AS label,
       x.monthly_fee, x.monthly_fee_amount, x.created_at
  FROM study_room_classes x
  LEFT JOIN study_rooms s ON s.id = x.study_room_id
 WHERE s.id IS NULL
UNION ALL
SELECT 'study_room_price_items', x.id, x.study_room_id, x.item_label,
       x.monthly_fee, NULL, x.created_at
  FROM study_room_price_items x
  LEFT JOIN study_rooms s ON s.id = x.study_room_id
 WHERE s.id IS NULL
ORDER BY tbl, id;

-- ①-2 지우기 (미리보기 10행이 맞을 때만) — 「영향 받은 행」 5, 5 가 나와야 한다
START TRANSACTION;
DELETE x FROM study_room_classes x
  LEFT JOIN study_rooms s ON s.id = x.study_room_id
 WHERE s.id IS NULL;
DELETE x FROM study_room_price_items x
  LEFT JOIN study_rooms s ON s.id = x.study_room_id
 WHERE s.id IS NULL;
COMMIT;

-- ①-3 확인 — 기대: 두 줄 다 0
SELECT 'study_room_classes' AS tbl, COUNT(*) AS orphan_left
  FROM study_room_classes x LEFT JOIN study_rooms s ON s.id = x.study_room_id WHERE s.id IS NULL
UNION ALL
SELECT 'study_room_price_items', COUNT(*)
  FROM study_room_price_items x LEFT JOIN study_rooms s ON s.id = x.study_room_id WHERE s.id IS NULL;


-- =============================================================================
-- ② 테스트 결제 주문과 거기 딸린 행 (16b D1·D4·H.orders_dev_mock)
--    코드상 pg_provider 값은 'dev_mock'·'portone_test' 둘뿐이다(src/Paid/Pg/PgProvider.php).
--    둘 다 테스트다. 그래서 지금 운영 주문 9건은 전부 테스트 주문이다.
--    주문에 딸린 표(order_ref로 이어짐):
--      provider_refund_requests.order_ref        (083, FK CASCADE)
--      provider_pg_cancel_ops_log.order_ref      (091)
--      provider_immediate_memo_intents.order_ref (062)
--      provider_ticket_packs.source_order_ref    (062) 쪽지권 팩·포지션 묶음 쪽지권
--      provider_paid_badges.source_order_ref     (055) 포지션 배지는 「주문번호:배지코드」로 저장된다
--        (ProviderCheckoutService::fulfill 1022행). 그래서 16b D4.badge_no_order(정확히 같은 값만 비교)는
--        포지션 배지를 「주문 없음」으로 잘못 셀 수 있다. 배지 id 1이 그 경우인지 아래에서 보인다.
--    주문과 키로 이어지지 않는 표:
--      provider_position_subscriptions — 주문번호 칸이 없다. 미리보기만 하고 지우기는 선택(맨 아래 주석).
--      message_threads — 즉시쪽지가 만든 대화방. 지우지 않는다.
-- =============================================================================

-- ②-1 미리보기 A: 표별 개수 — 한 번 실행, 7줄
--   기대: orders 9 (아래 ②-2에서 portone_test/refunded 2 · dev_mock/pending 4 · portone_test/pending 3)
--         badges_orphan 에 배지 id 1이 있거나, badges_linked 쪽에 id 1이 있어야 한다(둘 중 하나).
--         나머지 줄은 숫자를 모른다. 숫자만 확인용이다.
SELECT 'orders' AS what, COUNT(*) AS cnt, CAST(GROUP_CONCAT(o.id ORDER BY o.id) AS CHAR) AS ids
  FROM provider_payment_orders o
 WHERE o.pg_provider IN ('dev_mock', 'portone_test')
UNION ALL
SELECT 'refund_requests', COUNT(*), CAST(GROUP_CONCAT(r.id ORDER BY r.id) AS CHAR)
  FROM provider_refund_requests r
 WHERE r.order_ref IN (SELECT o.order_ref FROM provider_payment_orders o WHERE o.pg_provider IN ('dev_mock', 'portone_test'))
UNION ALL
SELECT 'pg_cancel_ops_log', COUNT(*), CAST(GROUP_CONCAT(c.id ORDER BY c.id) AS CHAR)
  FROM provider_pg_cancel_ops_log c
 WHERE c.order_ref IN (SELECT o.order_ref FROM provider_payment_orders o WHERE o.pg_provider IN ('dev_mock', 'portone_test'))
UNION ALL
SELECT 'immediate_memo_intents', COUNT(*), CAST(GROUP_CONCAT(m.id ORDER BY m.id) AS CHAR)
  FROM provider_immediate_memo_intents m
 WHERE m.order_ref IN (SELECT o.order_ref FROM provider_payment_orders o WHERE o.pg_provider IN ('dev_mock', 'portone_test'))
UNION ALL
SELECT 'ticket_packs', COUNT(*), CAST(GROUP_CONCAT(p.id ORDER BY p.id) AS CHAR)
  FROM provider_ticket_packs p
 WHERE p.source_order_ref IN (SELECT o.order_ref FROM provider_payment_orders o WHERE o.pg_provider IN ('dev_mock', 'portone_test'))
UNION ALL
SELECT 'badges_linked', COUNT(*), CAST(GROUP_CONCAT(b.id ORDER BY b.id) AS CHAR)
  FROM provider_paid_badges b
 WHERE EXISTS (SELECT 1 FROM provider_payment_orders o
                WHERE o.pg_provider IN ('dev_mock', 'portone_test')
                  AND (b.source_order_ref = o.order_ref OR b.source_order_ref LIKE CONCAT(o.order_ref, ':%')))
UNION ALL
SELECT 'badges_orphan', COUNT(*), CAST(GROUP_CONCAT(b.id ORDER BY b.id) AS CHAR)
  FROM provider_paid_badges b
 WHERE b.source_order_ref IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM provider_payment_orders o
                    WHERE b.source_order_ref = o.order_ref OR b.source_order_ref LIKE CONCAT(o.order_ref, ':%'));

-- ②-2 미리보기 B: 주문 9건 — 기대 9행 (pending 7 · refunded 2, paid 0)
SELECT o.id, o.user_id, o.pg_provider, o.status, o.product_kind, o.product_id, o.variant_label,
       o.amount_won, o.provider_type, o.provider_id, o.created_at, o.paid_at
  FROM provider_payment_orders o
 WHERE o.pg_provider IN ('dev_mock', 'portone_test')
ORDER BY o.id;

-- ②-3 미리보기 C: 지금 「쓰이는 중」인 혜택이 있는지 — 기대 0행
--   한 줄이라도 나오면 지우기 전에 멈추고 봇에게. (테스트 계정이 지금 쓰는 배지·쪽지권·노출일 수 있다)
--   ※ 배지 활성 = status 'active' 이고 오늘이 기간 안. 쪽지권 = 남은 수 > 0 이고 만료 전.
SELECT 'badge_active' AS what, b.id, b.provider_type, b.provider_id, b.badge_code AS detail,
       b.source_order_ref AS ref, b.end_exclusive_on AS until_excl
  FROM provider_paid_badges b
 WHERE b.status = 'active' AND b.starts_on <= CURDATE() AND CURDATE() < b.end_exclusive_on
   AND b.source_order_ref IS NOT NULL
   AND (EXISTS (SELECT 1 FROM provider_payment_orders o
                 WHERE o.pg_provider IN ('dev_mock', 'portone_test')
                   AND (b.source_order_ref = o.order_ref OR b.source_order_ref LIKE CONCAT(o.order_ref, ':%')))
        OR NOT EXISTS (SELECT 1 FROM provider_payment_orders o
                        WHERE b.source_order_ref = o.order_ref OR b.source_order_ref LIKE CONCAT(o.order_ref, ':%')))
UNION ALL
SELECT 'ticket_pack_live', p.id, p.provider_type, p.provider_id, CONCAT(p.ticket_type, ' 남은 ', p.remaining),
       p.source_order_ref, p.expires_at
  FROM provider_ticket_packs p
 WHERE p.remaining > 0 AND p.expires_at > NOW()
   AND p.source_order_ref IN (SELECT o.order_ref FROM provider_payment_orders o WHERE o.pg_provider IN ('dev_mock', 'portone_test'))
UNION ALL
SELECT 'position_live', s.id, s.provider_type, s.provider_id, s.sku_code, s.source, s.end_exclusive_on
  FROM provider_position_subscriptions s
 WHERE s.source = 'payment' AND CURDATE() < s.end_exclusive_on;

-- ②-4 지우기 (②-1·②-2 숫자가 맞고 ②-3이 0행일 때만)
--   딸린 행 먼저, 주문은 마지막. 배지는 「테스트 주문에 딸린 것」+「어느 주문에도 안 붙은 것(id 1 포함)」.
--   source_order_ref 가 NULL 인 배지(관리자 수동 지급)는 건드리지 않는다.
--   마지막 DELETE의 「영향 받은 행」은 9 여야 한다.
START TRANSACTION;
DELETE c FROM provider_pg_cancel_ops_log c
 WHERE c.order_ref IN (SELECT o.order_ref FROM provider_payment_orders o WHERE o.pg_provider IN ('dev_mock', 'portone_test'));
DELETE m FROM provider_immediate_memo_intents m
 WHERE m.order_ref IN (SELECT o.order_ref FROM provider_payment_orders o WHERE o.pg_provider IN ('dev_mock', 'portone_test'));
DELETE r FROM provider_refund_requests r
 WHERE r.order_ref IN (SELECT o.order_ref FROM provider_payment_orders o WHERE o.pg_provider IN ('dev_mock', 'portone_test'));
DELETE p FROM provider_ticket_packs p
 WHERE p.source_order_ref IN (SELECT o.order_ref FROM provider_payment_orders o WHERE o.pg_provider IN ('dev_mock', 'portone_test'));
DELETE b FROM provider_paid_badges b
 WHERE b.source_order_ref IS NOT NULL
   AND (EXISTS (SELECT 1 FROM provider_payment_orders o
                 WHERE o.pg_provider IN ('dev_mock', 'portone_test')
                   AND (b.source_order_ref = o.order_ref OR b.source_order_ref LIKE CONCAT(o.order_ref, ':%')))
        OR NOT EXISTS (SELECT 1 FROM provider_payment_orders o
                        WHERE b.source_order_ref = o.order_ref OR b.source_order_ref LIKE CONCAT(o.order_ref, ':%')));
DELETE FROM provider_payment_orders
 WHERE pg_provider IN ('dev_mock', 'portone_test');
COMMIT;

-- ②-5 확인 — 기대: 세 줄 다 0
SELECT 'orders_left' AS what, COUNT(*) AS cnt FROM provider_payment_orders WHERE pg_provider IN ('dev_mock', 'portone_test')
UNION ALL
SELECT 'badges_no_order', COUNT(*) FROM provider_paid_badges b
 WHERE b.source_order_ref IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM provider_payment_orders o
                    WHERE b.source_order_ref = o.order_ref OR b.source_order_ref LIKE CONCAT(o.order_ref, ':%'))
UNION ALL
SELECT 'refund_no_order', COUNT(*) FROM provider_refund_requests r
  LEFT JOIN provider_payment_orders o ON o.order_ref = r.order_ref WHERE o.id IS NULL;

-- ②-6 (선택·기본은 안 함) 결제로 생긴 노출 기간 기록 — 주문번호 칸이 없어 위에서 못 지운다.
--   미리보기: 결제로 생긴 노출 기록 전체. end_exclusive_on 이 오늘 이후인 줄이 있으면 지금 노출 중이다.
-- SELECT s.id, s.user_id, s.provider_type, s.provider_id, s.sku_code, s.source, s.end_exclusive_on
--   FROM provider_position_subscriptions s WHERE s.source = 'payment' ORDER BY s.id;
--   지우기는 봇과 다시 맞춘 뒤에만. 끝난 기록만 지우는 예:
-- DELETE FROM provider_position_subscriptions WHERE source = 'payment' AND end_exclusive_on <= CURDATE();


-- =============================================================================
-- ③ 테스트 이름 공개 카드 + 역할 없는 과외쌤 — 지우지 않는다. 미리보기만.
--    대상: 공부방 23·24(테스트 이름 공개) · 공부방 6(홍보지역2·3 시도 다름, 민락점)
--          학생 15·16·17 · 과외쌤 23·24·25(테스트 이름 공개)
--          과외쌤 3·5·6·7·8(주인에게 활성 tutor 역할 없음)
--    코드 기준 공개 조건(SearchService):
--      공부방: profile_status <> 'hidden' · deleted_at NULL · 주인 탈퇴 아님 · 홍보지역1 있음
--      과외쌤: profile_status <> 'hidden' · 주인 탈퇴 아님 · 과외지역1 있음 · 기본 8칸 완료
--      학생  : exposure_status = 'published' · deleted_at NULL · 주인 탈퇴 아님
--      손님은 여기에 profile_status = 'published' 와 기준 지역(공부방 대치동 · 과외·학생 강남구)이 더 붙는다.
--      역할(user_roles)은 공개 목록 어디서도 보지 않는다.
--      테스트 계정 숨김(env STUDY114_TEST_ACCOUNT_EMAILS)은 DB에 없어 이 SQL로는 알 수 없다.
-- =============================================================================

-- ③-1 미리보기 — 기대 14행 (공부방 3 · 학생 3 · 과외쌤 8)
--   member_gate_ok = 1 이면 로그인 회원 목록에 나갈 조건을 갖춘 것(테스트 계정 숨김은 빼고 계산).
--   guest_status_ok = 1 이면 손님 조건 중 상태까지 맞은 것(기준 지역은 따로).
SELECT 'study_room' AS kind, sr.id, sr.user_id AS owner_id,
       CONCAT(LEFT(u.email, 2), '***@', SUBSTRING_INDEX(u.email, '@', -1)) AS owner_email,
       u.status AS owner_status, sr.study_room_name AS name, sr.profile_status AS status_value,
       sr.deleted_at,
       NULL AS has_tutor_role,
       (sr.profile_status <> 'hidden' AND sr.deleted_at IS NULL AND u.status <> 'withdrawn'
        AND EXISTS (SELECT 1 FROM study_room_regions g WHERE g.study_room_id = sr.id AND g.slot = 1
                      AND g.region_id IS NOT NULL AND g.region_id <> 0)) AS member_gate_ok,
       (sr.profile_status = 'published' AND sr.deleted_at IS NULL AND u.status <> 'withdrawn'
        AND EXISTS (SELECT 1 FROM study_room_regions g WHERE g.study_room_id = sr.id AND g.slot = 1
                      AND g.region_id IS NOT NULL AND g.region_id <> 0)) AS guest_status_ok,
       CASE WHEN sr.study_room_name LIKE '%테스트%' OR LOWER(sr.study_room_name) LIKE '%test%'
            THEN '테스트 이름' ELSE '홍보지역2·3 시도 다름' END AS why
  FROM study_rooms sr
  LEFT JOIN users u ON u.id = sr.user_id
 WHERE sr.deleted_at IS NULL
   AND ((sr.profile_status = 'published' AND (LOWER(sr.study_room_name) LIKE '%test%' OR sr.study_room_name LIKE '%테스트%'))
        OR EXISTS (SELECT 1 FROM study_room_regions sg
                     JOIN regions rb ON rb.id = sr.region_id
                     JOIN regions rp ON rp.id = sg.region_id
                    WHERE sg.study_room_id = sr.id AND sg.slot IN (2, 3) AND rb.sido_code <> rp.sido_code))
UNION ALL
SELECT 'student', st.id, st.guardian_user_id,
       CONCAT(LEFT(u.email, 2), '***@', SUBSTRING_INDEX(u.email, '@', -1)),
       u.status, st.public_display_name, st.exposure_status,
       st.deleted_at,
       NULL,
       (st.exposure_status = 'published' AND st.deleted_at IS NULL AND u.status <> 'withdrawn'),
       (st.exposure_status = 'published' AND st.deleted_at IS NULL AND u.status <> 'withdrawn'),
       '테스트 이름'
  FROM students st
  LEFT JOIN users u ON u.id = st.guardian_user_id
 WHERE st.deleted_at IS NULL AND st.exposure_status = 'published'
   AND (LOWER(st.public_display_name) LIKE '%test%' OR st.public_display_name LIKE '%테스트%' OR st.request_title LIKE '%테스트%')
UNION ALL
SELECT 'tutor', t.id, t.user_id,
       CONCAT(LEFT(u.email, 2), '***@', SUBSTRING_INDEX(u.email, '@', -1)),
       u.status, t.tutor_display_name, t.profile_status,
       NULL,
       EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = t.user_id AND r.role_type = 'tutor' AND r.status = 'active'),
       (t.profile_status <> 'hidden' AND u.status <> 'withdrawn'
        AND EXISTS (SELECT 1 FROM tutor_regions g WHERE g.tutor_id = t.id AND g.priority_order = 0
                      AND g.region_id IS NOT NULL AND g.region_id <> 0)
        AND TRIM(COALESCE(t.tutor_display_name, '')) <> ''
        AND TRIM(COALESCE(t.main_subject_note, '')) <> ''
        AND COALESCE(t.preferred_fee_amount, 0) > 0
        AND COALESCE(t.lessons_per_week, 0) > 0
        AND COALESCE(t.minutes_per_lesson, 0) > 0
        AND TRIM(COALESCE(t.slogan, '')) <> ''
        AND (SELECT k.school_level FROM tutor_subject_targets k WHERE k.tutor_id = t.id
              ORDER BY k.is_primary DESC, k.id ASC LIMIT 1)
            IN ('preschool', 'elementary', 'middle', 'high', 'n_su', 'general', 'other')),
       (t.profile_status = 'published' AND u.status <> 'withdrawn'
        AND EXISTS (SELECT 1 FROM tutor_regions g WHERE g.tutor_id = t.id AND g.priority_order = 0
                      AND g.region_id IS NOT NULL AND g.region_id <> 0)
        AND TRIM(COALESCE(t.tutor_display_name, '')) <> ''
        AND TRIM(COALESCE(t.main_subject_note, '')) <> ''
        AND COALESCE(t.preferred_fee_amount, 0) > 0
        AND COALESCE(t.lessons_per_week, 0) > 0
        AND COALESCE(t.minutes_per_lesson, 0) > 0
        AND TRIM(COALESCE(t.slogan, '')) <> ''
        AND (SELECT k.school_level FROM tutor_subject_targets k WHERE k.tutor_id = t.id
              ORDER BY k.is_primary DESC, k.id ASC LIMIT 1)
            IN ('preschool', 'elementary', 'middle', 'high', 'n_su', 'general', 'other')),
       CASE WHEN t.profile_status = 'published' AND (LOWER(t.tutor_display_name) LIKE '%test%' OR t.tutor_display_name LIKE '%테스트%')
            THEN '테스트 이름' ELSE '과외 역할 없음' END
  FROM tutors t
  LEFT JOIN users u ON u.id = t.user_id
 WHERE (t.profile_status = 'published' AND (LOWER(t.tutor_display_name) LIKE '%test%' OR t.tutor_display_name LIKE '%테스트%'))
    OR NOT EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = t.user_id AND r.role_type = 'tutor' AND r.status = 'active')
ORDER BY kind, id;

-- ③-2 (선택·기본은 안 함) 공개 내리기 — 지우지 않고 'hidden' 으로만 바꾼다.
--   'hidden' 은 로그인 회원 목록에서도 빠진다('draft' 는 로그인 회원에게 아직 보인다).
--   종현님이 대상과 id를 정한 뒤에만 앞의 「-- 」를 지우고 실행한다.
-- START TRANSACTION;
-- UPDATE study_rooms SET profile_status = 'hidden' WHERE id IN (23, 24) AND profile_status = 'published';
-- UPDATE students    SET exposure_status = 'hidden' WHERE id IN (15, 16, 17) AND exposure_status = 'published';
-- UPDATE tutors      SET profile_status = 'hidden' WHERE id IN (23, 24, 25) AND profile_status = 'published';
-- UPDATE tutors      SET profile_status = 'hidden' WHERE id IN (3, 5, 6, 7, 8) AND profile_status <> 'hidden';
-- COMMIT;
