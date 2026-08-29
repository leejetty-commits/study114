-- ACL seed rollback 예시 (운영에 직접 실행하지 말 것)
-- 적용 전 ContentAclSeedGuard plan 의 rollback_sql 을 행별로 확인한 뒤 사용한다.
-- 이 파일은 템플릿이며 운영자 임의 설정을 복원하지 못한다. dry-run diff 의 before 값이 정본이다.

-- submission 채널 역할 (공부방 포함 옛값으로 되돌리는 예)
-- UPDATE board_channel_definitions
--    SET allowed_roles_json = '["study_room","tutor","admin"]', updated_at = NOW()
--  WHERE board_key = 'submission';

-- 홈 레일 guest_filter 옛 별칭
-- UPDATE right_rail_slot_definitions
--    SET guest_filter = 'summary_only', updated_at = NOW()
--  WHERE slot_key = 'home_right_rail';

-- 검색 레일
-- UPDATE right_rail_slot_definitions
--    SET guest_filter = 'summary_only', updated_at = NOW()
--  WHERE slot_key = 'search_right_rail';

-- 상세 레일에 submission 을 다시 넣는 것은 정책 후퇴이므로 기본 권장하지 않음.
-- UPDATE right_rail_slot_definitions
--    SET source_board_keys_json = '["safe-guide","notice","submission"]', updated_at = NOW()
--  WHERE slot_key = 'detail_right_rail';
