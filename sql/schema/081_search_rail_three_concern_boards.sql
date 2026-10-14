-- 찾기 레일 고민방 3칸(공부방·과외쌤·학생/학부모). 화면이 역할별로 거른다: 학생 1칸, 비회원 3칸 제목만.
-- 종현 2026-10-15 t1610·t1611·t1625(DB·서버·화면 일치).
-- 옛 기본값(학생/학부모 방만, 또는 family 별칭)일 때만 바꾼다. 공백·줄바꿈만 다른 값도 같은 값으로 본다.
-- 운영자가 바꾼 다른 값은 건드리지 않는다. 다시 돌려도 바뀌는 행 0(새 값은 조건에 안 걸림).
-- MySQL 8(JSON 열)·MariaDB(JSON = LONGTEXT) 둘 다 되는 문자열 비교만 쓴다.
UPDATE right_rail_slot_definitions
SET source_board_keys_json = '["faq","concern-director","concern-tutor","concern-parent","safe-guide"]',
    updated_at = NOW()
WHERE slot_key = 'search_right_rail'
  AND REPLACE(REPLACE(REPLACE(REPLACE(CAST(source_board_keys_json AS CHAR), ' ', ''), CHAR(10), ''), CHAR(13), ''), CHAR(9), '') IN (
    '["faq","concern-parent","safe-guide"]',
    '["faq","concern-family","safe-guide"]'
  );
