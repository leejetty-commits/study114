-- ① 적용 전 확인 (phpMyAdmin SQL 탭)
SELECT VERSION() AS db_version;
SELECT DATA_TYPE, COLUMN_TYPE FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'right_rail_slot_definitions' AND COLUMN_NAME = 'source_board_keys_json';
SELECT slot_key, source_board_keys_json,
       REPLACE(REPLACE(REPLACE(REPLACE(CAST(source_board_keys_json AS CHAR), ' ', ''), CHAR(10), ''), CHAR(13), ''), CHAR(9), '') AS normalized,
       updated_at
  FROM right_rail_slot_definitions WHERE slot_key = 'search_right_rail';
-- 기대: 1행. normalized 가 '["faq","concern-parent","safe-guide"]' 또는 '["faq","concern-family","safe-guide"]' 이면 081이 바꾼다.
--       다른 값이면 운영자가 바꾼 값 → 081은 0행(그대로). 이 경우 종현이 그대로 둘지 정한다.

-- ② 081 실행 → 「1행 영향」(옛 값일 때) 또는 「0행」(이미 새 값/운영자 값)

-- ③ 적용 후 확인
SELECT slot_key, source_board_keys_json, updated_at FROM right_rail_slot_definitions WHERE slot_key = 'search_right_rail';
-- 기대: source_board_keys_json 이 ["faq","concern-director","concern-tutor","concern-parent","safe-guide"] (MySQL 은 쉼표 뒤 공백을 붙여 보여 줄 수 있음)
