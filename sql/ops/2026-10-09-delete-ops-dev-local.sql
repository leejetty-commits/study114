-- =============================================================================
-- 2026-10-09 — 운영 DB에서 개발용 운영자 계정 ops@dev.local 삭제
-- 작업 기록: docs/worklog/2026/10/2026-10-09-remove-dev-operator.md
--
-- 배경
--   sql/schema/026_admin_dev_seed.sql (rest-schema.sql 에도 복사됨)이 운영 DB에
--   ops@dev.local 을 만들었다. 비밀번호가 공개된 "password", 전화 010-9999-0001(가짜).
--   운영 콘솔에서 이미 정지(status = 'blocked') 처리했다.
--   ops2@dev.local · ops3@dev.local 은 운영 DB에 없다(사용자 확인).
--
-- 실행 방법 (MySQL 8.0 · phpMyAdmin)
--   * GitHub Actions는 이 SQL을 실행하지 않는다. 사람이 phpMyAdmin에서 직접 실행한다.
--   * phpMyAdmin 왼쪽에서 운영 DB를 먼저 선택한다. (USE 문 없음)
--   * STEP 1 → 결과 확인 → STEP 2 → STEP 3 순서로, 단계마다 따로 붙여 넣어 실행한다.
--   * 단계끼리 변수를 넘기지 않는다. 각 단계는 혼자 실행해도 된다.
--   * 임시 테이블을 쓰지 않는다.
--
-- 안전장치
--   * 대상은 email = 'ops@dev.local' 한 행뿐이다.
--   * jetty@naver.com · leejetty@gmail.com 은 조건으로 한 번 더 제외한다.
--   * admin_level 이 super_admin 이면 지우지 않는다 (sub_master 또는 NULL 만).
--   * status 가 'blocked'(정지)일 때만 지운다. 정지가 아니면 아무것도 지워지지 않는다.
--   * 공부방·과외쌤·학생 카드가 하나라도 있으면 아무것도 지우지 않는다.
--   * 운영 로그(admin_operation_logs)는 지우지 않는다. users 와 FK가 없고
--     operator_id 에 이메일 문자열로 남아 있어 계정을 지워도 그대로 보존된다.
-- =============================================================================


-- =============================================================================
-- STEP 1 — 삭제 전 확인 (SELECT 만. 아무것도 바꾸지 않는다)
-- =============================================================================

-- 1-1. 대상과 보호 계정. ops@dev.local 행의 status 가 blocked 인지,
--      admin_level 이 sub_master(또는 NULL)인지 본다.
--      jetty@naver.com · leejetty@gmail.com 은 비교용으로만 같이 본다.
SELECT u.id, u.email, u.status, u.admin_level, u.created_at, u.last_login_at
FROM users u
WHERE u.email IN ('ops@dev.local', 'ops2@dev.local', 'ops3@dev.local',
                  'jetty@naver.com', 'leejetty@gmail.com')
ORDER BY u.id;

-- 1-2. ops@dev.local 의 프로필·역할 행 (STEP 2가 지운다)
SELECT p.user_id, p.real_name, p.phone
FROM user_profiles p
INNER JOIN users u ON u.id = p.user_id
WHERE u.email = 'ops@dev.local';

SELECT r.*
FROM user_roles r
INNER JOIN users u ON u.id = r.user_id
WHERE u.email = 'ops@dev.local';

-- 1-3. 운영 DB에서 users.id 를 가리키는 FK 전체 목록과 삭제 규칙.
--      DELETE_RULE 이 RESTRICT / NO ACTION 인 테이블에 행이 있으면 users 삭제가 막힌다.
--      CASCADE 는 같이 지워지고, SET NULL 은 user_id 만 비워진다.
SELECT kcu.TABLE_NAME, kcu.COLUMN_NAME, kcu.CONSTRAINT_NAME, rc.DELETE_RULE
FROM information_schema.KEY_COLUMN_USAGE kcu
INNER JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
  ON rc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
 AND rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
 AND rc.TABLE_NAME = kcu.TABLE_NAME
WHERE kcu.TABLE_SCHEMA = DATABASE()
  AND kcu.REFERENCED_TABLE_SCHEMA = DATABASE()
  AND kcu.REFERENCED_TABLE_NAME = 'users'
  AND kcu.REFERENCED_COLUMN_NAME = 'id'
ORDER BY rc.DELETE_RULE, kcu.TABLE_NAME, kcu.COLUMN_NAME;

-- 1-4. 위 FK마다 ops@dev.local 행 수. (1-3 목록으로 자동 생성 · 3문장을 한 번에 실행)
--      on_delete 가 RESTRICT / NO ACTION 이고 cnt > 0 인 줄이 차단 요인이다.
--      user_profiles · user_roles 는 STEP 2가 먼저 지운다.
--      students · study_rooms · tutors 등 그 밖의 RESTRICT 줄이 cnt > 0 이면
--      STEP 2를 실행하지 말고 멈춘다 (STEP 2도 이 경우 아무것도 지우지 않는다).
--      CASCADE 줄의 cnt 는 users 삭제 때 같이 지워지는 행 수다.
--        - message_threads 가 cnt > 0 이면 상대방 쪽지함의 대화도 같이 사라진다.
--        - provider_review_blocks.blocked_by_user_id 가 cnt > 0 이면 그 후기 차단 기록이 사라진다.
--        이런 줄이 있으면 실행 전에 보고한다.
SET SESSION group_concat_max_len = 1000000;
SET @s114_q := (
  SELECT CONCAT(
    'SELECT * FROM (',
    GROUP_CONCAT(
      CONCAT(
        'SELECT ''', kcu.TABLE_NAME, ''' AS tbl, ''', kcu.COLUMN_NAME, ''' AS col, ''',
        rc.DELETE_RULE, ''' AS on_delete, COUNT(*) AS cnt FROM `', kcu.TABLE_NAME,
        '` WHERE `', kcu.COLUMN_NAME, '` = (SELECT id FROM users WHERE email = ''ops@dev.local'' LIMIT 1)'
      )
      SEPARATOR ' UNION ALL '
    ),
    ') t ORDER BY (on_delete IN (''RESTRICT'', ''NO ACTION'')) DESC, cnt DESC, tbl, col'
  )
  FROM information_schema.KEY_COLUMN_USAGE kcu
  INNER JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
    ON rc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
   AND rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
   AND rc.TABLE_NAME = kcu.TABLE_NAME
  WHERE kcu.TABLE_SCHEMA = DATABASE()
    AND kcu.REFERENCED_TABLE_SCHEMA = DATABASE()
    AND kcu.REFERENCED_TABLE_NAME = 'users'
    AND kcu.REFERENCED_COLUMN_NAME = 'id'
);
PREPARE s114_ps FROM @s114_q; EXECUTE s114_ps; DEALLOCATE PREPARE s114_ps;

-- 1-5. FK 없이 users.id 를 숫자로 들고 있는 칼럼 (삭제를 막지 않지만, 남으면 고아 행이 된다)
--      071 이후 결제·구독은 FK가 없다. cnt > 0 이면 실행 전에 보고한다.
SELECT 'provider_payment_orders.user_id' AS ref, COUNT(*) AS cnt
  FROM provider_payment_orders
 WHERE user_id = (SELECT id FROM users WHERE email = 'ops@dev.local' LIMIT 1)
UNION ALL
SELECT 'provider_position_subscriptions.user_id', COUNT(*)
  FROM provider_position_subscriptions
 WHERE user_id = (SELECT id FROM users WHERE email = 'ops@dev.local' LIMIT 1)
UNION ALL
SELECT 'board_posts.author_user_id', COUNT(*)
  FROM board_posts
 WHERE author_user_id = (SELECT id FROM users WHERE email = 'ops@dev.local' LIMIT 1);

-- 1-6. 075(커뮤니티 댓글·반응·신고) 테이블. 075 미적용 DB면 "테이블 없음" 오류가 나므로 건너뛴다.
SELECT 'board_post_comments.author_user_id' AS ref, COUNT(*) AS cnt
  FROM board_post_comments
 WHERE author_user_id = (SELECT id FROM users WHERE email = 'ops@dev.local' LIMIT 1)
UNION ALL
SELECT 'board_post_reactions.user_id', COUNT(*)
  FROM board_post_reactions
 WHERE user_id = (SELECT id FROM users WHERE email = 'ops@dev.local' LIMIT 1)
UNION ALL
SELECT 'board_post_reports.reporter_user_id', COUNT(*)
  FROM board_post_reports
 WHERE reporter_user_id = (SELECT id FROM users WHERE email = 'ops@dev.local' LIMIT 1);

-- 1-7. 운영 로그. 지우지 않는다(보존). 건수와 최근 행만 확인한다.
--      operator_id = 'ops@dev.local' 이면 이 계정이 한 조치, target 이 이 계정이면 받은 조치.
SELECT COUNT(*) AS logs_by_ops
FROM admin_operation_logs
WHERE operator_id = 'ops@dev.local';

SELECT log_key, acted_at, operator_id, target_type, target_id, action_kind
FROM admin_operation_logs
WHERE operator_id = 'ops@dev.local'
   OR (target_type = 'user'
       AND target_id = (SELECT CAST(id AS CHAR) FROM users WHERE email = 'ops@dev.local' LIMIT 1))
ORDER BY acted_at DESC
LIMIT 30;

-- 1-8. (참고만) 운영 DB에 남은 다른 @dev.local 시드 계정. 이 SQL은 지우지 않는다.
--      rest-schema.sql 의 012 시드(room-owner1@dev.local 등)가 운영에 들어갔는지 확인용.
SELECT id, email, status, admin_level
FROM users
WHERE email LIKE '%@dev.local'
ORDER BY id;


-- =============================================================================
-- STEP 2 — 삭제 (STEP 1 결과를 확인한 뒤, 아래 블록 전체를 한 번에 실행)
--   user_profiles · user_roles 는 FK가 RESTRICT 라 먼저 지운다.
--   나머지 CASCADE / SET NULL 테이블은 users 삭제 때 MySQL이 처리한다.
--   모든 DELETE 에 같은 조건(이메일·보호 계정 제외·등급·정지·카드 없음)을 건다.
--   그래서 phpMyAdmin이 문장을 따로 실행해도, 조건이 안 맞으면 어느 문장도 지우지 않는다.
-- =============================================================================

START TRANSACTION;

SELECT id, email, status, admin_level
FROM users
WHERE email = 'ops@dev.local'
FOR UPDATE;

-- 2-1. 삭제 기록 1줄 (운영 로그 화면에서 보인다. 같은 log_key가 있으면 건너뜀)
--      action_kind 를 account_delete 로 쓰지 않는다. 쓰면 보고서(162)의 "관리자 삭제" 건수에 잡힌다.
INSERT IGNORE INTO admin_operation_logs
  (log_key, operator_id, target_type, target_id, action_kind, reason_category, detail_memo, reversible, user_notified)
SELECT
  'LOG-20261009-OPS-DEV-LOCAL',
  'jetty@naver.com',
  'user',
  CAST(u.id AS CHAR),
  'dev_account_purge',
  'member_ops',
  CONCAT('개발용 운영자 계정 삭제 (phpMyAdmin SQL · sql/ops/2026-10-09-delete-ops-dev-local.sql) · 삭제 전 이메일 ',
         u.email, ' · 등급 ', IFNULL(u.admin_level, '없음'), ' · 상태 ', u.status),
  0,
  0
FROM users u
WHERE u.email = 'ops@dev.local'
  AND u.email NOT IN ('jetty@naver.com', 'leejetty@gmail.com')
  AND (u.admin_level = 'sub_master' OR u.admin_level IS NULL)
  AND u.status = 'blocked'
  AND NOT EXISTS (SELECT 1 FROM students s WHERE s.guardian_user_id = u.id)
  AND NOT EXISTS (SELECT 1 FROM study_rooms sr WHERE sr.user_id = u.id)
  AND NOT EXISTS (SELECT 1 FROM tutors t WHERE t.user_id = u.id);

-- 2-2. 역할 행
DELETE r
FROM user_roles r
INNER JOIN users u ON u.id = r.user_id
WHERE u.email = 'ops@dev.local'
  AND u.email NOT IN ('jetty@naver.com', 'leejetty@gmail.com')
  AND (u.admin_level = 'sub_master' OR u.admin_level IS NULL)
  AND u.status = 'blocked'
  AND NOT EXISTS (SELECT 1 FROM students s WHERE s.guardian_user_id = u.id)
  AND NOT EXISTS (SELECT 1 FROM study_rooms sr WHERE sr.user_id = u.id)
  AND NOT EXISTS (SELECT 1 FROM tutors t WHERE t.user_id = u.id);

-- 2-3. 프로필 행 (가짜 전화 010-9999-0001 포함)
DELETE p
FROM user_profiles p
INNER JOIN users u ON u.id = p.user_id
WHERE u.email = 'ops@dev.local'
  AND u.email NOT IN ('jetty@naver.com', 'leejetty@gmail.com')
  AND (u.admin_level = 'sub_master' OR u.admin_level IS NULL)
  AND u.status = 'blocked'
  AND NOT EXISTS (SELECT 1 FROM students s WHERE s.guardian_user_id = u.id)
  AND NOT EXISTS (SELECT 1 FROM study_rooms sr WHERE sr.user_id = u.id)
  AND NOT EXISTS (SELECT 1 FROM tutors t WHERE t.user_id = u.id);

-- 2-4. 계정 행. CASCADE 테이블(auth_tokens, user_oauth_accounts, 찜·비교·최근 본 것,
--      쪽지, 이용권 등)은 여기서 같이 지워진다. support_tickets.user_id 는 NULL 이 된다.
--      MySQL은 DELETE 대상 테이블(users)을 같은 문장의 하위 쿼리에서 읽지 못하므로
--      카드 존재 확인은 users.id 를 바로 비교한다.
DELETE FROM users
WHERE email = 'ops@dev.local'
  AND email NOT IN ('jetty@naver.com', 'leejetty@gmail.com')
  AND (admin_level = 'sub_master' OR admin_level IS NULL)
  AND status = 'blocked'
  AND NOT EXISTS (SELECT 1 FROM students s WHERE s.guardian_user_id = users.id)
  AND NOT EXISTS (SELECT 1 FROM study_rooms sr WHERE sr.user_id = users.id)
  AND NOT EXISTS (SELECT 1 FROM tutors t WHERE t.user_id = users.id)
LIMIT 1;

-- 2-5. 결과 확인: 0 이어야 한다.
--      1 이면 조건(정지·등급·카드 없음)이 안 맞아 어느 문장도 지우지 않은 것이다. STEP 1 결과를 보고한다.
--      phpMyAdmin은 요청마다 연결을 새로 열기 때문에 COMMIT 을 같은 실행에 둔다.
--      중간 문장에서 오류가 나면 phpMyAdmin이 나머지(COMMIT 포함)를 멈추고,
--      연결이 끝나면서 커밋 안 된 변경은 되돌려진다. 확실히 하려면 ROLLBACK; 을 따로 실행한다.
SELECT COUNT(*) AS ops_rows_left FROM users WHERE email = 'ops@dev.local';

COMMIT;


-- =============================================================================
-- STEP 3 — 삭제 후 확인 (SELECT 만)
-- =============================================================================

-- 3-1. ops@dev.local 이 없어야 한다. 보호 계정 2개는 그대로 있어야 한다.
SELECT id, email, status, admin_level
FROM users
WHERE email IN ('ops@dev.local', 'jetty@naver.com', 'leejetty@gmail.com')
ORDER BY id;

-- 3-2. 이메일 기준으로 프로필·역할 고아 행이 없는지 (전화 010-9999-0001 프로필이 남았는지)
SELECT p.user_id, p.real_name, p.phone
FROM user_profiles p
LEFT JOIN users u ON u.id = p.user_id
WHERE u.id IS NULL OR p.phone = '010-9999-0001';

SELECT r.user_id, r.role_type, r.status
FROM user_roles r
LEFT JOIN users u ON u.id = r.user_id
WHERE u.id IS NULL;

-- 3-3. 운영 로그는 남아 있어야 한다 (STEP 1-7 의 logs_by_ops 와 같은 수 · 삭제 기록 1줄 추가)
SELECT COUNT(*) AS logs_by_ops
FROM admin_operation_logs
WHERE operator_id = 'ops@dev.local';

SELECT log_key, acted_at, operator_id, target_type, target_id, action_kind, detail_memo
FROM admin_operation_logs
WHERE log_key = 'LOG-20261009-OPS-DEV-LOCAL';

-- 3-4. 최고관리자(super_admin · active)가 1명 이상 남아 있어야 한다.
SELECT COUNT(*) AS active_super_admins
FROM users
WHERE admin_level = 'super_admin' AND status = 'active';
