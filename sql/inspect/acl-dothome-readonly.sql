-- 닷홈 ACL 현재값 읽기 전용 점검 (phpMyAdmin 에 그대로 붙여넣기)
-- SELECT 만 있다. UPDATE·INSERT·DELETE 없음. 실행해도 운영 데이터가 바뀌지 않는다.
-- 목적: main 병합 전에 acl_seed_plan 이 건드릴 행의 before 값을 확인·보관한다.
--
-- Q7 까지 모두 실행한 뒤 결과를 통째로 저장해 두면 그것이 DB rollback 의 정본이다.

-- Q1. concern-family / concern-parent 동시 존재 여부
--     두 행이 모두 나오면 충돌이다. seed 를 적용하지 말고 먼저 정본 행을 정해야 한다.
SELECT board_key, menu_label, visibility, allowed_roles_json, updated_at
  FROM board_channel_definitions
 WHERE board_key IN ('concern-family', 'concern-parent');

-- Q2. 채널별 게시글 수 — 충돌 시 어느 쪽이 정본인지 판단 근거
SELECT board_key, COUNT(*) AS posts
  FROM board_posts
 WHERE board_key IN ('concern-family', 'concern-parent', 'concern-director', 'concern-tutor', 'concern-solved')
 GROUP BY board_key;

-- Q3. seed 대상 채널 (submission) 의 현재 allowed_roles_json
--     기대 목표값: ["tutor","admin"]
--     seed 가 덮어쓸 수 있는 값(replaceable): ["tutor","admin"] · ["study_room","tutor","admin"]
--       · ["tutor","study_room","admin"] · ["study_room","tutor"] · ["tutor","study_room"]
--     위 목록에 없는 값이면 운영자 임의 설정이므로 abort_unexpected 대상이다.
SELECT board_key, menu_label, visibility, allowed_roles_json, updated_at
  FROM board_channel_definitions
 WHERE board_key = 'submission';

-- Q4. seed 대상 레일 3개의 현재값 (sourceBoardKeys · guestFilter 포함)
--     home_right_rail   목표: source ["notice","concern-director","concern-tutor","concern-parent"] / guest_filter intro_only
--     search_right_rail 목표: source ["faq","concern-parent","safe-guide"]                          / guest_filter intro_only
--     detail_right_rail 목표: source ["safe-guide","notice"]                                        / guest_filter allow
SELECT slot_key, source_board_keys_json, guest_filter, visibility_rule, role_target, mobile_behavior, updated_at
  FROM right_rail_slot_definitions
 WHERE slot_key IN ('home_right_rail', 'search_right_rail', 'detail_right_rail');

-- Q5. concern-family 를 아직 참조하는 레일이 있는지 (seed 대상 3개 밖도 포함)
SELECT slot_key, source_board_keys_json
  FROM right_rail_slot_definitions
 WHERE source_board_keys_json LIKE '%concern-family%';

-- Q6. 전체 채널·레일 목록 — 예상 밖 운영자 설정 탐지용
SELECT board_key, menu_label, visibility, allowed_roles_json, updated_at
  FROM board_channel_definitions
 ORDER BY board_key;

SELECT slot_key, source_board_keys_json, guest_filter, visibility_rule, role_target, mobile_behavior, updated_at
  FROM right_rail_slot_definitions
 ORDER BY slot_key;

-- Q7. author_user_id 컬럼 존재 여부와 소유자 미상 글 수
--     컬럼이 없으면 이번 배포의 소유권 fail-closed 가 모든 일반 사용자 수정·삭제를 막는다. 배포 전 반드시 확인.
SELECT COUNT(*) AS has_author_user_id_column
  FROM information_schema.columns
 WHERE table_schema = DATABASE()
   AND table_name = 'board_posts'
   AND column_name = 'author_user_id';

SELECT board_key,
       COUNT(*) AS total,
       SUM(CASE WHEN author_user_id IS NULL OR author_user_id = 0 THEN 1 ELSE 0 END) AS owner_unknown
  FROM board_posts
 GROUP BY board_key
 ORDER BY board_key;
