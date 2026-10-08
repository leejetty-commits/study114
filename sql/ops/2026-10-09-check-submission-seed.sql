-- =============================================================================
-- 2026-10-09 — 운영 DB에 제출자료 견본 글(sub-seed-*)이 있는지 확인 · 있으면 지우는 초안
-- 작업 기록: docs/worklog/2026/10/2026-10-09-remove-dev-operator.md
--
-- 배경
--   sql/schema/021_board_engine.sql (rest-schema.sql 에도 복사됨)이 board_posts 에
--   제출자료(board_key = 'submission') 견본 글 3개를 넣는다. 실제 회원이 쓴 글이 아니다.
--     sub-seed-1       과외   published  「학력 증명서 사본」
--     sub-seed-2       과외   submitted  「경력 확인 서류」
--     sub-seed-room-1  공부방 published  「시설 안전 점검 체크리스트」
--   견본 3개는 author_user_id 가 비어 있다(021 INSERT 가 작성자를 넣지 않음).
--   운영 DB에 들어갔는지는 아직 모른다. STEP 1 로 먼저 확인한다.
--
-- e2e 와의 관계 (로컬 전용)
--   e2e/a28-07-exposure-patch.spec.js 와 e2e/helpers/admin-api.js (restoreExposureDefaults)가
--   sub-seed-1 행을 쓴다. 둘 다 로컬 Docker(study114_dev) 전용이다. 운영 DB 에서 지워도
--   e2e 에는 영향이 없다. 로컬 Docker 시드(021)는 그대로 둔다.
--
-- 실행 방법 (MySQL 8.0 · phpMyAdmin)
--   * GitHub Actions는 이 SQL을 실행하지 않는다. 사람이 phpMyAdmin에서 직접 실행한다.
--   * phpMyAdmin 왼쪽에서 운영 DB를 먼저 선택한다. (USE 문 없음)
--   * STEP 1 만 실행하고 결과를 보고한다. STEP 2 는 사용자 승인 뒤에만 주석을 풀어 실행한다.
--
-- 안전장치 (STEP 2)
--   * 대상은 board_key = 'submission' 이고 post_key 가 위 3개이며 author_user_id 가 비어 있는 행뿐이다.
--   * 운영 로그(admin_operation_logs)는 지우지 않는다(보존).
-- =============================================================================


-- =============================================================================
-- STEP 1 — 확인 (SELECT 만. 아무것도 바꾸지 않는다)
-- =============================================================================

-- 1-1. 견본 글이 있는지 (이 한 줄이 핵심. 0줄이면 STEP 2 는 필요 없다)
SELECT id, board_key, post_key, author_user_id, author_role, status, title, created_at FROM board_posts WHERE board_key = 'submission' AND post_key IN ('sub-seed-1', 'sub-seed-2', 'sub-seed-room-1');

-- 1-2. board_posts 를 가리키는 외래키. 저장소 스키마 기준으로는 0줄이다.
--      줄이 나오면 STEP 2 를 실행하지 말고 보고한다.
SELECT kcu.TABLE_NAME, kcu.COLUMN_NAME, kcu.CONSTRAINT_NAME, rc.DELETE_RULE
FROM information_schema.KEY_COLUMN_USAGE kcu
INNER JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
  ON rc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
 AND rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
 AND rc.TABLE_NAME = kcu.TABLE_NAME
WHERE kcu.TABLE_SCHEMA = DATABASE()
  AND kcu.REFERENCED_TABLE_SCHEMA = DATABASE()
  AND kcu.REFERENCED_TABLE_NAME = 'board_posts';

-- 1-3. 첨부 (025 board_post_attachments · FK 없이 board_key + post_key 로 묶인다).
--      줄이 나오면 storage_path 의 서버 파일도 따로 지워야 하므로 경로를 보고한다.
SELECT id, board_key, post_key, attachment_key, original_name, storage_path, size_bytes
FROM board_post_attachments
WHERE board_key = 'submission'
  AND post_key IN ('sub-seed-1', 'sub-seed-2', 'sub-seed-room-1');

-- 1-4. 댓글·반응·신고 (075 · FK 없이 post_id 로 묶인다). 075 미적용 DB면 "테이블 없음" 오류 → 건너뛴다.
SELECT 'board_post_comments' AS tbl, COUNT(*) AS cnt
  FROM board_post_comments
 WHERE post_id IN (SELECT id FROM board_posts WHERE board_key = 'submission' AND post_key IN ('sub-seed-1', 'sub-seed-2', 'sub-seed-room-1'))
UNION ALL
SELECT 'board_post_reactions', COUNT(*)
  FROM board_post_reactions
 WHERE post_id IN (SELECT id FROM board_posts WHERE board_key = 'submission' AND post_key IN ('sub-seed-1', 'sub-seed-2', 'sub-seed-room-1'))
UNION ALL
SELECT 'board_post_reports', COUNT(*)
  FROM board_post_reports
 WHERE post_id IN (SELECT id FROM board_posts WHERE board_key = 'submission' AND post_key IN ('sub-seed-1', 'sub-seed-2', 'sub-seed-room-1'));

-- 1-5. 운영 로그 (지우지 않는다. 운영자가 이 글에 조치한 기록이 있는지만 본다)
--      노출 보정 로그는 target_type = 'board_post', target_id = 'submission:<post_key>' 로 남는다.
SELECT log_key, acted_at, operator_id, target_type, target_id, action_kind
FROM admin_operation_logs
WHERE target_id IN ('submission:sub-seed-1', 'submission:sub-seed-2', 'submission:sub-seed-room-1',
                    'sub-seed-1', 'sub-seed-2', 'sub-seed-room-1')
ORDER BY acted_at DESC
LIMIT 30;


-- =============================================================================
-- STEP 2 — 삭제 초안 (기본 주석 처리. 사용자 승인 뒤에만 주석을 풀어 실행)
--   조건: 1-1 에 견본 행이 있고, 1-2 가 0줄이고, 1-3 첨부가 있으면 서버 파일 처리 계획이 선 뒤.
-- ※ 주석을 푼 뒤 START TRANSACTION 부터 COMMIT 까지 모든 문장을 phpMyAdmin SQL 탭에
--   함께 붙여넣고 실행을 한 번만 누르세요. (나눠 실행하면 연결이 바뀌어 트랜잭션이 이어지지 않는다.)
--   모든 문장에 같은 조건(board_key·post_key 3개·author_user_id 비어 있음)을 건다.
-- =============================================================================

-- START TRANSACTION;
--
-- -- 2-1. 첨부 행 (서버 파일은 이 SQL 이 지우지 않는다)
-- DELETE a
-- FROM board_post_attachments a
-- INNER JOIN board_posts p ON p.board_key = a.board_key AND p.post_key = a.post_key
-- WHERE p.board_key = 'submission'
--   AND p.post_key IN ('sub-seed-1', 'sub-seed-2', 'sub-seed-room-1')
--   AND p.author_user_id IS NULL;
--
-- -- 2-2. 댓글·반응·신고 (075 미적용 DB면 이 세 문장을 빼고 실행)
-- DELETE c FROM board_post_comments c
-- INNER JOIN board_posts p ON p.id = c.post_id
-- WHERE p.board_key = 'submission' AND p.post_key IN ('sub-seed-1', 'sub-seed-2', 'sub-seed-room-1') AND p.author_user_id IS NULL;
-- DELETE r FROM board_post_reactions r
-- INNER JOIN board_posts p ON p.id = r.post_id
-- WHERE p.board_key = 'submission' AND p.post_key IN ('sub-seed-1', 'sub-seed-2', 'sub-seed-room-1') AND p.author_user_id IS NULL;
-- DELETE rp FROM board_post_reports rp
-- INNER JOIN board_posts p ON p.id = rp.post_id
-- WHERE p.board_key = 'submission' AND p.post_key IN ('sub-seed-1', 'sub-seed-2', 'sub-seed-room-1') AND p.author_user_id IS NULL;
--
-- -- 2-3. 견본 글
-- DELETE FROM board_posts
-- WHERE board_key = 'submission'
--   AND post_key IN ('sub-seed-1', 'sub-seed-2', 'sub-seed-room-1')
--   AND author_user_id IS NULL
-- LIMIT 3;
--
-- -- 2-4. 결과 확인: 0 이어야 한다.
-- SELECT COUNT(*) AS seed_rows_left
-- FROM board_posts
-- WHERE board_key = 'submission'
--   AND post_key IN ('sub-seed-1', 'sub-seed-2', 'sub-seed-room-1');
--
-- COMMIT;


-- =============================================================================
-- STEP 3 — 삭제 후 확인 (STEP 2 를 실행했을 때만)
-- =============================================================================
-- STEP 1 의 1-1 · 1-3 을 다시 실행해 0줄인지 본다. 1-5 운영 로그 건수는 그대로여야 한다.
