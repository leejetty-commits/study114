-- =============================================================================
-- 2026-10-09 회원 계정 전부 삭제 (관리자 계정은 남김) — 초안 · 실행 전 사용자 확인 필요
-- 배경: 과외지역 단위 변경(정본 72 · 2026-10-08 잠금). 옛 구·동 값을 이관하지 않고 계정을 지우고 다시 만든다.
-- 작업 기록: docs/worklog/2026/10/2026-10-09-tutor-region-unit.md
--
-- 운영 phpMyAdmin 에서 사람이 단계별로 실행한다. Actions 는 실행하지 않는다.
-- 반드시 먼저 DB 백업(내보내기). 0단계 SELECT 결과를 보고 숫자를 기록한 뒤 1단계부터 진행한다.
--
-- ■ 관리자(남기는 계정) 판정 근거
--   1) users.admin_level IS NOT NULL                 — 036_admin_level_and_must_change.sql:12
--        ENUM('super_admin','sub_master'), NULL = 비운영. AdminRoleService 주석 「등급 정본: users.admin_level」.
--   2) user_roles.role_type = 'admin' 행이 있음       — 001_init user_roles.role_type, 036:25 백필 기준
--        038_dual_capability_admin.sql: 시장 역할(공부방·과외쌤 등) + admin_level 을 같이 가진 관리자도 있다.
--   3) 코드 보호 이메일                               — src/Admin/AdminRoleService.php:26-33,66
--        'jetty@naver.com'(BOOTSTRAP_SUPER_ADMIN_EMAIL), 'ops@dev.local','ops2@dev.local','ops3@dev.local',
--        그 밖의 '@dev.local' 끝 이메일. AdminMemberDeleteService::isProtectedOperator 도 1)·3)을 보호한다.
--   셋 중 하나라도 맞으면 남긴다.
--
-- ■ 지우는 순서 근거: src/Admin/AdminMemberDeleteService.php perform()/deleteImmediate()/deleteCards()
--   (후기·쪽지·찜·비교·최근 본 → 공부방 배지 → 학생 → 공부방 → 과외쌤 → 역할·프로필 → users)
--   FK 정리(sql/schema 001~077):
--   - users 를 RESTRICT 로 막는 표: user_profiles, user_roles, students(user_id·guardian_user_id), study_rooms, tutors
--   - study_rooms 를 지우면 CASCADE: study_room_regions/subject_targets/images/facilities/verification_documents/
--     badges/exposure_assignments/exposure_waitlists/price_items/primary_audiences/classes
--     (study_room_badges.source_document_id → verification_documents 가 RESTRICT 라 배지를 먼저 지운다)
--   - tutors 를 지우면 CASCADE: tutor_subject_targets/regions/lesson_places/images/teaching_style_badges/verification_documents
--   - students 를 지우면 CASCADE: student_subject_targets/preferred_lesson_places/preferred_teaching_style_badges,
--     provider_student_reviews, provider_request_unlocks
--   - users 를 지우면 CASCADE: user_favorites/compare_items/recent_views, provider_student_reviews, message_threads(→messages,
--     message_attachments, reads, participant_state), message_thread_reads, provider_entitlements, user_oauth_accounts,
--     auth_tokens, provider_ticket_packs, provider_request_unlocks, provider_system_notices, provider_reminder_dispatches,
--     provider_reviews(작성자), provider_review_replies, user_recommendations, provider_review_quotas, provider_review_blocks,
--     provider_payment_orders·provider_position_subscriptions (※ 071 미적용 때만. 071 은 이 두 FK 를 지운다)
--   - users 를 지우면 SET NULL: provider_profile_views.viewer_user_id, support_tickets.user_id
--   - FK 없는 참조(직접 지움): provider_reviews·user_favorites·user_compare_items·user_recent_views·user_recommendations 의
--     target(공부방·과외쌤·학생), provider_paid_badges, provider_profile_views(target), provider_immediate_memo_intents
--
-- ■ 이 SQL 이 지우지 않는 것(별도 처리)
--   - 업로드 파일(공부방·과외쌤 사진·서류): 서버 파일. AdminMemberDeleteService 는 MemberUploadPurge 로 따로 지운다.
--   - 동네 인사(환영) 기록: DB 가 아니라 NeighborhoodGreetingService 의 JSON 파일.
--   - 아래 「사용자 확인 필요」 표시 부분.
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

-- -----------------------------------------------------------------------------
-- 0단계. 미리 보기 (아무것도 바꾸지 않는다)
-- -----------------------------------------------------------------------------

-- 0-1. 남길 관리자 계정 목록 — 여기에 운영자가 모두 보이는지 눈으로 확인
SELECT u.id, u.email, u.status, u.admin_level,
       (SELECT GROUP_CONCAT(r.role_type ORDER BY r.is_primary DESC) FROM user_roles r WHERE r.user_id = u.id) AS roles
FROM users u
WHERE u.admin_level IS NOT NULL
   OR EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = u.id AND r.role_type = 'admin')
   OR LOWER(u.email) = 'jetty@naver.com'
   OR LOWER(u.email) LIKE '%@dev.local'
ORDER BY u.id;

-- 0-2. 숫자 확인
SELECT
  (SELECT COUNT(*) FROM users) AS users_all,
  (SELECT COUNT(*) FROM users u
     WHERE u.admin_level IS NOT NULL
        OR EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = u.id AND r.role_type = 'admin')
        OR LOWER(u.email) = 'jetty@naver.com'
        OR LOWER(u.email) LIKE '%@dev.local') AS users_keep,
  (SELECT COUNT(*) FROM study_rooms) AS study_rooms_all,
  (SELECT COUNT(*) FROM tutors) AS tutors_all,
  (SELECT COUNT(*) FROM students) AS students_all,
  (SELECT COUNT(*) FROM tutor_regions) AS tutor_regions_all,
  (SELECT COUNT(*) FROM message_threads) AS message_threads_all,
  (SELECT COUNT(*) FROM provider_reviews) AS provider_reviews_all,
  (SELECT COUNT(*) FROM provider_payment_orders) AS payment_orders_all,
  (SELECT COUNT(*) FROM provider_position_subscriptions) AS position_subs_all,
  (SELECT COUNT(*) FROM provider_ticket_packs) AS ticket_packs_all,
  (SELECT COUNT(*) FROM provider_entitlements) AS entitlements_all,
  (SELECT COUNT(*) FROM board_posts WHERE author_user_id IS NOT NULL) AS board_posts_by_user,
  (SELECT COUNT(*) FROM support_tickets WHERE user_id IS NOT NULL) AS support_tickets_by_user;

-- 0-3. 결제 표 FK 가 아직 있는지(071 적용 여부). 결과가 있으면 users 삭제 때 결제 기록도 CASCADE 로 같이 지워진다.
SELECT TABLE_NAME, CONSTRAINT_NAME, DELETE_RULE
FROM information_schema.REFERENTIAL_CONSTRAINTS
WHERE CONSTRAINT_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('provider_payment_orders', 'provider_position_subscriptions')
  AND REFERENCED_TABLE_NAME = 'users';

-- 0-4. 관리자 본인 계정에 붙은 시장 등록(겸직 관리자) — 「사용자 확인 필요」 7단계 참고
SELECT 'study_room' AS kind, s.id, s.user_id FROM study_rooms s
  JOIN users u ON u.id = s.user_id WHERE u.admin_level IS NOT NULL
UNION ALL
SELECT 'tutor', t.id, t.user_id FROM tutors t
  JOIN users u ON u.id = t.user_id WHERE u.admin_level IS NOT NULL
UNION ALL
SELECT 'student', st.id, st.guardian_user_id FROM students st
  JOIN users u ON u.id = st.guardian_user_id WHERE u.admin_level IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 1단계. 지울 대상 표 만들기 (작업용 표. 마지막 8단계에서 지운다)
-- -----------------------------------------------------------------------------

DROP TABLE IF EXISTS ops_wipe_20261009_users;
CREATE TABLE ops_wipe_20261009_users (id BIGINT UNSIGNED NOT NULL PRIMARY KEY) ENGINE=InnoDB;
INSERT INTO ops_wipe_20261009_users (id)
SELECT u.id FROM users u
WHERE u.admin_level IS NULL
  AND NOT EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = u.id AND r.role_type = 'admin')
  AND LOWER(u.email) <> 'jetty@naver.com'
  AND LOWER(u.email) NOT LIKE '%@dev.local';

DROP TABLE IF EXISTS ops_wipe_20261009_rooms;
CREATE TABLE ops_wipe_20261009_rooms (id BIGINT UNSIGNED NOT NULL PRIMARY KEY) ENGINE=InnoDB;
INSERT INTO ops_wipe_20261009_rooms (id)
SELECT s.id FROM study_rooms s JOIN ops_wipe_20261009_users w ON w.id = s.user_id;

DROP TABLE IF EXISTS ops_wipe_20261009_tutors;
CREATE TABLE ops_wipe_20261009_tutors (id BIGINT UNSIGNED NOT NULL PRIMARY KEY) ENGINE=InnoDB;
INSERT INTO ops_wipe_20261009_tutors (id)
SELECT t.id FROM tutors t JOIN ops_wipe_20261009_users w ON w.id = t.user_id;

DROP TABLE IF EXISTS ops_wipe_20261009_students;
CREATE TABLE ops_wipe_20261009_students (id BIGINT UNSIGNED NOT NULL PRIMARY KEY) ENGINE=InnoDB;
INSERT INTO ops_wipe_20261009_students (id)
SELECT st.id FROM students st
WHERE st.guardian_user_id IN (SELECT id FROM ops_wipe_20261009_users)
   OR st.user_id IN (SELECT id FROM ops_wipe_20261009_users);

-- 1-확인. 0-2 의 users_all - users_keep 과 wipe_users 가 같아야 한다.
SELECT
  (SELECT COUNT(*) FROM ops_wipe_20261009_users) AS wipe_users,
  (SELECT COUNT(*) FROM ops_wipe_20261009_rooms) AS wipe_rooms,
  (SELECT COUNT(*) FROM ops_wipe_20261009_tutors) AS wipe_tutors,
  (SELECT COUNT(*) FROM ops_wipe_20261009_students) AS wipe_students;

-- -----------------------------------------------------------------------------
-- 2단계 ~ 5단계, 7단계는 한 번에(트랜잭션) 실행한다. 6단계 결정 전에는 실행하지 않는다.
-- -----------------------------------------------------------------------------

START TRANSACTION;

-- 2단계. 후기·쪽지·찜·비교·최근 본·추천 (FK 없는 target 참조 포함)
DELETE FROM provider_review_replies
WHERE provider_user_id IN (SELECT id FROM ops_wipe_20261009_users);

DELETE FROM provider_reviews
WHERE author_user_id IN (SELECT id FROM ops_wipe_20261009_users)
   OR (provider_type = 'study_room' AND provider_id IN (SELECT id FROM ops_wipe_20261009_rooms))
   OR (provider_type = 'tutor' AND provider_id IN (SELECT id FROM ops_wipe_20261009_tutors));

DELETE FROM provider_student_reviews
WHERE provider_user_id IN (SELECT id FROM ops_wipe_20261009_users)
   OR student_id IN (SELECT id FROM ops_wipe_20261009_students);

DELETE FROM message_threads
WHERE participant_low_user_id IN (SELECT id FROM ops_wipe_20261009_users)
   OR participant_high_user_id IN (SELECT id FROM ops_wipe_20261009_users)
   OR initiated_by_user_id IN (SELECT id FROM ops_wipe_20261009_users);

DELETE FROM user_favorites
WHERE user_id IN (SELECT id FROM ops_wipe_20261009_users)
   OR (target_type = 'study_room' AND target_id IN (SELECT id FROM ops_wipe_20261009_rooms))
   OR (target_type = 'tutor' AND target_id IN (SELECT id FROM ops_wipe_20261009_tutors));

DELETE FROM user_compare_items
WHERE user_id IN (SELECT id FROM ops_wipe_20261009_users)
   OR (target_type = 'study_room' AND target_id IN (SELECT id FROM ops_wipe_20261009_rooms))
   OR (target_type = 'tutor' AND target_id IN (SELECT id FROM ops_wipe_20261009_tutors));

DELETE FROM user_recent_views
WHERE user_id IN (SELECT id FROM ops_wipe_20261009_users)
   OR (target_type = 'study_room' AND target_id IN (SELECT id FROM ops_wipe_20261009_rooms))
   OR (target_type = 'tutor' AND target_id IN (SELECT id FROM ops_wipe_20261009_tutors))
   OR (target_type = 'student' AND target_id IN (SELECT id FROM ops_wipe_20261009_students));

-- 남는 관리자 카드의 추천 수를 먼저 맞춘다(지워지는 회원이 누른 추천).
UPDATE study_rooms s
SET s.recommend_count = GREATEST(0, s.recommend_count - (
  SELECT COUNT(*) FROM user_recommendations ur
  WHERE ur.target_type = 'study_room' AND ur.target_id = s.id
    AND ur.user_id IN (SELECT id FROM ops_wipe_20261009_users)))
WHERE s.id NOT IN (SELECT id FROM ops_wipe_20261009_rooms);

UPDATE tutors t
SET t.recommend_count = GREATEST(0, t.recommend_count - (
  SELECT COUNT(*) FROM user_recommendations ur
  WHERE ur.target_type = 'tutor' AND ur.target_id = t.id
    AND ur.user_id IN (SELECT id FROM ops_wipe_20261009_users)))
WHERE t.id NOT IN (SELECT id FROM ops_wipe_20261009_tutors);

DELETE FROM user_recommendations
WHERE user_id IN (SELECT id FROM ops_wipe_20261009_users)
   OR (target_type = 'study_room' AND target_id IN (SELECT id FROM ops_wipe_20261009_rooms))
   OR (target_type = 'tutor' AND target_id IN (SELECT id FROM ops_wipe_20261009_tutors));

DELETE FROM provider_profile_views
WHERE (target_type = 'study_room' AND target_id IN (SELECT id FROM ops_wipe_20261009_rooms))
   OR (target_type = 'tutor' AND target_id IN (SELECT id FROM ops_wipe_20261009_tutors));

DELETE FROM provider_immediate_memo_intents
WHERE user_id IN (SELECT id FROM ops_wipe_20261009_users)
   OR (provider_type = 'study_room' AND provider_id IN (SELECT id FROM ops_wipe_20261009_rooms))
   OR (provider_type = 'tutor' AND provider_id IN (SELECT id FROM ops_wipe_20261009_tutors))
   OR student_id IN (SELECT id FROM ops_wipe_20261009_students);

DELETE FROM provider_request_unlocks
WHERE provider_user_id IN (SELECT id FROM ops_wipe_20261009_users)
   OR student_id IN (SELECT id FROM ops_wipe_20261009_students);

-- 3단계. 유료 배지(FK 없음. 결제 기록이 아니라 노출 상태)
DELETE FROM provider_paid_badges
WHERE (provider_type = 'study_room' AND provider_id IN (SELECT id FROM ops_wipe_20261009_rooms))
   OR (provider_type = 'tutor' AND provider_id IN (SELECT id FROM ops_wipe_20261009_tutors));

-- 4단계. 등록 카드 (자식 표는 CASCADE)
DELETE FROM study_room_badges
WHERE study_room_id IN (SELECT id FROM ops_wipe_20261009_rooms);

DELETE FROM students
WHERE id IN (SELECT id FROM ops_wipe_20261009_students);

DELETE FROM study_rooms
WHERE id IN (SELECT id FROM ops_wipe_20261009_rooms);

DELETE FROM tutors
WHERE id IN (SELECT id FROM ops_wipe_20261009_tutors);

-- 5단계. 역할·프로필
DELETE FROM user_roles
WHERE user_id IN (SELECT id FROM ops_wipe_20261009_users);

DELETE FROM user_profiles
WHERE user_id IN (SELECT id FROM ops_wipe_20261009_users);

-- -----------------------------------------------------------------------------
-- 6단계. 결제·정산 — 「사용자 확인 필요」 (둘 중 하나를 골라 주석을 풀거나, 둘 다 하지 않는다)
--   대상: provider_payment_orders, provider_position_subscriptions (결제·자리 구독 기록)
--         provider_ticket_packs, provider_entitlements (이용권 잔여 — users FK CASCADE 라 7단계에서 같이 지워진다)
--         admin_settlement_reports (077, 집계 숫자만. 회원 id 없음 → 이 SQL 은 건드리지 않는다)
--   ※ 0-3 결과에 FK 가 남아 있으면 7단계 users 삭제 때 결제 두 표도 CASCADE 로 지워진다.
-- -----------------------------------------------------------------------------

-- 6-A. 결제 기록 남기고 회원 표시만 지움 (관리자 회원 삭제와 같은 방식, 071 적용 필요)
-- UPDATE provider_position_subscriptions   -- AccountWithdrawService::endActivePositionSubscriptions 와 같음
-- SET end_exclusive_on = CURDATE(), ends_at = TIMESTAMP(CURDATE())
-- WHERE user_id IN (SELECT id FROM ops_wipe_20261009_users) AND CURDATE() < end_exclusive_on;
-- UPDATE provider_payment_orders
-- SET deleted_user_ref = user_id, deleted_display_name = '삭제된 회원', user_id = NULL
-- WHERE user_id IN (SELECT id FROM ops_wipe_20261009_users);
-- UPDATE provider_position_subscriptions
-- SET deleted_user_ref = user_id, deleted_display_name = '삭제된 회원', user_id = NULL
-- WHERE user_id IN (SELECT id FROM ops_wipe_20261009_users);

-- 6-B. 결제 기록까지 지움 (시험 결제뿐일 때)
-- DELETE FROM provider_payment_orders WHERE user_id IN (SELECT id FROM ops_wipe_20261009_users);
-- DELETE FROM provider_position_subscriptions WHERE user_id IN (SELECT id FROM ops_wipe_20261009_users);

-- -----------------------------------------------------------------------------
-- 7단계. 회원 계정 (CASCADE: OAuth 연결·로그인 토큰·이용권·알림 등. SET NULL: 1:1 문의·조회 기록)
-- -----------------------------------------------------------------------------
DELETE FROM users
WHERE id IN (SELECT id FROM ops_wipe_20261009_users);

-- 확인: 남은 users 수가 0-2 의 users_keep 과 같고, 아래 값이 모두 0 이어야 한다.
SELECT
  (SELECT COUNT(*) FROM users) AS users_left,
  (SELECT COUNT(*) FROM study_rooms s WHERE s.user_id IN (SELECT id FROM ops_wipe_20261009_users)) AS rooms_left,
  (SELECT COUNT(*) FROM tutors t WHERE t.user_id IN (SELECT id FROM ops_wipe_20261009_users)) AS tutors_left,
  (SELECT COUNT(*) FROM students st WHERE st.id IN (SELECT id FROM ops_wipe_20261009_students)) AS students_left;

-- 숫자가 맞으면 COMMIT, 아니면 ROLLBACK.
COMMIT;
-- ROLLBACK;

-- -----------------------------------------------------------------------------
-- 「사용자 확인 필요」 그 밖의 항목 (이 SQL 은 지우지 않음)
-- -----------------------------------------------------------------------------
-- (a) 게시판 글·댓글·반응·신고: board_posts.author_user_id, board_post_comments.author_user_id,
--     board_post_reactions.user_id, board_post_reports.reporter_user_id — FK 없음. 지운 회원 번호가 남는다.
--     지우려면: DELETE FROM board_post_reactions WHERE user_id IN (SELECT id FROM ops_wipe_20261009_users); 등
-- (b) 1:1 문의(support_tickets): users 삭제 때 user_id 가 NULL 로 바뀌고 글은 남는다.
-- (c) 겸직 관리자(0-4 결과)의 공부방·과외쌤·학생 등록: 관리자 계정이라 남겼다. 과외지역이 옛 구 값이면
--     새 규칙에서 저장이 거절되므로 마이페이지에서 다시 등록하거나 따로 지운다.
-- (d) admin_reports(신고 대상 id 문자열)·admin_operation_logs: 운영 기록이라 남긴다.
-- (e) 업로드 파일·동네 인사 JSON: DB 밖. 서버 파일 정리는 따로.

-- -----------------------------------------------------------------------------
-- 8단계. 작업용 표 정리 (COMMIT 확인 뒤)
-- -----------------------------------------------------------------------------
-- DROP TABLE IF EXISTS ops_wipe_20261009_users, ops_wipe_20261009_rooms, ops_wipe_20261009_tutors, ops_wipe_20261009_students;
