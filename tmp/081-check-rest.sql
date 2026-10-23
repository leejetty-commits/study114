UPDATE right_rail_slot_definitions
SET source_board_keys_json = '["faq","concern-director","concern-tutor","concern-parent","safe-guide"]',
    updated_at = NOW()
WHERE slot_key = 'search_right_rail'
  AND REPLACE(REPLACE(REPLACE(REPLACE(CAST(source_board_keys_json AS CHAR), ' ', ''), CHAR(10), ''), CHAR(13), ''), CHAR(9), '') IN (
    '["faq","concern-parent","safe-guide"]',
    '["faq","concern-family","safe-guide"]'
  );
SELECT 'case2_json_spaced' AS label, ROW_COUNT() AS affected;

UPDATE right_rail_slot_definitions
SET source_board_keys_json = CAST('["faq","concern-director","concern-parent","safe-guide"]' AS JSON)
WHERE slot_key = 'search_right_rail';
UPDATE right_rail_slot_definitions
SET source_board_keys_json = '["faq","concern-director","concern-tutor","concern-parent","safe-guide"]',
    updated_at = NOW()
WHERE slot_key = 'search_right_rail'
  AND REPLACE(REPLACE(REPLACE(REPLACE(CAST(source_board_keys_json AS CHAR), ' ', ''), CHAR(10), ''), CHAR(13), ''), CHAR(9), '') IN (
    '["faq","concern-parent","safe-guide"]',
    '["faq","concern-family","safe-guide"]'
  );
SELECT 'case3_operator' AS label, ROW_COUNT() AS affected;

UPDATE right_rail_slot_definitions
SET source_board_keys_json = CAST('["faq","concern-director","concern-tutor","concern-parent","safe-guide"]' AS JSON)
WHERE slot_key = 'search_right_rail';
UPDATE right_rail_slot_definitions
SET source_board_keys_json = '["faq","concern-director","concern-tutor","concern-parent","safe-guide"]',
    updated_at = NOW()
WHERE slot_key = 'search_right_rail'
  AND REPLACE(REPLACE(REPLACE(REPLACE(CAST(source_board_keys_json AS CHAR), ' ', ''), CHAR(10), ''), CHAR(13), ''), CHAR(9), '') IN (
    '["faq","concern-parent","safe-guide"]',
    '["faq","concern-family","safe-guide"]'
  );
SELECT 'case4_second' AS label, ROW_COUNT() AS affected;
SELECT VERSION() AS db_version;
