-- =============================================================================
-- 12c 「시 단위」 동 행 — 읽기 전용 확인 SQL (종현이 dothome phpMyAdmin에서 실행)
-- SELECT만 있다. 데이터를 바꾸지 않는다. 이메일·전화번호·이름은 나오지 않는다.
-- 목적: 강원·경기 「시 단위」 동 행 2개의 전체 칸과, regions.id를 가리키는
--       모든 칸의 참조 건수를 확인한다. 이 결과를 본 뒤에만 12c-region-sidanwi-fix.sql 을 실행한다.
--
-- 원인(코드는 이미 없음): 예전 SidoRegionEnsure::ensure() (커밋 7a320f70,
--   src/Region/SidoRegionEnsure.php 88~94행)가 그 시·도에 지역 행이 하나도 없을 때
--   sigungu_name='시 단위', dong_name='시 대표', sigungu_code=시도코드+'00'(4100·5100)인
--   동 행을 만들었다. 다른 시·도는 이미 카카오 동 행이 있어 건너뛰었고, 경기·강원만 남았다.
--   2026-10-01 커밋 67b9a63e 이후 ensure()는 빈 함수이고, 현재 코드는 이런 행을 다시 만들지 않는다.
--   옮길 곳: 073 시드의 같은 시·도 공식 행(unit_level='sido', official_code 4100000000·5100000000).
-- =============================================================================

-- (1) 대상 행 전체 칸. 기대: 2행(경기도 4100, 강원특별자치도 5100).
--     dong_name은 「시 대표」, official_code는 비어 있을 가능성이 크다.
SELECT *
FROM regions
WHERE sigungu_name = '시 단위' AND unit_level = 'dong'
ORDER BY sido_name;


-- (2) 이 DB에 있는 지역 참조 칸 목록(스키마만, 값은 없음).
--     아래 (3)에 없는 칸이 보이면 그 결과를 알려 주세요. 수정 SQL을 보강해야 합니다.
SELECT TABLE_NAME AS 표, COLUMN_NAME AS 칸, COLUMN_TYPE AS 형
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME <> 'regions'
  AND (
    COLUMN_NAME LIKE '%region_id%'
    OR COLUMN_NAME = 'city_id'
  )
ORDER BY TABLE_NAME, COLUMN_NAME;


-- (3) 칸별 참조 건수. 0이면 그 칸은 이 두 행을 가리키지 않는다.
--     087(희망지역 추가 칸)이 아직 없으면 해당 두 줄만 오류가 난다. 그 줄은 건너뛰면 된다.
SELECT 'study_room_regions.region_id' AS 칸, COUNT(*) AS 건수
FROM study_room_regions
WHERE region_id IN (SELECT id FROM regions WHERE sigungu_name = '시 단위' AND unit_level = 'dong')
UNION ALL
SELECT 'tutor_regions.region_id', COUNT(*)
FROM tutor_regions
WHERE region_id IN (SELECT id FROM regions WHERE sigungu_name = '시 단위' AND unit_level = 'dong')
UNION ALL
SELECT 'students.preferred_studyroom_region_id', COUNT(*)
FROM students
WHERE preferred_studyroom_region_id IN (SELECT id FROM regions WHERE sigungu_name = '시 단위' AND unit_level = 'dong')
UNION ALL
SELECT 'students.preferred_tutor_region_id', COUNT(*)
FROM students
WHERE preferred_tutor_region_id IN (SELECT id FROM regions WHERE sigungu_name = '시 단위' AND unit_level = 'dong')
UNION ALL
SELECT 'students.preferred_studyroom_region_extra_id', COUNT(*)
FROM students
WHERE preferred_studyroom_region_extra_id IN (SELECT id FROM regions WHERE sigungu_name = '시 단위' AND unit_level = 'dong')
UNION ALL
SELECT 'students.preferred_tutor_region_extra_id', COUNT(*)
FROM students
WHERE preferred_tutor_region_extra_id IN (SELECT id FROM regions WHERE sigungu_name = '시 단위' AND unit_level = 'dong')
UNION ALL
SELECT 'user_profiles.default_region_id', COUNT(*)
FROM user_profiles
WHERE default_region_id IN (SELECT id FROM regions WHERE sigungu_name = '시 단위' AND unit_level = 'dong')
UNION ALL
SELECT 'study_rooms.region_id', COUNT(*)
FROM study_rooms
WHERE region_id IN (SELECT id FROM regions WHERE sigungu_name = '시 단위' AND unit_level = 'dong')
UNION ALL
SELECT 'complexes.region_id', COUNT(*)
FROM complexes
WHERE region_id IN (SELECT id FROM regions WHERE sigungu_name = '시 단위' AND unit_level = 'dong')
UNION ALL
SELECT 'study_room_exposure_assignments.region_id', COUNT(*)
FROM study_room_exposure_assignments
WHERE region_id IN (SELECT id FROM regions WHERE sigungu_name = '시 단위' AND unit_level = 'dong')
UNION ALL
SELECT 'study_room_exposure_waitlists.region_id', COUNT(*)
FROM study_room_exposure_waitlists
WHERE region_id IN (SELECT id FROM regions WHERE sigungu_name = '시 단위' AND unit_level = 'dong')
UNION ALL
SELECT 'provider_position_subscriptions.region_id', COUNT(*)
FROM provider_position_subscriptions
WHERE region_id IN (SELECT id FROM regions WHERE sigungu_name = '시 단위' AND unit_level = 'dong')
UNION ALL
SELECT 'provider_position_subscriptions.city_id', COUNT(*)
FROM provider_position_subscriptions
WHERE city_id IN (SELECT id FROM regions WHERE sigungu_name = '시 단위' AND unit_level = 'dong');


-- (4) 참조가 있는 행의 id만 (이름·연락처 없음). 건수가 0이면 빈 표가 정상이다.
SELECT 'study_room_regions' AS 표, srr.id AS 행id, srr.study_room_id AS 소유id, srr.slot AS 슬롯또는순서, srr.region_id AS 지역id
FROM study_room_regions srr
WHERE srr.region_id IN (SELECT id FROM regions WHERE sigungu_name = '시 단위' AND unit_level = 'dong')
UNION ALL
SELECT 'tutor_regions', tr.id, tr.tutor_id, tr.priority_order, tr.region_id
FROM tutor_regions tr
WHERE tr.region_id IN (SELECT id FROM regions WHERE sigungu_name = '시 단위' AND unit_level = 'dong')
UNION ALL
SELECT 'students.preferred_studyroom_region_id', s.id, s.id, NULL, s.preferred_studyroom_region_id
FROM students s
WHERE s.preferred_studyroom_region_id IN (SELECT id FROM regions WHERE sigungu_name = '시 단위' AND unit_level = 'dong')
UNION ALL
SELECT 'students.preferred_tutor_region_id', s.id, s.id, NULL, s.preferred_tutor_region_id
FROM students s
WHERE s.preferred_tutor_region_id IN (SELECT id FROM regions WHERE sigungu_name = '시 단위' AND unit_level = 'dong')
UNION ALL
SELECT 'students.preferred_studyroom_region_extra_id', s.id, s.id, NULL, s.preferred_studyroom_region_extra_id
FROM students s
WHERE s.preferred_studyroom_region_extra_id IN (SELECT id FROM regions WHERE sigungu_name = '시 단위' AND unit_level = 'dong')
UNION ALL
SELECT 'students.preferred_tutor_region_extra_id', s.id, s.id, NULL, s.preferred_tutor_region_extra_id
FROM students s
WHERE s.preferred_tutor_region_extra_id IN (SELECT id FROM regions WHERE sigungu_name = '시 단위' AND unit_level = 'dong')
UNION ALL
SELECT 'user_profiles.default_region_id', p.id, p.user_id, NULL, p.default_region_id
FROM user_profiles p
WHERE p.default_region_id IN (SELECT id FROM regions WHERE sigungu_name = '시 단위' AND unit_level = 'dong')
UNION ALL
SELECT 'study_rooms.region_id', sr.id, sr.id, NULL, sr.region_id
FROM study_rooms sr
WHERE sr.region_id IN (SELECT id FROM regions WHERE sigungu_name = '시 단위' AND unit_level = 'dong')
UNION ALL
SELECT 'complexes.region_id', c.id, c.id, NULL, c.region_id
FROM complexes c
WHERE c.region_id IN (SELECT id FROM regions WHERE sigungu_name = '시 단위' AND unit_level = 'dong')
UNION ALL
SELECT 'study_room_exposure_assignments', a.id, a.study_room_id, NULL, a.region_id
FROM study_room_exposure_assignments a
WHERE a.region_id IN (SELECT id FROM regions WHERE sigungu_name = '시 단위' AND unit_level = 'dong')
UNION ALL
SELECT 'study_room_exposure_waitlists', w.id, w.study_room_id, NULL, w.region_id
FROM study_room_exposure_waitlists w
WHERE w.region_id IN (SELECT id FROM regions WHERE sigungu_name = '시 단위' AND unit_level = 'dong')
UNION ALL
SELECT 'provider_position_subscriptions.region_id', ps.id, ps.id, NULL, ps.region_id
FROM provider_position_subscriptions ps
WHERE ps.region_id IN (SELECT id FROM regions WHERE sigungu_name = '시 단위' AND unit_level = 'dong')
UNION ALL
SELECT 'provider_position_subscriptions.city_id', ps.id, ps.id, NULL, ps.city_id
FROM provider_position_subscriptions ps
WHERE ps.city_id IN (SELECT id FROM regions WHERE sigungu_name = '시 단위' AND unit_level = 'dong');


-- (5) 옮길 공식 시·도 행(073 시드). 기대: 경기도·강원특별자치도 각 1행.
--     official_code 는 4100000000, 5100000000. unit_level 은 sido.
SELECT good.id, good.sido_code, good.sido_name, good.sigungu_code, good.sigungu_name,
       good.dong_code, good.dong_name, good.unit_level, good.official_code, good.is_selectable, good.is_active
FROM regions bad
JOIN regions good
  ON good.unit_level = 'sido'
 AND good.is_active = 1
 AND good.sido_name = bad.sido_name
 AND good.official_code = RPAD(bad.sido_code, 10, '0')
WHERE bad.sigungu_name = '시 단위' AND bad.unit_level = 'dong'
ORDER BY good.sido_name;


-- (6) 같은 소유자가 이미 공식 시·도 행을 가리키는지(옮길 때 겹침). 비어 있으면 겹치지 않는다.
SELECT 'tutor_regions' AS 표, tr_bad.tutor_id AS 소유id, tr_bad.priority_order AS 잘못된쪽_순서,
       tr_good.priority_order AS 이미있는쪽_순서, tr_bad.region_id AS 잘못된_지역id, tr_good.region_id AS 공식_지역id
FROM tutor_regions tr_bad
JOIN regions bad ON bad.id = tr_bad.region_id AND bad.sigungu_name = '시 단위' AND bad.unit_level = 'dong'
JOIN regions good ON good.unit_level = 'sido' AND good.sido_name = bad.sido_name
 AND good.official_code = RPAD(bad.sido_code, 10, '0') AND good.is_active = 1
JOIN tutor_regions tr_good ON tr_good.tutor_id = tr_bad.tutor_id AND tr_good.region_id = good.id
UNION ALL
SELECT 'provider_position_subscriptions.region_id', ps.id, NULL, NULL, ps.region_id, good.id
FROM provider_position_subscriptions ps
JOIN regions bad ON bad.id = ps.region_id AND bad.sigungu_name = '시 단위' AND bad.unit_level = 'dong'
JOIN regions good ON good.unit_level = 'sido' AND good.sido_name = bad.sido_name
 AND good.official_code = RPAD(bad.sido_code, 10, '0') AND good.is_active = 1
JOIN provider_position_subscriptions other
  ON other.id <> ps.id
 AND other.sku_code <=> ps.sku_code
 AND other.provider_type <=> ps.provider_type
 AND other.region_basis_type <=> ps.region_basis_type
 AND other.region_id = good.id
 AND other.complex_id <=> ps.complex_id
 AND other.end_exclusive_on <=> ps.end_exclusive_on
UNION ALL
SELECT 'provider_position_subscriptions.city_id', ps.id, NULL, NULL, ps.city_id, good.id
FROM provider_position_subscriptions ps
JOIN regions bad ON bad.id = ps.city_id AND bad.sigungu_name = '시 단위' AND bad.unit_level = 'dong'
JOIN regions good ON good.unit_level = 'sido' AND good.sido_name = bad.sido_name
 AND good.official_code = RPAD(bad.sido_code, 10, '0') AND good.is_active = 1
JOIN provider_position_subscriptions other
  ON other.id <> ps.id
 AND other.sku_code <=> ps.sku_code
 AND other.provider_type <=> ps.provider_type
 AND other.city_id = good.id
 AND other.primary_subject_id <=> ps.primary_subject_id
 AND other.end_exclusive_on <=> ps.end_exclusive_on;
