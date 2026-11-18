-- =============================================================================
-- 16b. 오픈 전 데이터 무결성 점검 — 한 번에 돌리는 묶음 (읽기 전용)
-- 작성: 우동공과3 (2026-11-18). 원본: 16-integrity-check-sql.md (점검 조건은 그대로).
-- SELECT만 있다. INSERT·UPDATE·DELETE·ALTER·CREATE·SET 없음. 데이터는 하나도 안 바뀐다.
--
-- 돌리는 법 (dothome phpMyAdmin → study114 DB → SQL 탭)
--   ① 아래 「① 컬럼 확인」만 붙여넣고 실행.
--      · 결과 0행이면 → ②, ③ 차례로 실행.
--      · 행이 나오면 → what_to_do 칸을 본다.
--          「③만 건너뛰기」만 있으면 ②만 실행.
--          「②③ 둘 다 멈추고 봇에게」가 하나라도 있으면 ② ③ 돌리지 말고 ① 결과를 봇에게 보낸다.
--   ② 「② 본 점검」 붙여넣고 실행 (한 번). 130줄 정도 나온다.
--   ③ 「③ 늦게 붙은 표 점검」 붙여넣고 실행 (한 번). 11줄.
--
-- 읽는 법
--   · 칸: chk(점검번호) · title(내용) · cnt(문제 행 수) · sample_ids(문제 행 id 최대 10개, id만).
--   · cnt가 0이 아닌 줄이 맨 위에 모여 나온다(그 안에서 chk 순). cnt > 0 줄만 보면 된다.
--   · phpMyAdmin은 25줄씩 끊어 보여 준다. cnt > 0 줄이 25줄을 넘으면 「모두 보기」를 누른다.
--   · title이 「[참고]」로 시작하는 줄은 0이 아니어도 바로 문제는 아니다. 숫자만 봇이 판단한다.
--   · 보낼 때: cnt > 0 줄의 chk · cnt · sample_ids만 봇에게. 예) B4.no_role 3 11,12,13
--     결과는 외부 AI에 붙이지 않는다. 이름·전화·이메일은 나오지 않는다.
--   · sample_ids의 「11/12」는 한 묶음(중복 묶음 등) 안의 id들이다.
--   · D1 줄의 sample_ids는 id가 아니라 그 묶음의 합계 금액(원)이다.
-- =============================================================================

-- ① 컬럼 확인 (기대: 0행) ------------------------------------------------------
SELECT x.t AS missing_table, x.c AS missing_column,
  CASE WHEN x.t IN ('provider_refund_requests', 'quick_match_dispatches', 'provider_pg_cancel_ops_log')
         OR (x.t = 'provider_payment_orders' AND x.c = 'pg_payment_id')
         OR (x.t = 'students' AND x.c IN ('preferred_studyroom_region_extra_id', 'preferred_tutor_region_extra_id'))
       THEN '③만 건너뛰기' ELSE '②③ 둘 다 멈추고 봇에게' END AS what_to_do
FROM (
  SELECT 'users' t, 'id' c UNION ALL SELECT 'users','email' UNION ALL SELECT 'users','status'
  UNION ALL SELECT 'users','deleted_at' UNION ALL SELECT 'users','oauth_role_pending'
  UNION ALL SELECT 'user_roles','user_id' UNION ALL SELECT 'user_roles','role_type'
  UNION ALL SELECT 'user_roles','status' UNION ALL SELECT 'user_roles','is_primary'
  UNION ALL SELECT 'user_profiles','user_id' UNION ALL SELECT 'user_profiles','default_region_id'
  UNION ALL SELECT 'user_oauth_accounts','user_id' UNION ALL SELECT 'user_oauth_accounts','provider'
  UNION ALL SELECT 'user_oauth_accounts','provider_user_id'
  UNION ALL SELECT 'study_rooms','id' UNION ALL SELECT 'study_rooms','user_id'
  UNION ALL SELECT 'study_rooms','deleted_at' UNION ALL SELECT 'study_rooms','profile_status'
  UNION ALL SELECT 'study_rooms','study_room_name' UNION ALL SELECT 'study_rooms','region_id'
  UNION ALL SELECT 'study_rooms','price_amount' UNION ALL SELECT 'study_rooms','career_years'
  UNION ALL SELECT 'tutors','id' UNION ALL SELECT 'tutors','user_id' UNION ALL SELECT 'tutors','profile_status'
  UNION ALL SELECT 'tutors','tutor_display_name' UNION ALL SELECT 'tutors','preferred_fee_amount'
  UNION ALL SELECT 'students','id' UNION ALL SELECT 'students','guardian_user_id'
  UNION ALL SELECT 'students','exposure_status' UNION ALL SELECT 'students','deleted_at'
  UNION ALL SELECT 'students','public_display_name' UNION ALL SELECT 'students','request_title'
  UNION ALL SELECT 'students','preferred_studyroom_region_id' UNION ALL SELECT 'students','preferred_tutor_region_id'
  UNION ALL SELECT 'students','preferred_tutor_region_extra_id' UNION ALL SELECT 'students','preferred_studyroom_region_extra_id'
  UNION ALL SELECT 'students','preferred_fee_amount' UNION ALL SELECT 'students','preferred_studyroom_fee_amount'
  UNION ALL SELECT 'regions','id' UNION ALL SELECT 'regions','sido_code' UNION ALL SELECT 'regions','sigungu_code'
  UNION ALL SELECT 'regions','is_active'
  UNION ALL SELECT 'complexes','id' UNION ALL SELECT 'complexes','region_id'
  UNION ALL SELECT 'study_room_regions','study_room_id' UNION ALL SELECT 'study_room_regions','slot'
  UNION ALL SELECT 'study_room_regions','region_id' UNION ALL SELECT 'study_room_regions','complex_id'
  UNION ALL SELECT 'study_room_regions','region_basis_type'
  UNION ALL SELECT 'tutor_regions','tutor_id' UNION ALL SELECT 'tutor_regions','region_id'
  UNION ALL SELECT 'study_room_classes','study_room_id' UNION ALL SELECT 'study_room_classes','monthly_fee'
  UNION ALL SELECT 'study_room_classes','monthly_fee_amount'
  UNION ALL SELECT 'study_room_price_items','study_room_id'
  UNION ALL SELECT 'study_room_images','study_room_id' UNION ALL SELECT 'study_room_facilities','study_room_id'
  UNION ALL SELECT 'study_room_subject_targets','study_room_id' UNION ALL SELECT 'study_room_badges','study_room_id'
  UNION ALL SELECT 'study_room_primary_audiences','study_room_id'
  UNION ALL SELECT 'study_room_verification_documents','study_room_id'
  UNION ALL SELECT 'study_room_exposure_assignments','study_room_id' UNION ALL SELECT 'study_room_exposure_assignments','exposure_status'
  UNION ALL SELECT 'study_room_exposure_assignments','payment_status' UNION ALL SELECT 'study_room_exposure_assignments','ends_at'
  UNION ALL SELECT 'study_room_exposure_assignments','exposure_type'
  UNION ALL SELECT 'study_room_exposure_waitlists','study_room_id'
  UNION ALL SELECT 'tutor_images','tutor_id' UNION ALL SELECT 'tutor_subject_targets','tutor_id'
  UNION ALL SELECT 'tutor_lesson_places','tutor_id' UNION ALL SELECT 'tutor_teaching_style_badges','tutor_id'
  UNION ALL SELECT 'tutor_verification_documents','tutor_id'
  UNION ALL SELECT 'student_subject_targets','student_id' UNION ALL SELECT 'student_preferred_lesson_places','student_id'
  UNION ALL SELECT 'student_preferred_teaching_style_badges','student_id'
  UNION ALL SELECT 'user_favorites','target_type' UNION ALL SELECT 'user_favorites','target_id'
  UNION ALL SELECT 'user_compare_items','target_type' UNION ALL SELECT 'user_compare_items','target_id'
  UNION ALL SELECT 'user_recommendations','target_type' UNION ALL SELECT 'user_recommendations','target_id'
  UNION ALL SELECT 'provider_reviews','provider_type' UNION ALL SELECT 'provider_reviews','provider_id'
  UNION ALL SELECT 'provider_request_unlocks','student_id' UNION ALL SELECT 'provider_request_unlocks','provider_user_id'
  UNION ALL SELECT 'provider_payment_orders','order_ref' UNION ALL SELECT 'provider_payment_orders','user_id'
  UNION ALL SELECT 'provider_payment_orders','product_id' UNION ALL SELECT 'provider_payment_orders','variant_label'
  UNION ALL SELECT 'provider_payment_orders','product_kind' UNION ALL SELECT 'provider_payment_orders','amount_won'
  UNION ALL SELECT 'provider_payment_orders','list_price_won' UNION ALL SELECT 'provider_payment_orders','status'
  UNION ALL SELECT 'provider_payment_orders','pg_provider' UNION ALL SELECT 'provider_payment_orders','pg_payment_id'
  UNION ALL SELECT 'provider_payment_orders','paid_at' UNION ALL SELECT 'provider_payment_orders','provider_type'
  UNION ALL SELECT 'provider_payment_orders','provider_id'
  UNION ALL SELECT 'provider_refund_requests','order_ref' UNION ALL SELECT 'provider_refund_requests','status'
  UNION ALL SELECT 'provider_refund_requests','refund_won' UNION ALL SELECT 'provider_refund_requests','amount_won'
  UNION ALL SELECT 'provider_position_subscriptions','user_id' UNION ALL SELECT 'provider_position_subscriptions','sku_code'
  UNION ALL SELECT 'provider_position_subscriptions','end_exclusive_on' UNION ALL SELECT 'provider_position_subscriptions','source'
  UNION ALL SELECT 'provider_position_subscriptions','provider_type' UNION ALL SELECT 'provider_position_subscriptions','provider_id'
  UNION ALL SELECT 'provider_position_subscriptions','region_basis_type' UNION ALL SELECT 'provider_position_subscriptions','region_id'
  UNION ALL SELECT 'provider_paid_badges','source_order_ref' UNION ALL SELECT 'provider_paid_badges','status'
  UNION ALL SELECT 'provider_paid_badges','end_exclusive_on' UNION ALL SELECT 'provider_paid_badges','provider_type'
  UNION ALL SELECT 'provider_paid_badges','provider_id'
  UNION ALL SELECT 'provider_paid_badges','badge_code'
  UNION ALL SELECT 'provider_ticket_packs','source_order_ref' UNION ALL SELECT 'provider_ticket_packs','remaining'
  UNION ALL SELECT 'provider_ticket_packs','pack_size' UNION ALL SELECT 'provider_ticket_packs','expires_at'
  UNION ALL SELECT 'provider_ticket_packs','user_id'
  UNION ALL SELECT 'provider_immediate_memo_intents','order_ref' UNION ALL SELECT 'provider_immediate_memo_intents','thread_id'
  UNION ALL SELECT 'provider_pg_cancel_ops_log','order_ref'
  UNION ALL SELECT 'message_threads','participant_low_user_id' UNION ALL SELECT 'message_threads','participant_high_user_id'
  UNION ALL SELECT 'message_threads','initiated_by_user_id' UNION ALL SELECT 'message_threads','context_kind'
  UNION ALL SELECT 'message_threads','context_id'
  UNION ALL SELECT 'messages','thread_id' UNION ALL SELECT 'messages','sender_user_id'
  UNION ALL SELECT 'message_thread_reads','thread_id' UNION ALL SELECT 'message_thread_reads','user_id'
  UNION ALL SELECT 'message_thread_participant_state','thread_id' UNION ALL SELECT 'message_thread_participant_state','user_id'
  UNION ALL SELECT 'message_attachments','message_id' UNION ALL SELECT 'message_attachments','thread_id'
  UNION ALL SELECT 'quick_match_dispatches','thread_id' UNION ALL SELECT 'quick_match_dispatches','student_id'
  UNION ALL SELECT 'home_popups','content' UNION ALL SELECT 'home_popups','published'
  UNION ALL SELECT 'board_posts','title' UNION ALL SELECT 'board_posts','status'
) x
LEFT JOIN information_schema.COLUMNS ic
  ON ic.TABLE_SCHEMA = DATABASE() AND ic.TABLE_NAME = x.t AND ic.COLUMN_NAME = x.c
WHERE ic.COLUMN_NAME IS NULL;

-- ② 본 점검 (한 번에 실행) -----------------------------------------------------
SELECT z.chk, z.title, z.cnt, z.sample_ids
FROM (
SELECT 'A1.user_roles' AS chk, '회원 없는 역할 행' AS title, COUNT(*) AS cnt, CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR) AS sample_ids
  FROM (SELECT x.id FROM user_roles x LEFT JOIN users u ON u.id = x.user_id WHERE u.id IS NULL) t
UNION ALL
SELECT 'A1.user_profiles', '회원 없는 프로필 행(user_id)', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.user_id AS id FROM user_profiles x LEFT JOIN users u ON u.id = x.user_id WHERE u.id IS NULL) t
UNION ALL
SELECT 'A1.user_oauth_accounts', '회원 없는 소셜연동 행', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id FROM user_oauth_accounts x LEFT JOIN users u ON u.id = x.user_id WHERE u.id IS NULL) t
UNION ALL
SELECT 'A1.study_rooms', '회원 없는 공부방', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id FROM study_rooms x LEFT JOIN users u ON u.id = x.user_id WHERE u.id IS NULL) t
UNION ALL
SELECT 'A1.tutors', '회원 없는 과외쌤', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id FROM tutors x LEFT JOIN users u ON u.id = x.user_id WHERE u.id IS NULL) t
UNION ALL
SELECT 'A1.students', '회원 없는 학생', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id FROM students x LEFT JOIN users u ON u.id = x.guardian_user_id WHERE u.id IS NULL) t
UNION ALL
SELECT 'A2.study_room_classes', '공부방 없는 수업', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id AS id FROM study_room_classes x LEFT JOIN study_rooms s ON s.id = x.study_room_id WHERE s.id IS NULL) t
UNION ALL
SELECT 'A2.study_room_price_items', '공부방 없는 가격항목', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id AS id FROM study_room_price_items x LEFT JOIN study_rooms s ON s.id = x.study_room_id WHERE s.id IS NULL) t
UNION ALL
SELECT 'A2.study_room_images', '공부방 없는 사진', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id AS id FROM study_room_images x LEFT JOIN study_rooms s ON s.id = x.study_room_id WHERE s.id IS NULL) t
UNION ALL
SELECT 'A2.study_room_regions', '공부방 없는 홍보지역', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id AS id FROM study_room_regions x LEFT JOIN study_rooms s ON s.id = x.study_room_id WHERE s.id IS NULL) t
UNION ALL
SELECT 'A2.study_room_facilities', '공부방 없는 시설(study_room_id)', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.study_room_id AS id FROM study_room_facilities x LEFT JOIN study_rooms s ON s.id = x.study_room_id WHERE s.id IS NULL) t
UNION ALL
SELECT 'A2.study_room_subject_targets', '공부방 없는 과목', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id AS id FROM study_room_subject_targets x LEFT JOIN study_rooms s ON s.id = x.study_room_id WHERE s.id IS NULL) t
UNION ALL
SELECT 'A2.study_room_badges', '공부방 없는 배지', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id AS id FROM study_room_badges x LEFT JOIN study_rooms s ON s.id = x.study_room_id WHERE s.id IS NULL) t
UNION ALL
SELECT 'A2.study_room_primary_audiences', '공부방 없는 주대상(study_room_id)', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.study_room_id AS id FROM study_room_primary_audiences x LEFT JOIN study_rooms s ON s.id = x.study_room_id WHERE s.id IS NULL) t
UNION ALL
SELECT 'A2.study_room_verification_documents', '공부방 없는 인증서류', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id AS id FROM study_room_verification_documents x LEFT JOIN study_rooms s ON s.id = x.study_room_id WHERE s.id IS NULL) t
UNION ALL
SELECT 'A2.study_room_exposure_assignments', '공부방 없는 노출배정', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id AS id FROM study_room_exposure_assignments x LEFT JOIN study_rooms s ON s.id = x.study_room_id WHERE s.id IS NULL) t
UNION ALL
SELECT 'A2.study_room_exposure_waitlists', '공부방 없는 노출대기', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id AS id FROM study_room_exposure_waitlists x LEFT JOIN study_rooms s ON s.id = x.study_room_id WHERE s.id IS NULL) t
UNION ALL
SELECT 'A3.tutor_images', '과외쌤 없는 사진', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id FROM tutor_images x LEFT JOIN tutors t ON t.id = x.tutor_id WHERE t.id IS NULL) t
UNION ALL
SELECT 'A3.tutor_regions', '과외쌤 없는 지역', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id FROM tutor_regions x LEFT JOIN tutors t ON t.id = x.tutor_id WHERE t.id IS NULL) t
UNION ALL
SELECT 'A3.tutor_subject_targets', '과외쌤 없는 과목', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id FROM tutor_subject_targets x LEFT JOIN tutors t ON t.id = x.tutor_id WHERE t.id IS NULL) t
UNION ALL
SELECT 'A3.tutor_lesson_places', '과외쌤 없는 수업장소', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id FROM tutor_lesson_places x LEFT JOIN tutors t ON t.id = x.tutor_id WHERE t.id IS NULL) t
UNION ALL
SELECT 'A3.tutor_teaching_style_badges', '과외쌤 없는 스타일배지', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id FROM tutor_teaching_style_badges x LEFT JOIN tutors t ON t.id = x.tutor_id WHERE t.id IS NULL) t
UNION ALL
SELECT 'A3.tutor_verification_documents', '과외쌤 없는 인증서류', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id FROM tutor_verification_documents x LEFT JOIN tutors t ON t.id = x.tutor_id WHERE t.id IS NULL) t
UNION ALL
SELECT 'A4.student_subject_targets', '학생 없는 과목', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id FROM student_subject_targets x LEFT JOIN students st ON st.id = x.student_id WHERE st.id IS NULL) t
UNION ALL
SELECT 'A4.student_preferred_lesson_places', '학생 없는 희망장소', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id FROM student_preferred_lesson_places x LEFT JOIN students st ON st.id = x.student_id WHERE st.id IS NULL) t
UNION ALL
SELECT 'A4.student_preferred_teaching_style_badges', '학생 없는 희망스타일', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id FROM student_preferred_teaching_style_badges x LEFT JOIN students st ON st.id = x.student_id WHERE st.id IS NULL) t
UNION ALL
SELECT 'A4.provider_request_unlocks', '학생 없는 요청열람', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id FROM provider_request_unlocks x LEFT JOIN students st ON st.id = x.student_id WHERE st.id IS NULL) t
UNION ALL
SELECT 'A5.user_favorites', '찜 대상 없음', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id FROM user_favorites x LEFT JOIN study_rooms s ON x.target_type = 'study_room' AND s.id = x.target_id LEFT JOIN tutors t ON x.target_type = 'tutor' AND t.id = x.target_id WHERE s.id IS NULL AND t.id IS NULL) t
UNION ALL
SELECT 'A5.user_compare_items', '비교 대상 없음', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id FROM user_compare_items x LEFT JOIN study_rooms s ON x.target_type = 'study_room' AND s.id = x.target_id LEFT JOIN tutors t ON x.target_type = 'tutor' AND t.id = x.target_id WHERE s.id IS NULL AND t.id IS NULL) t
UNION ALL
SELECT 'A5.user_recommendations', '추천 대상 없음', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id FROM user_recommendations x LEFT JOIN study_rooms s ON x.target_type = 'study_room' AND s.id = x.target_id LEFT JOIN tutors t ON x.target_type = 'tutor' AND t.id = x.target_id WHERE s.id IS NULL AND t.id IS NULL) t
UNION ALL
SELECT 'A5.provider_reviews', '후기 대상 없음', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id FROM provider_reviews x LEFT JOIN study_rooms s ON x.provider_type = 'study_room' AND s.id = x.provider_id LEFT JOIN tutors t ON x.provider_type = 'tutor' AND t.id = x.provider_id WHERE s.id IS NULL AND t.id IS NULL) t
UNION ALL
SELECT 'A6.orders_user', '주문의 회원 없음', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT o.id FROM provider_payment_orders o LEFT JOIN users u ON u.id = o.user_id WHERE o.user_id IS NOT NULL AND u.id IS NULL) t
UNION ALL
SELECT 'A6.positions_user', '구독의 회원 없음', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT p.id FROM provider_position_subscriptions p LEFT JOIN users u ON u.id = p.user_id WHERE p.user_id IS NOT NULL AND u.id IS NULL) t
UNION ALL
SELECT 'A6.ticket_packs_user', '쪽지권의 회원 없음', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT k.id FROM provider_ticket_packs k LEFT JOIN users u ON u.id = k.user_id WHERE u.id IS NULL) t
UNION ALL
SELECT 'A6.positions_provider', '구독의 공부방·과외쌤 없음', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT p.id FROM provider_position_subscriptions p LEFT JOIN study_rooms s ON p.provider_type = 'study_room' AND s.id = p.provider_id LEFT JOIN tutors t ON p.provider_type = 'tutor' AND t.id = p.provider_id WHERE p.provider_id IS NOT NULL AND s.id IS NULL AND t.id IS NULL) t
UNION ALL
SELECT 'A6.badges_provider', '배지의 공부방·과외쌤 없음', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT b.id FROM provider_paid_badges b LEFT JOIN study_rooms s ON b.provider_type = 'study_room' AND s.id = b.provider_id LEFT JOIN tutors t ON b.provider_type = 'tutor' AND t.id = b.provider_id WHERE s.id IS NULL AND t.id IS NULL) t
UNION ALL
SELECT 'B1.room_role_no_profile', '[참고] 공부방 역할만 있고 공부방 없음(회원id)', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT r.user_id AS id FROM user_roles r WHERE r.role_type = 'study_room_owner' AND r.status = 'active' AND NOT EXISTS (SELECT 1 FROM study_rooms s WHERE s.user_id = r.user_id AND s.deleted_at IS NULL)) t
UNION ALL
SELECT 'B1.room_profile_no_role', '공부방 있는데 역할 없음', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT s.id FROM study_rooms s WHERE s.deleted_at IS NULL AND NOT EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = s.user_id AND r.role_type = 'study_room_owner' AND r.status = 'active')) t
UNION ALL
SELECT 'B1.tutor_role_no_profile', '[참고] 과외 역할만 있고 프로필 없음(회원id)', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT r.user_id AS id FROM user_roles r WHERE r.role_type = 'tutor' AND r.status = 'active' AND NOT EXISTS (SELECT 1 FROM tutors t WHERE t.user_id = r.user_id)) t
UNION ALL
SELECT 'B1.tutor_profile_no_role', '과외쌤 있는데 역할 없음', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT t.id FROM tutors t WHERE NOT EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = t.user_id AND r.role_type = 'tutor' AND r.status = 'active')) t
UNION ALL
SELECT 'B1.student_role_no_profile', '[참고] 학생 역할만 있고 학생 없음(회원id)', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT r.user_id AS id FROM user_roles r WHERE r.role_type = 'guardian_student' AND r.status = 'active' AND NOT EXISTS (SELECT 1 FROM students st WHERE st.guardian_user_id = r.user_id AND st.deleted_at IS NULL)) t
UNION ALL
SELECT 'B1.student_profile_no_role', '학생 있는데 역할 없음', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT st.id FROM students st WHERE st.deleted_at IS NULL AND NOT EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = st.guardian_user_id AND r.role_type = 'guardian_student' AND r.status = 'active')) t
UNION ALL
SELECT 'B3.study_room', '한 회원에 공부방 2개+(묶음별 id)', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT GROUP_CONCAT(id ORDER BY id SEPARATOR '/') AS id FROM study_rooms WHERE deleted_at IS NULL GROUP BY user_id HAVING COUNT(*) > 1) t
UNION ALL
SELECT 'B3.tutor', '한 회원에 과외쌤 2개+(묶음별 id)', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT GROUP_CONCAT(id ORDER BY id SEPARATOR '/') AS id FROM tutors GROUP BY user_id HAVING COUNT(*) > 1) t
UNION ALL
SELECT 'B4.no_role', '활성 회원인데 역할 없음', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT u.id FROM users u WHERE u.status = 'active' AND u.oauth_role_pending = 0 AND NOT EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = u.id)) t
UNION ALL
SELECT 'B4.multi_primary', '대표 역할 2개+(회원id)', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT user_id AS id FROM user_roles WHERE is_primary = 1 AND status = 'active' GROUP BY user_id HAVING COUNT(*) > 1) t
UNION ALL
SELECT 'B4.no_user_profile', '[참고] 활성 회원인데 user_profiles 없음', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT u.id FROM users u WHERE u.status = 'active' AND NOT EXISTS (SELECT 1 FROM user_profiles p WHERE p.user_id = u.id)) t
UNION ALL
SELECT 'B5.study_room', '탈퇴·차단 회원의 공개 공부방', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT s.id FROM study_rooms s JOIN users u ON u.id = s.user_id WHERE s.profile_status = 'published' AND s.deleted_at IS NULL AND u.status IN ('withdrawn', 'blocked')) t
UNION ALL
SELECT 'B5.tutor', '탈퇴·차단 회원의 공개 과외쌤', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT t.id FROM tutors t JOIN users u ON u.id = t.user_id WHERE t.profile_status = 'published' AND u.status IN ('withdrawn', 'blocked')) t
UNION ALL
SELECT 'B5.student', '탈퇴·차단 회원의 공개 학생', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT st.id FROM students st JOIN users u ON u.id = st.guardian_user_id WHERE st.exposure_status = 'published' AND st.deleted_at IS NULL AND u.status IN ('withdrawn', 'blocked')) t
UNION ALL
SELECT 'C1.study_rooms.region_id', '없는 지역id 사용', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id AS id FROM study_rooms x LEFT JOIN regions g ON g.id = x.region_id WHERE x.region_id IS NOT NULL AND g.id IS NULL) t
UNION ALL
SELECT 'C1.study_room_regions.region_id', '없는 지역id 사용', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id AS id FROM study_room_regions x LEFT JOIN regions g ON g.id = x.region_id WHERE g.id IS NULL) t
UNION ALL
SELECT 'C1.tutor_regions.region_id', '없는 지역id 사용', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id AS id FROM tutor_regions x LEFT JOIN regions g ON g.id = x.region_id WHERE g.id IS NULL) t
UNION ALL
SELECT 'C1.students.preferred_studyroom_region_id', '없는 지역id 사용', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id AS id FROM students x LEFT JOIN regions g ON g.id = x.preferred_studyroom_region_id WHERE x.preferred_studyroom_region_id IS NOT NULL AND g.id IS NULL) t
UNION ALL
SELECT 'C1.students.preferred_tutor_region_id', '없는 지역id 사용', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id AS id FROM students x LEFT JOIN regions g ON g.id = x.preferred_tutor_region_id WHERE x.preferred_tutor_region_id IS NOT NULL AND g.id IS NULL) t
UNION ALL
SELECT 'C1.user_profiles.default_region_id', '없는 지역id 사용', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.user_id AS id FROM user_profiles x LEFT JOIN regions g ON g.id = x.default_region_id WHERE x.default_region_id IS NOT NULL AND g.id IS NULL) t
UNION ALL
SELECT 'C1.positions.region_id', '없는 지역id 사용', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id AS id FROM provider_position_subscriptions x LEFT JOIN regions g ON g.id = x.region_id WHERE x.region_id IS NOT NULL AND g.id IS NULL) t
UNION ALL
SELECT 'C1.complexes.region_id', '없는 지역id 사용', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id AS id FROM complexes x LEFT JOIN regions g ON g.id = x.region_id WHERE g.id IS NULL) t
UNION ALL
SELECT 'C2.room_no_biz_region', '공개 공부방 사업장 동 없음', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT s.id FROM study_rooms s WHERE s.profile_status = 'published' AND s.deleted_at IS NULL AND s.region_id IS NULL) t
UNION ALL
SELECT 'C2.room_no_promo_slot1', '공개 공부방 홍보지역1 없음', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT s.id FROM study_rooms s WHERE s.profile_status = 'published' AND s.deleted_at IS NULL AND NOT EXISTS (SELECT 1 FROM study_room_regions sr WHERE sr.study_room_id = s.id AND sr.slot = 1)) t
UNION ALL
SELECT 'C2.tutor_no_region', '공개 과외쌤 지역 없음', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT t.id FROM tutors t WHERE t.profile_status = 'published' AND NOT EXISTS (SELECT 1 FROM tutor_regions tr WHERE tr.tutor_id = t.id)) t
UNION ALL
SELECT 'C4.slot_out_of_range', '홍보지역 칸번호 1~3 밖', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT id FROM study_room_regions WHERE slot NOT IN (1, 2, 3)) t
UNION ALL
SELECT 'C4.complex_basis_no_complex', '단지기준인데 단지 빔', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT id FROM study_room_regions WHERE region_basis_type = 'complex' AND complex_id IS NULL) t
UNION ALL
SELECT 'C4.complex_missing', '없는 단지 가리킴', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT sr.id FROM study_room_regions sr LEFT JOIN complexes c ON c.id = sr.complex_id WHERE sr.complex_id IS NOT NULL AND c.id IS NULL) t
UNION ALL
SELECT 'C4.complex_region_mismatch', '단지 동과 칸 동 다름', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT sr.id FROM study_room_regions sr JOIN complexes c ON c.id = sr.complex_id WHERE c.region_id <> sr.region_id) t
UNION ALL
SELECT 'C5.diff_sido', '[참고] 홍보지역2·3 시도 다름(공부방id)', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT s.id FROM study_room_regions sr JOIN study_rooms s ON s.id = sr.study_room_id AND s.deleted_at IS NULL JOIN regions rb ON rb.id = s.region_id JOIN regions rp ON rp.id = sr.region_id WHERE sr.slot IN (2, 3) AND rb.sido_code <> rp.sido_code) t
UNION ALL
SELECT 'C5.diff_sigungu', '[참고] 홍보지역2·3 같은 시도·시군구 다름(공부방id)', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT s.id FROM study_room_regions sr JOIN study_rooms s ON s.id = sr.study_room_id AND s.deleted_at IS NULL JOIN regions rb ON rb.id = s.region_id JOIN regions rp ON rp.id = sr.region_id WHERE sr.slot IN (2, 3) AND rb.sido_code = rp.sido_code AND rb.sigungu_code <> rp.sigungu_code) t
UNION ALL
SELECT 'C5.slot23_total', '[참고] 홍보지역2·3 전체 칸 수(공부방id)', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT s.id FROM study_room_regions sr JOIN study_rooms s ON s.id = sr.study_room_id AND s.deleted_at IS NULL JOIN regions rb ON rb.id = s.region_id JOIN regions rp ON rp.id = sr.region_id WHERE sr.slot IN (2, 3)) t
UNION ALL
SELECT 'C6.study_room_regions', '[참고] 비활성 지역 쓰는 홍보지역', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id FROM study_room_regions x JOIN regions g ON g.id = x.region_id WHERE g.is_active = 0) t
UNION ALL
SELECT 'C6.tutor_regions', '[참고] 비활성 지역 쓰는 과외 지역', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id FROM tutor_regions x JOIN regions g ON g.id = x.region_id WHERE g.is_active = 0) t
UNION ALL
SELECT 'D2.test_named', '테스트 이름 주문', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT id FROM provider_payment_orders WHERE LOWER(product_id) LIKE '%test%' OR LOWER(variant_label) LIKE '%test%' OR variant_label LIKE '%테스트%') t
UNION ALL
SELECT 'D2.zero_won', '0원 주문', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT id FROM provider_payment_orders WHERE amount_won = 0) t
UNION ALL
SELECT 'D2.zero_won_paid', '0원 결제완료·환불 주문', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT id FROM provider_payment_orders WHERE amount_won = 0 AND status IN ('paid', 'refund_requested', 'refunded')) t
UNION ALL
SELECT 'D3.paid_no_paid_at', '결제완료인데 결제시각 없음', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT id FROM provider_payment_orders WHERE status IN ('paid', 'refund_requested', 'refunded') AND paid_at IS NULL) t
UNION ALL
SELECT 'D3.amount_over_list', '결제액이 정가보다 큼', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT id FROM provider_payment_orders WHERE list_price_won IS NOT NULL AND amount_won > list_price_won) t
UNION ALL
SELECT 'D4.badge_no_order', '주문 없는 배지', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id FROM provider_paid_badges x LEFT JOIN provider_payment_orders o ON o.order_ref = x.source_order_ref WHERE x.source_order_ref IS NOT NULL AND o.id IS NULL) t
UNION ALL
SELECT 'D4.pack_no_order', '주문 없는 쪽지권', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id FROM provider_ticket_packs x LEFT JOIN provider_payment_orders o ON o.order_ref = x.source_order_ref WHERE x.source_order_ref IS NOT NULL AND o.id IS NULL) t
UNION ALL
SELECT 'D4.memo_intent_no_order', '주문 없는 즉시쪽지', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id FROM provider_immediate_memo_intents x LEFT JOIN provider_payment_orders o ON o.order_ref = x.order_ref WHERE o.id IS NULL) t
UNION ALL
SELECT 'D6.exposure_active_not_paid', '노출 active인데 결제 paid 아님', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT id FROM study_room_exposure_assignments WHERE exposure_status = 'active' AND payment_status <> 'paid') t
UNION ALL
SELECT 'D6.exposure_active_expired', '노출 active인데 기간 지남', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT id FROM study_room_exposure_assignments WHERE exposure_status = 'active' AND ends_at < NOW()) t
UNION ALL
SELECT 'D6.position_active_no_paid_order', '이용중 결제구독인데 결제 주문 없음', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT p.id FROM provider_position_subscriptions p WHERE CURDATE() < p.end_exclusive_on AND p.source = 'payment' AND NOT EXISTS (SELECT 1 FROM provider_payment_orders o WHERE o.user_id = p.user_id AND o.product_kind = 'position' AND o.status IN ('paid', 'refund_requested'))) t
UNION ALL
SELECT 'D6.position_active_all_refunded', '이용중 결제구독인데 주문 모두 환불·취소', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT p.id FROM provider_position_subscriptions p WHERE CURDATE() < p.end_exclusive_on AND p.source = 'payment' AND EXISTS (SELECT 1 FROM provider_payment_orders o WHERE o.user_id = p.user_id AND o.product_kind = 'position') AND NOT EXISTS (SELECT 1 FROM provider_payment_orders o WHERE o.user_id = p.user_id AND o.product_kind = 'position' AND o.status IN ('paid', 'refund_requested'))) t
UNION ALL
SELECT 'D9.badge_active_order_refunded', '환불된 주문의 배지 아직 활성', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT b.id FROM provider_paid_badges b JOIN provider_payment_orders o ON o.order_ref = b.source_order_ref WHERE b.status = 'active' AND CURDATE() < b.end_exclusive_on AND o.status IN ('refunded', 'cancelled', 'failed')) t
UNION ALL
SELECT 'D9.pack_left_order_refunded', '환불된 주문의 쪽지권 잔량 남음', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT k.id FROM provider_ticket_packs k JOIN provider_payment_orders o ON o.order_ref = k.source_order_ref WHERE k.remaining > 0 AND k.expires_at > NOW() AND o.status IN ('refunded', 'cancelled', 'failed')) t
UNION ALL
SELECT 'E1.messages_no_thread', '대화방 없는 쪽지', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT m.id FROM messages m LEFT JOIN message_threads t ON t.id = m.thread_id WHERE t.id IS NULL) t
UNION ALL
SELECT 'E1.attach_no_message', '쪽지 없는 첨부', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT a.id FROM message_attachments a LEFT JOIN messages m ON m.id = a.message_id WHERE m.id IS NULL) t
UNION ALL
SELECT 'E1.attach_thread_mismatch', '첨부와 쪽지의 대화방 다름', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT a.id FROM message_attachments a JOIN messages m ON m.id = a.message_id WHERE m.thread_id <> a.thread_id) t
UNION ALL
SELECT 'E1.reads_no_thread', '대화방 없는 읽음기록(thread_id)', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT r.thread_id AS id FROM message_thread_reads r LEFT JOIN message_threads t ON t.id = r.thread_id WHERE t.id IS NULL) t
UNION ALL
SELECT 'E1.state_no_thread', '대화방 없는 보관·차단상태(thread_id)', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT s.thread_id AS id FROM message_thread_participant_state s LEFT JOIN message_threads t ON t.id = s.thread_id WHERE t.id IS NULL) t
UNION ALL
SELECT 'E1.thread_low_user_missing', '대화방 참여자(낮은id) 회원 없음', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT t.id FROM message_threads t LEFT JOIN users u ON u.id = t.participant_low_user_id WHERE u.id IS NULL) t
UNION ALL
SELECT 'E1.thread_high_user_missing', '대화방 참여자(높은id) 회원 없음', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT t.id FROM message_threads t LEFT JOIN users u ON u.id = t.participant_high_user_id WHERE u.id IS NULL) t
UNION ALL
SELECT 'E1.memo_intent_thread_missing', '즉시쪽지의 대화방 없음', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT i.id FROM provider_immediate_memo_intents i LEFT JOIN message_threads t ON t.id = i.thread_id WHERE i.thread_id IS NOT NULL AND t.id IS NULL) t
UNION ALL
SELECT 'E2.sender_not_participant', '보낸 사람이 참여자 아님(쪽지id)', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT m.id FROM messages m JOIN message_threads t ON t.id = m.thread_id WHERE m.sender_user_id NOT IN (t.participant_low_user_id, t.participant_high_user_id)) t
UNION ALL
SELECT 'E2.initiator_not_participant', '시작한 사람이 참여자 아님', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT t.id FROM message_threads t WHERE t.initiated_by_user_id IS NOT NULL AND t.initiated_by_user_id NOT IN (t.participant_low_user_id, t.participant_high_user_id)) t
UNION ALL
SELECT 'E2.reads_not_participant', '읽음기록이 참여자 것 아님(thread_id)', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT r.thread_id AS id FROM message_thread_reads r JOIN message_threads t ON t.id = r.thread_id WHERE r.user_id NOT IN (t.participant_low_user_id, t.participant_high_user_id)) t
UNION ALL
SELECT 'E2.state_not_participant', '상태기록이 참여자 것 아님(thread_id)', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT s.thread_id AS id FROM message_thread_participant_state s JOIN message_threads t ON t.id = s.thread_id WHERE s.user_id NOT IN (t.participant_low_user_id, t.participant_high_user_id)) t
UNION ALL
SELECT 'E2.participant_order_wrong', '참여자 순서(낮은<높은) 틀림', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT id FROM message_threads WHERE participant_low_user_id >= participant_high_user_id) t
UNION ALL
SELECT 'E3.ctx_student_missing', '대화방 맥락 학생 없음', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT t.id FROM message_threads t LEFT JOIN students st ON st.id = t.context_id WHERE t.context_kind = 'student' AND st.id IS NULL) t
UNION ALL
SELECT 'E3.ctx_study_room_missing', '대화방 맥락 공부방 없음', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT t.id FROM message_threads t LEFT JOIN study_rooms s ON s.id = t.context_id WHERE t.context_kind = 'study_room' AND s.id IS NULL) t
UNION ALL
SELECT 'E3.ctx_tutor_missing', '대화방 맥락 과외쌤 없음', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT t.id FROM message_threads t LEFT JOIN tutors tu ON tu.id = t.context_id WHERE t.context_kind = 'tutor' AND tu.id IS NULL) t
UNION ALL
SELECT 'E4.empty_threads', '[참고] 쪽지 없는 대화방', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT t.id FROM message_threads t WHERE NOT EXISTS (SELECT 1 FROM messages m WHERE m.thread_id = t.id)) t
UNION ALL
SELECT 'F1.filled', '[참고] 수업료 숫자·글자 다 있음(기대 3)', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT id FROM study_room_classes WHERE monthly_fee_amount IS NOT NULL AND monthly_fee <> '') t
UNION ALL
SELECT 'F1.amount_only', '수업료 숫자만 있고 글자 빔', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT id FROM study_room_classes WHERE monthly_fee_amount IS NOT NULL AND monthly_fee = '') t
UNION ALL
SELECT 'F1.text_only', '수업료 글자만 있고 숫자 빔', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT id FROM study_room_classes WHERE monthly_fee_amount IS NULL AND monthly_fee <> '') t
UNION ALL
SELECT 'F1.zero_amount', '수업료 0원', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT id FROM study_room_classes WHERE monthly_fee_amount = 0) t
UNION ALL
SELECT 'F1.not_1000_unit', '수업료 천원 단위 아님', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT id FROM study_room_classes WHERE monthly_fee_amount IS NOT NULL AND MOD(monthly_fee_amount, 1000) <> 0) t
UNION ALL
SELECT 'F1.text_mismatch', '수업료 숫자와 글자 안 맞음', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT id FROM study_room_classes WHERE monthly_fee_amount IS NOT NULL AND monthly_fee <> '' AND monthly_fee <> CONCAT(monthly_fee_amount DIV 1000, '천원')) t
UNION ALL
SELECT 'F1.total_rows', '[참고] 수업 행 전체', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT id FROM study_room_classes) t
UNION ALL
SELECT 'F2.study_rooms.price_amount', '[참고] 공부방 대표금액 0', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT id FROM study_rooms WHERE price_amount = 0 AND deleted_at IS NULL) t
UNION ALL
SELECT 'F2.tutors.preferred_fee_amount', '[참고] 과외쌤 희망수업료 0', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT id FROM tutors WHERE preferred_fee_amount = 0) t
UNION ALL
SELECT 'F2.students.preferred_fee_amount', '[참고] 학생 희망수업료 0', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT id FROM students WHERE preferred_fee_amount = 0 AND deleted_at IS NULL) t
UNION ALL
SELECT 'F2.students.preferred_studyroom_fee_amount', '[참고] 학생 희망 공부방비 0', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT id FROM students WHERE preferred_studyroom_fee_amount = 0 AND deleted_at IS NULL) t
UNION ALL
SELECT 'F3.career_zero', '[참고] 공부방 경력 0년', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT id FROM study_rooms WHERE career_years = 0 AND deleted_at IS NULL) t
UNION ALL
SELECT 'F4.remaining_over_pack', '쪽지권 잔량이 팩 크기보다 큼', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT id FROM provider_ticket_packs WHERE remaining > pack_size) t
UNION ALL
SELECT 'G1.dup_email', '이메일 대소문자·공백 중복(묶음별 회원id)', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT GROUP_CONCAT(id ORDER BY id SEPARATOR '/') AS id FROM users GROUP BY LOWER(TRIM(email)) HAVING COUNT(*) > 1) t
UNION ALL
SELECT 'G2.gmail_same', '[참고] Gmail 점·+태그 같은 주소(묶음별 회원id)', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT GROUP_CONCAT(id ORDER BY id SEPARATOR '/') AS id FROM users WHERE LOWER(TRIM(email)) LIKE '%@gmail.com' OR LOWER(TRIM(email)) LIKE '%@googlemail.com' GROUP BY REPLACE(SUBSTRING_INDEX(SUBSTRING_INDEX(LOWER(TRIM(email)), '@', 1), '+', 1), '.', '') HAVING COUNT(*) > 1) t
UNION ALL
SELECT 'G3.oauth_dup', '한 회원에 같은 소셜 2개+(회원id)', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT user_id AS id FROM user_oauth_accounts GROUP BY user_id, provider HAVING COUNT(*) > 1) t
UNION ALL
SELECT 'H.users_test_email', '[참고] 테스트 이메일 회원', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT id FROM users WHERE LOWER(email) LIKE '%test%' OR LOWER(email) LIKE '%example.%' OR LOWER(email) LIKE '%.invalid') t
UNION ALL
SELECT 'H.rooms_test_name', '[참고] 테스트 이름 공부방', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT id FROM study_rooms WHERE deleted_at IS NULL AND (LOWER(study_room_name) LIKE '%test%' OR study_room_name LIKE '%테스트%')) t
UNION ALL
SELECT 'H.rooms_test_name_published', '테스트 이름 공부방 공개중(0이 좋음)', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT id FROM study_rooms WHERE deleted_at IS NULL AND profile_status = 'published' AND (LOWER(study_room_name) LIKE '%test%' OR study_room_name LIKE '%테스트%')) t
UNION ALL
SELECT 'H.tutors_test_name', '[참고] 테스트 이름 과외쌤', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT id FROM tutors WHERE LOWER(tutor_display_name) LIKE '%test%' OR tutor_display_name LIKE '%테스트%') t
UNION ALL
SELECT 'H.tutors_test_name_published', '테스트 이름 과외쌤 공개중(0이 좋음)', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT id FROM tutors WHERE profile_status = 'published' AND (LOWER(tutor_display_name) LIKE '%test%' OR tutor_display_name LIKE '%테스트%')) t
UNION ALL
SELECT 'H.students_test_name', '[참고] 테스트 이름 학생', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT id FROM students WHERE deleted_at IS NULL AND (LOWER(public_display_name) LIKE '%test%' OR public_display_name LIKE '%테스트%' OR request_title LIKE '%테스트%')) t
UNION ALL
SELECT 'H.students_test_name_published', '테스트 이름 학생 공개중(0이 좋음)', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT id FROM students WHERE deleted_at IS NULL AND exposure_status = 'published' AND (LOWER(public_display_name) LIKE '%test%' OR public_display_name LIKE '%테스트%' OR request_title LIKE '%테스트%')) t
UNION ALL
SELECT 'H.popups_test_published', '테스트 팝업 공개중(0이 좋음)', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT id FROM home_popups WHERE published = 1 AND (content LIKE '%테스트%' OR LOWER(content) LIKE '%test%')) t
UNION ALL
SELECT 'H.board_posts_test_title', '[참고] 테스트 제목 게시글', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT id FROM board_posts WHERE title LIKE '%테스트%' OR LOWER(title) LIKE '%test%') t
UNION ALL
SELECT 'H.orders_dev_mock', '[참고] dev_mock 테스트결제 주문(오픈 전 정리)', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT id FROM provider_payment_orders WHERE pg_provider = 'dev_mock') t
UNION ALL
SELECT 'D1.orders' AS chk,
  CONCAT('[참고] 주문 수 ', IFNULL(CONVERT(pg_provider USING utf8mb4), '(없음)'), ' / ', IFNULL(CONVERT(status USING utf8mb4), '(없음)')) AS title,
  COUNT(*) AS cnt,
  CAST(CONCAT('합계원 ', IFNULL(SUM(amount_won), 0)) AS CHAR) AS sample_ids
  FROM provider_payment_orders
  GROUP BY pg_provider, status
UNION ALL
SELECT 'D8.position' AS chk,
  CONCAT('[참고] 이용중 구독 ', IFNULL(CONVERT(sku_code USING utf8mb4), '(없음)'), ' / ', IFNULL(CONVERT(source USING utf8mb4), '(없음)')) AS title,
  COUNT(*) AS cnt,
  CAST(SUBSTRING_INDEX(GROUP_CONCAT(id ORDER BY id SEPARATOR ','), ',', 10) AS CHAR) AS sample_ids
  FROM provider_position_subscriptions WHERE CURDATE() < end_exclusive_on
  GROUP BY sku_code, source
UNION ALL
SELECT 'D8.badge' AS chk,
  CONCAT('[참고] 활성 배지 ', IFNULL(CONVERT(b.badge_code USING utf8mb4), '(없음)'), ' / ', b.src) AS title,
  COUNT(*) AS cnt,
  CAST(SUBSTRING_INDEX(GROUP_CONCAT(b.id ORDER BY b.id SEPARATOR ','), ',', 10) AS CHAR) AS sample_ids
  FROM (SELECT id, badge_code, IF(source_order_ref IS NULL, 'no_order', 'order') AS src
        FROM provider_paid_badges WHERE status = 'active' AND CURDATE() < end_exclusive_on) b
  GROUP BY b.badge_code, b.src
) z
ORDER BY (z.cnt = 0), z.chk;

-- ③ 늦게 붙은 표 점검 (083 환불 · 087 희망지역2 · 089 빠른매칭 · 090 포트원 결제id · 091 취소기록) ---
SELECT z.chk, z.title, z.cnt, z.sample_ids
FROM (
SELECT 'A4.quick_match_dispatches' AS chk, '학생 없는 빠른매칭' AS title, COUNT(*) AS cnt, CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR) AS sample_ids
  FROM (SELECT x.id FROM quick_match_dispatches x LEFT JOIN students st ON st.id = x.student_id WHERE st.id IS NULL) t
UNION ALL
SELECT 'C1.students.preferred_studyroom_region_extra_id', '없는 지역id 사용', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id AS id FROM students x LEFT JOIN regions g ON g.id = x.preferred_studyroom_region_extra_id WHERE x.preferred_studyroom_region_extra_id IS NOT NULL AND g.id IS NULL) t
UNION ALL
SELECT 'C1.students.preferred_tutor_region_extra_id', '없는 지역id 사용', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id AS id FROM students x LEFT JOIN regions g ON g.id = x.preferred_tutor_region_extra_id WHERE x.preferred_tutor_region_extra_id IS NOT NULL AND g.id IS NULL) t
UNION ALL
SELECT 'D3.portone_paid_no_payment_id', '포트원 결제인데 결제id 없음', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT id FROM provider_payment_orders WHERE pg_provider = 'portone_test' AND status IN ('paid', 'refund_requested', 'refunded') AND (pg_payment_id IS NULL OR pg_payment_id = '')) t
UNION ALL
SELECT 'D3.dup_pg_payment_id', '같은 결제id 주문 2개+(묶음별 주문id)', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT GROUP_CONCAT(id ORDER BY id SEPARATOR '/') AS id FROM provider_payment_orders WHERE pg_payment_id IS NOT NULL AND pg_payment_id <> '' GROUP BY pg_payment_id HAVING COUNT(*) > 1) t
UNION ALL
SELECT 'D4.refund_no_order', '주문 없는 환불요청', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id FROM provider_refund_requests x LEFT JOIN provider_payment_orders o ON o.order_ref = x.order_ref WHERE o.id IS NULL) t
UNION ALL
SELECT 'D4.pg_cancel_log_no_order', '주문 없는 포트원 취소기록', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT x.id FROM provider_pg_cancel_ops_log x LEFT JOIN provider_payment_orders o ON o.order_ref = x.order_ref WHERE x.order_ref IS NOT NULL AND o.id IS NULL) t
UNION ALL
SELECT 'D5.order_refunded_no_request', '환불됨 주문인데 환불요청 없음', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT o.id FROM provider_payment_orders o WHERE o.status = 'refunded' AND NOT EXISTS (SELECT 1 FROM provider_refund_requests r WHERE r.order_ref = o.order_ref)) t
UNION ALL
SELECT 'D5.request_refunded_order_not', '환불요청 환불됨인데 주문은 아님(요청id)', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT r.id FROM provider_refund_requests r JOIN provider_payment_orders o ON o.order_ref = r.order_ref WHERE r.status = 'refunded' AND o.status <> 'refunded') t
UNION ALL
SELECT 'D5.refund_over_amount', '환불액이 결제액보다 큼(요청id)', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT r.id FROM provider_refund_requests r JOIN provider_payment_orders o ON o.order_ref = r.order_ref WHERE r.refund_won > o.amount_won) t
UNION ALL
SELECT 'E1.quick_match_thread_missing', '빠른매칭의 대화방 없음', COUNT(*), CAST(SUBSTRING_INDEX(GROUP_CONCAT(t.id ORDER BY t.id), ',', 10) AS CHAR)
  FROM (SELECT q.id FROM quick_match_dispatches q LEFT JOIN message_threads t ON t.id = q.thread_id WHERE q.thread_id IS NOT NULL AND t.id IS NULL) t
) z
ORDER BY (z.cnt = 0), z.chk;
