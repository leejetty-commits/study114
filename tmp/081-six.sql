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
SELECT 'case1_compact_longtext' AS label, ROW_COUNT() AS affected, CAST(source_board_keys_json AS CHAR) AS val FROM right_rail_slot_definitions;

DROP TABLE right_rail_slot_definitions;
CREATE TABLE right_rail_slot_definitions (
  slot_key VARCHAR(80) NOT NULL PRIMARY KEY,
  source_board_keys_json JSON NULL,
  updated_at DATETIME NULL
);
INSERT INTO right_rail_slot_definitions VALUES ('search_right_rail', CAST('["faq","concern-parent","safe-guide"]' AS JSON), NOW());
SELECT 'case2_stored_before' AS label, CAST(source_board_keys_json AS CHAR) AS val FROM right_rail_slot_definitions;
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
SELECT 'case2_json_spaced' AS label, ROW_COUNT() AS affected, CAST(source_board_keys_json AS CHAR) AS val FROM right_rail_slot_definitions;

UPDATE right_rail_slot_definitions
SET source_board_keys_json = CAST('["faq","library-template","safe-guide"]' AS JSON)
WHERE slot_key = 'search_right_rail';
SELECT 'case3_stored_before' AS label, CAST(source_board_keys_json AS CHAR) AS val FROM right_rail_slot_definitions;
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
SELECT 'case3_libold' AS label, ROW_COUNT() AS affected, CAST(source_board_keys_json AS CHAR) AS val FROM right_rail_slot_definitions;

UPDATE right_rail_slot_definitions
SET source_board_keys_json = CAST('["faq","concern-director","concern-tutor","concern-parent","safe-guide"]' AS JSON)
WHERE slot_key = 'search_right_rail';
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
SELECT 'case4_five' AS label, ROW_COUNT() AS affected, CAST(source_board_keys_json AS CHAR) AS val FROM right_rail_slot_definitions;

UPDATE right_rail_slot_definitions
SET source_board_keys_json = CAST('["faq","concern-director","concern-tutor","concern-parent","library-template","safe-guide"]' AS JSON)
WHERE slot_key = 'search_right_rail';
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
SELECT 'case5_six' AS label, ROW_COUNT() AS affected, CAST(source_board_keys_json AS CHAR) AS val FROM right_rail_slot_definitions;

UPDATE right_rail_slot_definitions
SET source_board_keys_json = CAST('["faq","concern-director","concern-parent","safe-guide"]' AS JSON)
WHERE slot_key = 'search_right_rail';
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
SELECT 'case6_operator' AS label, ROW_COUNT() AS affected, CAST(source_board_keys_json AS CHAR) AS val FROM right_rail_slot_definitions;

UPDATE right_rail_slot_definitions
SET source_board_keys_json = CAST('["faq","concern-director","concern-tutor","concern-parent","library-template","safe-guide"]' AS JSON)
WHERE slot_key = 'search_right_rail';
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
SELECT 'case7_second' AS label, ROW_COUNT() AS affected, CAST(source_board_keys_json AS CHAR) AS val FROM right_rail_slot_definitions;
SELECT VERSION() AS db_version;
