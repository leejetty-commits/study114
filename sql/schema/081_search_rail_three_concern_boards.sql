-- 찾기 레일 고민방 3칸. 공부방·과외쌤은 홈과 같이 세 방, 학생은 화면에서 학생/학부모 방만.
-- 종현 2026-10-15. 기존 값(학생/학부모 방만, 또는 family 별칭)일 때만 바꾼다.
UPDATE right_rail_slot_definitions
SET source_board_keys_json = '["faq","concern-director","concern-tutor","concern-parent","safe-guide"]',
    updated_at = NOW()
WHERE slot_key = 'search_right_rail'
  AND source_board_keys_json IN (
    '["faq","concern-parent","safe-guide"]',
    '["faq", "concern-parent", "safe-guide"]',
    '["faq","concern-family","safe-guide"]',
    '["faq", "concern-family", "safe-guide"]'
  );
