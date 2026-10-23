DROP TABLE IF EXISTS right_rail_slot_definitions;
CREATE TABLE right_rail_slot_definitions (
  slot_key VARCHAR(80) NOT NULL PRIMARY KEY,
  source_board_keys_json LONGTEXT NULL,
  updated_at DATETIME NULL
);
INSERT INTO right_rail_slot_definitions VALUES ('search_right_rail', '["faq","concern-parent","safe-guide"]', NOW());
UPDATE right_rail_slot_definitions
SET source_board_keys_json = '["faq","concern-director","concern-tutor","concern-parent","safe-guide"]',
    updated_at = NOW()
WHERE slot_key = 'search_right_rail'
  AND REPLACE(REPLACE(REPLACE(REPLACE(CAST(source_board_keys_json AS CHAR), ' ', ''), CHAR(10), ''), CHAR(13), ''), CHAR(9), '') IN (
    '["faq","concern-parent","safe-guide"]',
    '["faq","concern-family","safe-guide"]'
  );
SELECT 'case1_compact_longtext' AS label, ROW_COUNT() AS affected;

DROP TABLE IF EXISTS right_rail_slot_definitions;
CREATE TABLE right_rail_slot_definitions (
  slot_key VARCHAR(80) NOT NULL PRIMARY KEY,
  source_board_keys_json JSON NULL,
  updated_at DATETIME NULL
);
INSERT INTO right_rail_slot_definitions VALUES ('search_right_rail', CAST('["faq","concern-parent","safe-guide"]' AS JSON), NOW());
SELECT 'stored_json' AS label, CAST(source_board_keys_json AS CHAR) AS stored_value;
UPDATE right_rail_slot_definitions
SET source_board_keys_json = '["faq","concern-director","concern-tutor","concern-parent","safe-guide"]',
    updated_at = NOW()
WHERE slot_key = 'search_right_rail'
  AND REPLACE(REPLACE(REPLACE(REPLACE(CAST(source_board_keys_json AS CHAR), ' ', ''), CHAR(10), ''), CHAR(13), ''), CHAR(9), '') IN (
    '["faq","concern-parent","safe-guide"]',
    '["faq","concern-family","safe-guide"]'
  );
SELECT 'case2_json_old' AS label, ROW_COUNT() AS affected;

UPDATE right_rail_slot_definitions
SET source_board_keys_json = CAST('["faq","concern-director","concern-parent","safe-guide"]' AS JSON),
    updated_at = NOW()
WHERE slot_key = 'search_right_rail';
UPDATE right_rail_slot_definitions
SET source_board_keys_json = '["faq","concern-director","concern-tutor","concern-parent","safe-guide"]',
    updated_at = NOW()
WHERE slot_key = 'search_right_rail'
  AND REPLACE(REPLACE(REPLACE(REPLACE(CAST(source_board_keys_json AS CHAR), ' ', ''), CHAR(10), ''), CHAR(13), ''), CHAR(9), '') IN (
    '["faq","concern-parent","safe-guide"]',
    '["faq","concern-family","safe-guide"]'
  );
SELECT 'case3_operator' AS label, ROW_COUNT() AS affected, CAST(source_board_keys_json AS CHAR) AS kept_value FROM right_rail_slot_definitions;

UPDATE right_rail_slot_definitions
SET source_board_keys_json = CAST('["faq","concern-director","concern-tutor","concern-parent","safe-guide"]' AS JSON),
    updated_at = NOW()
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
