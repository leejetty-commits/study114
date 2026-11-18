-- =============================================================================
-- 12c 「시 단위」 동 행 — 수정 SQL (종현이 dothome phpMyAdmin에서 실행)
-- 12c-region-sidanwi-check.sql 결과를 본 뒤에만 실행한다. 이 파일을 먼저 실행하지 않는다.
-- A 또는 B 중 하나만 실행한다. 둘 다 실행하지 않는다.
--   A: 확인 SQL (3)의 건수가 모두 0일 때. 두 행만 지운다.
--   B: (3)에 0이 아닌 칸이 있을 때. 참조를 공식 시·도 행으로 옮긴 뒤 지운다.
--      옮길 곳: 같은 시·도의 073 공식 행(unit_level='sido', official_code=시도코드 10자리).
--      예: 경기도 4100000000, 강원특별자치도 5100000000.
--      이유: 이 두 행은 예전 「시·도 대표」 자리표시였고, 시·군·구가 아니다.
--      확인 SQL (5)가 각 시·도 1행이어야 한다. (6)이 비어 있지 않으면 B를 실행하지 말고 알려 주세요.
-- 각 부분은 START TRANSACTION 으로 시작한다. 마지막 확인 SELECT를 보고
--   맞으면 COMMIT;  아니면 ROLLBACK;  을 직접 실행한다. 자동으로 확정하지 않는다.
-- 이메일·전화번호·이름은 나오지 않는다.
-- 중요: 이 파일 전체를 한 번에 실행하지 마세요. A 블록 또는 B 블록만 복사해 실행합니다.
--       전체를 실행하면 B의 START TRANSACTION 이 A를 확정해 버립니다.
-- =============================================================================

-- =============================================================================
-- A. 참조 0건일 때만. (3)의 건수가 모두 0인지 다시 확인한 뒤에 이 블록만 실행.
-- =============================================================================

START TRANSACTION;

SELECT 'A-사전-대상' AS 단계, r.*
FROM regions r
WHERE r.id IN (
  SELECT id FROM (
    SELECT id FROM regions WHERE sigungu_name = '시 단위' AND unit_level = 'dong'
  ) AS ident
)
ORDER BY r.sido_name;

-- 아래 지움은 참조가 남아 있으면 한 줄도 지우지 않는다.
-- 087 희망지역 칸이 있으면 그 칸도 검사한다. 칸이 없으면 그 검사만 빼서 실행한다.
SET @extra := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students'
    AND COLUMN_NAME IN ('preferred_studyroom_region_extra_id', 'preferred_tutor_region_extra_id')
);
SET @extra_clause := IF(@extra = 2,
  ' AND NOT EXISTS (SELECT 1 FROM students x WHERE x.preferred_studyroom_region_extra_id = r.id)
    AND NOT EXISTS (SELECT 1 FROM students x WHERE x.preferred_tutor_region_extra_id = r.id)',
  '');
SET @s := CONCAT(
  'DELETE r FROM regions r
    WHERE r.id IN (SELECT id FROM (SELECT id FROM regions WHERE sigungu_name = ''시 단위'' AND unit_level = ''dong'') AS ident)
      AND NOT EXISTS (SELECT 1 FROM study_room_regions x WHERE x.region_id = r.id)
      AND NOT EXISTS (SELECT 1 FROM tutor_regions x WHERE x.region_id = r.id)
      AND NOT EXISTS (SELECT 1 FROM students x WHERE x.preferred_studyroom_region_id = r.id)
      AND NOT EXISTS (SELECT 1 FROM students x WHERE x.preferred_tutor_region_id = r.id)
      AND NOT EXISTS (SELECT 1 FROM user_profiles x WHERE x.default_region_id = r.id)
      AND NOT EXISTS (SELECT 1 FROM study_rooms x WHERE x.region_id = r.id)
      AND NOT EXISTS (SELECT 1 FROM complexes x WHERE x.region_id = r.id)
      AND NOT EXISTS (SELECT 1 FROM study_room_exposure_assignments x WHERE x.region_id = r.id)
      AND NOT EXISTS (SELECT 1 FROM study_room_exposure_waitlists x WHERE x.region_id = r.id)
      AND NOT EXISTS (SELECT 1 FROM provider_position_subscriptions x WHERE x.region_id = r.id)
      AND NOT EXISTS (SELECT 1 FROM provider_position_subscriptions x WHERE x.city_id = r.id)',
  @extra_clause
);
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SELECT 'A-확인-남은행' AS 단계, COUNT(*) AS 남은수
FROM regions
WHERE sigungu_name = '시 단위' AND unit_level = 'dong';
-- 기대: 남은수 0. 맞으면 COMMIT;  아니면 ROLLBACK;
-- COMMIT;
-- ROLLBACK;


-- =============================================================================
-- B. 참조가 있을 때만. A를 실행한 세션에서는 실행하지 않는다.
--    확인 SQL (5)가 2행, (6)이 비어 있는지 본 뒤에 이 블록만 실행.
-- =============================================================================

START TRANSACTION;

SELECT 'B-사전-대상' AS 단계, r.*
FROM regions r
WHERE r.id IN (
  SELECT id FROM (
    SELECT id FROM regions WHERE sigungu_name = '시 단위' AND unit_level = 'dong'
  ) AS ident
)
ORDER BY r.sido_name;

SELECT 'B-사전-공식행' AS 단계, good.id, good.sido_name, good.unit_level, good.official_code
FROM regions bad
JOIN regions good
  ON good.unit_level = 'sido' AND good.is_active = 1
 AND good.sido_name = bad.sido_name
 AND good.official_code = RPAD(bad.sido_code, 10, '0')
WHERE bad.sigungu_name = '시 단위' AND bad.unit_level = 'dong'
ORDER BY good.sido_name;
-- 기대: 2행. 아니면 ROLLBACK; 하고 알려 주세요.

UPDATE study_room_regions t
JOIN regions bad ON bad.id = t.region_id AND bad.sigungu_name = '시 단위' AND bad.unit_level = 'dong'
JOIN regions good ON good.unit_level = 'sido' AND good.is_active = 1
 AND good.sido_name = bad.sido_name AND good.official_code = RPAD(bad.sido_code, 10, '0')
SET t.region_id = good.id;

UPDATE tutor_regions t
JOIN regions bad ON bad.id = t.region_id AND bad.sigungu_name = '시 단위' AND bad.unit_level = 'dong'
JOIN regions good ON good.unit_level = 'sido' AND good.is_active = 1
 AND good.sido_name = bad.sido_name AND good.official_code = RPAD(bad.sido_code, 10, '0')
SET t.region_id = good.id;

UPDATE students t
JOIN regions bad ON bad.id = t.preferred_studyroom_region_id AND bad.sigungu_name = '시 단위' AND bad.unit_level = 'dong'
JOIN regions good ON good.unit_level = 'sido' AND good.is_active = 1
 AND good.sido_name = bad.sido_name AND good.official_code = RPAD(bad.sido_code, 10, '0')
SET t.preferred_studyroom_region_id = good.id;

UPDATE students t
JOIN regions bad ON bad.id = t.preferred_tutor_region_id AND bad.sigungu_name = '시 단위' AND bad.unit_level = 'dong'
JOIN regions good ON good.unit_level = 'sido' AND good.is_active = 1
 AND good.sido_name = bad.sido_name AND good.official_code = RPAD(bad.sido_code, 10, '0')
SET t.preferred_tutor_region_id = good.id;

UPDATE user_profiles t
JOIN regions bad ON bad.id = t.default_region_id AND bad.sigungu_name = '시 단위' AND bad.unit_level = 'dong'
JOIN regions good ON good.unit_level = 'sido' AND good.is_active = 1
 AND good.sido_name = bad.sido_name AND good.official_code = RPAD(bad.sido_code, 10, '0')
SET t.default_region_id = good.id;

UPDATE study_rooms t
JOIN regions bad ON bad.id = t.region_id AND bad.sigungu_name = '시 단위' AND bad.unit_level = 'dong'
JOIN regions good ON good.unit_level = 'sido' AND good.is_active = 1
 AND good.sido_name = bad.sido_name AND good.official_code = RPAD(bad.sido_code, 10, '0')
SET t.region_id = good.id;

UPDATE complexes t
JOIN regions bad ON bad.id = t.region_id AND bad.sigungu_name = '시 단위' AND bad.unit_level = 'dong'
JOIN regions good ON good.unit_level = 'sido' AND good.is_active = 1
 AND good.sido_name = bad.sido_name AND good.official_code = RPAD(bad.sido_code, 10, '0')
SET t.region_id = good.id;

UPDATE study_room_exposure_assignments t
JOIN regions bad ON bad.id = t.region_id AND bad.sigungu_name = '시 단위' AND bad.unit_level = 'dong'
JOIN regions good ON good.unit_level = 'sido' AND good.is_active = 1
 AND good.sido_name = bad.sido_name AND good.official_code = RPAD(bad.sido_code, 10, '0')
SET t.region_id = good.id;

UPDATE study_room_exposure_waitlists t
JOIN regions bad ON bad.id = t.region_id AND bad.sigungu_name = '시 단위' AND bad.unit_level = 'dong'
JOIN regions good ON good.unit_level = 'sido' AND good.is_active = 1
 AND good.sido_name = bad.sido_name AND good.official_code = RPAD(bad.sido_code, 10, '0')
SET t.region_id = good.id;

UPDATE provider_position_subscriptions t
JOIN regions bad ON bad.id = t.region_id AND bad.sigungu_name = '시 단위' AND bad.unit_level = 'dong'
JOIN regions good ON good.unit_level = 'sido' AND good.is_active = 1
 AND good.sido_name = bad.sido_name AND good.official_code = RPAD(bad.sido_code, 10, '0')
SET t.region_id = good.id;

UPDATE provider_position_subscriptions t
JOIN regions bad ON bad.id = t.city_id AND bad.sigungu_name = '시 단위' AND bad.unit_level = 'dong'
JOIN regions good ON good.unit_level = 'sido' AND good.is_active = 1
 AND good.sido_name = bad.sido_name AND good.official_code = RPAD(bad.sido_code, 10, '0')
SET t.city_id = good.id;

-- 087 희망지역 칸이 있을 때만 옮긴다. 없으면 아무 일도 하지 않는다.
SET @c := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students'
    AND COLUMN_NAME = 'preferred_studyroom_region_extra_id'
);
SET @s := IF(@c = 1,
  'UPDATE students t
    JOIN regions bad ON bad.id = t.preferred_studyroom_region_extra_id AND bad.sigungu_name = ''시 단위'' AND bad.unit_level = ''dong''
    JOIN regions good ON good.unit_level = ''sido'' AND good.is_active = 1
     AND good.sido_name = bad.sido_name AND good.official_code = RPAD(bad.sido_code, 10, ''0'')
    SET t.preferred_studyroom_region_extra_id = good.id',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SET @c := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students'
    AND COLUMN_NAME = 'preferred_tutor_region_extra_id'
);
SET @s := IF(@c = 1,
  'UPDATE students t
    JOIN regions bad ON bad.id = t.preferred_tutor_region_extra_id AND bad.sigungu_name = ''시 단위'' AND bad.unit_level = ''dong''
    JOIN regions good ON good.unit_level = ''sido'' AND good.is_active = 1
     AND good.sido_name = bad.sido_name AND good.official_code = RPAD(bad.sido_code, 10, ''0'')
    SET t.preferred_tutor_region_extra_id = good.id',
  'SELECT 1');
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

-- 참조가 남아 있으면 한 줄도 지우지 않는다. 087 칸이 있으면 그 칸도 검사한다.
SET @extra := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students'
    AND COLUMN_NAME IN ('preferred_studyroom_region_extra_id', 'preferred_tutor_region_extra_id')
);
SET @extra_clause := IF(@extra = 2,
  ' AND NOT EXISTS (SELECT 1 FROM students x WHERE x.preferred_studyroom_region_extra_id = r.id)
    AND NOT EXISTS (SELECT 1 FROM students x WHERE x.preferred_tutor_region_extra_id = r.id)',
  '');
SET @s := CONCAT(
  'DELETE r FROM regions r
    WHERE r.id IN (SELECT id FROM (SELECT id FROM regions WHERE sigungu_name = ''시 단위'' AND unit_level = ''dong'') AS ident)
      AND NOT EXISTS (SELECT 1 FROM study_room_regions x WHERE x.region_id = r.id)
      AND NOT EXISTS (SELECT 1 FROM tutor_regions x WHERE x.region_id = r.id)
      AND NOT EXISTS (SELECT 1 FROM students x WHERE x.preferred_studyroom_region_id = r.id)
      AND NOT EXISTS (SELECT 1 FROM students x WHERE x.preferred_tutor_region_id = r.id)
      AND NOT EXISTS (SELECT 1 FROM user_profiles x WHERE x.default_region_id = r.id)
      AND NOT EXISTS (SELECT 1 FROM study_rooms x WHERE x.region_id = r.id)
      AND NOT EXISTS (SELECT 1 FROM complexes x WHERE x.region_id = r.id)
      AND NOT EXISTS (SELECT 1 FROM study_room_exposure_assignments x WHERE x.region_id = r.id)
      AND NOT EXISTS (SELECT 1 FROM study_room_exposure_waitlists x WHERE x.region_id = r.id)
      AND NOT EXISTS (SELECT 1 FROM provider_position_subscriptions x WHERE x.region_id = r.id)
      AND NOT EXISTS (SELECT 1 FROM provider_position_subscriptions x WHERE x.city_id = r.id)',
  @extra_clause
);
PREPARE ps FROM @s; EXECUTE ps; DEALLOCATE PREPARE ps;

SELECT 'B-확인-남은행' AS 단계, COUNT(*) AS 남은수
FROM regions
WHERE sigungu_name = '시 단위' AND unit_level = 'dong';
-- 기대: 남은수 0. 맞으면 COMMIT;  아니면 ROLLBACK;
-- COMMIT;
-- ROLLBACK;
