DROP DATABASE IF EXISTS s081check;
CREATE DATABASE s081check CHARACTER SET utf8mb4;
USE s081check;

CREATE TABLE right_rail_slot_definitions (
  slot_key VARCHAR(80) NOT NULL PRIMARY KEY,
  source_board_keys_json LONGTEXT NULL,
  updated_at DATETIME NULL
);
INSERT INTO right_rail_slot_definitions VALUES ('search_right_rail', '["faq","concern-parent","safe-guide"]', NOW());
UPDATE right_rail_slot_definitions
SET source_board_keys_json = '["faq","concern-director","concern-tutor","concern-parent","library-template","safe-guide"]',
    updated_at = NOW()
WHERE slot_key = 'search_right_rail'
  AND REPLACE(REPLACE(REPLACE(REPLACE(CAST(source_board_keys_json AS CHAR), ' ', ''), CHAR(10), ''), CHAR(13), ''), CHAR(9), '') IN (
    '["faq","concern-parent","safe-guide"]',
    '["faq","concern-family","safe-guide"]',
    '["faq","library-template","safe-guide"]',
    '["faq","concern-director","concern-tutor","concern-parent","safe-guide"]'
  );
SELECT 'case1_compact' AS label, ROW_COUNT() AS affected;

INSERT INTO right_rail_slot_definitions VALUES ('search_right_rail', '["faq", "concern-parent", "safe-guide"]', NOW())
ON DUPLICATE KEY UPDATE source_board_keys_json = VALUES(source_board_keys_json);
UPDATE right_rail_slot_definitions
SET source_board_keys_json = '["faq","concern-director","concern-tutor","concern-parent","library-template","safe-guide"]',
    updated_at = NOW()
WHERE slot_key = 'search_right_rail'
  AND REPLACE(REPLACE(REPLACE(REPLACE(CAST(source_board_keys_json AS CHAR), ' ', ''), CHAR(10), ''), CHAR(13), ''), CHAR(9), '') IN (
    '["faq","concern-parent","safe-guide"]',
    '["faq","concern-family","safe-guide"]',
    '["faq","library-template","safe-guide"]',
    '["faq","concern-director","concern-tutor","concern-parent","safe-guide"]'
  );
SELECT 'case2_spaced' AS label, ROW_COUNT() AS affected;

UPDATE right_rail_slot_definitions SET source_board_keys_json = '["faq", "library-template", "safe-guide"]' WHERE slot_key = 'search_right_rail';
UPDATE right_rail_slot_definitions
SET source_board_keys_json = '["faq","concern-director","concern-tutor","concern-parent","library-template","safe-guide"]',
    updated_at = NOW()
WHERE slot_key = 'search_right_rail'
  AND REPLACE(REPLACE(REPLACE(REPLACE(CAST(source_board_keys_json AS CHAR), ' ', ''), CHAR(10), ''), CHAR(13), ''), CHAR(9), '') IN (
    '["faq","concern-parent","safe-guide"]',
    '["faq","concern-family","safe-guide"]',
    '["faq","library-template","safe-guide"]',
    '["faq","concern-director","concern-tutor","concern-parent","safe-guide"]'
  );
SELECT 'case3_libold' AS label, ROW_COUNT() AS affected;

UPDATE right_rail_slot_definitions SET source_board_keys_json = '["faq","concern-director","concern-tutor","concern-parent","safe-guide"]' WHERE slot_key = 'search_right_rail';
UPDATE right_rail_slot_definitions
SET source_board_keys_json = '["faq","concern-director","concern-tutor","concern-parent","library-template","safe-guide"]',
    updated_at = NOW()
WHERE slot_key = 'search_right_rail'
  AND REPLACE(REPLACE(REPLACE(REPLACE(CAST(source_board_keys_json AS CHAR), ' ', ''), CHAR(10), ''), CHAR(13), ''), CHAR(9), '') IN (
    '["faq","concern-parent","safe-guide"]',
    '["faq","concern-family","safe-guide"]',
    '["faq","library-template","safe-guide"]',
    '["faq","concern-director","concern-tutor","concern-parent","safe-guide"]'
  );
SELECT 'case4_five' AS label, ROW_COUNT() AS affected;

UPDATE right_rail_slot_definitions SET source_board_keys_json = '["faq","concern-director","concern-tutor","concern-parent","library-template","safe-guide"]' WHERE slot_key = 'search_right_rail';
UPDATE right_rail_slot_definitions
SET source_board_keys_json = '["faq","concern-director","concern-tutor","concern-parent","library-template","safe-guide"]',
    updated_at = NOW()
WHERE slot_key = 'search_right_rail'
  AND REPLACE(REPLACE(REPLACE(REPLACE(CAST(source_board_keys_json AS CHAR), ' ', ''), CHAR(10), ''), CHAR(13), ''), CHAR(9), '') IN (
    '["faq","concern-parent","safe-guide"]',
    '["faq","concern-family","safe-guide"]',
    '["faq","library-template","safe-guide"]',
    '["faq","concern-director","concern-tutor","concern-parent","safe-guide"]'
  );
SELECT 'case5_six' AS label, ROW_COUNT() AS affected, source_board_keys_json AS val FROM right_rail_slot_definitions;

UPDATE right_rail_slot_definitions SET source_board_keys_json = '["faq","concern-director","concern-parent","safe-guide"]' WHERE slot_key = 'search_right_rail';
UPDATE right_rail_slot_definitions
SET source_board_keys_json = '["faq","concern-director","concern-tutor","concern-parent","library-template","safe-guide"]',
    updated_at = NOW()
WHERE slot_key = 'search_right_rail'
  AND REPLACE(REPLACE(REPLACE(REPLACE(CAST(source_board_keys_json AS CHAR), ' ', ''), CHAR(10), ''), CHAR(13), ''), CHAR(9), '') IN (
    '["faq","concern-parent","safe-guide"]',
    '["faq","concern-family","safe-guide"]',
    '["faq","library-template","safe-guide"]',
    '["faq","concern-director","concern-tutor","concern-parent","safe-guide"]'
  );
SELECT 'case6_operator' AS label, ROW_COUNT() AS affected, source_board_keys_json AS val FROM right_rail_slot_definitions;

UPDATE right_rail_slot_definitions SET source_board_keys_json = '["faq","concern-director","concern-tutor","concern-parent","library-template","safe-guide"]' WHERE slot_key = 'search_right_rail';
UPDATE right_rail_slot_definitions
SET source_board_keys_json = '["faq","concern-director","concern-tutor","concern-parent","library-template","safe-guide"]',
    updated_at = NOW()
WHERE slot_key = 'search_right_rail'
  AND REPLACE(REPLACE(REPLACE(REPLACE(CAST(source_board_keys_json AS CHAR), ' ', ''), CHAR(10), ''), CHAR(13), ''), CHAR(9), '') IN (
    '["faq","concern-parent","safe-guide"]',
    '["faq","concern-family","safe-guide"]',
    '["faq","library-template","safe-guide"]',
    '["faq","concern-director","concern-tutor","concern-parent","safe-guide"]'
  );
SELECT 'case7_second' AS label, ROW_COUNT() AS affected;
SELECT VERSION() AS db_version;
