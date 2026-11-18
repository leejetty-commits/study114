-- =============================================================================
-- 12b 지역 3단계 — 읽기 전용 확인 SQL (종현이 dothome phpMyAdmin에서 실행)
-- SELECT만 있다. 데이터를 바꾸지 않는다. 이메일·전화번호는 나오지 않는다.
-- 목적: 운영 DB의 regions 표기가 지시서(12b)의 규칙과 맞는지 눈으로 확인.
-- =============================================================================

-- (1) 시·도 이름 종류와 행 수
--     기대: 073 시드 17개(서울특별시 … 전남광주통합특별시, 강원특별자치도, 전북특별자치도)
--     + 카카오 주소로 생긴 동 행 때문에 「광주광역시」「전라남도」가 따로 있을 수 있다.
--     줄임말(예: 경기)이 보이면 알려 주세요.
SELECT sido_name, COUNT(*) AS 행수,
       SUM(unit_level = 'sido') AS 시도행, SUM(unit_level = 'sigungu') AS 시군구행, SUM(unit_level = 'dong') AS 동행
FROM regions
GROUP BY sido_name
ORDER BY sido_name;

-- (2) 시·군·구 이름에 공백이 있거나 「○○시 ○○구」 꼴인 값
--     기대: 「수원시 장안구」처럼 시와 구가 한 칸에 공백으로 붙어 있다(073 시드 39개 + 카카오 동 행).
--     「○○시」 다음에 공백 없이 붙은 값, 공백이 두 칸인 값이 있으면 알려 주세요.
SELECT sido_name, sigungu_name, COUNT(*) AS 행수,
       GROUP_CONCAT(DISTINCT unit_level ORDER BY unit_level) AS 수준,
       MIN(sigungu_code) AS 시군구코드_최소, MAX(sigungu_code) AS 시군구코드_최대
FROM regions
WHERE sigungu_name LIKE '% %' OR sigungu_name REGEXP '시 .+구$'
GROUP BY sido_name, sigungu_name
ORDER BY sido_name, sigungu_name;

-- (3) 구가 있는 시 목록(위 (2)에서 앞 단어만). 기대(073 기준 13개):
--     경기도 수원·성남·안양·부천·안산·고양·용인·화성, 충북 청주, 충남 천안, 경북 포항, 경남 창원, 전북 전주
SELECT sido_name, SUBSTRING_INDEX(TRIM(sigungu_name), ' ', 1) AS 구가있는시, COUNT(DISTINCT sigungu_name) AS 구_종류
FROM regions
WHERE TRIM(sigungu_name) REGEXP '^[^ ]+시 [^ ]+구$'
GROUP BY sido_name, SUBSTRING_INDEX(TRIM(sigungu_name), ' ', 1)
ORDER BY sido_name, 구가있는시;

-- (4) 실제 카드가 가리키는 지역 표기(대표 지역 기준). 이름은 안 나오고 개수만 나온다.
SELECT '공부방' AS 역할, reg.sido_name, reg.sigungu_name, reg.sigungu_code, reg.unit_level, COUNT(*) AS 카드수
FROM study_rooms sr
JOIN study_room_regions r ON r.study_room_id = sr.id AND r.slot = 1
LEFT JOIN regions reg ON reg.id = r.region_id
WHERE sr.deleted_at IS NULL
GROUP BY reg.sido_name, reg.sigungu_name, reg.sigungu_code, reg.unit_level
UNION ALL
SELECT '과외쌤', reg.sido_name, reg.sigungu_name, reg.sigungu_code, reg.unit_level, COUNT(*)
FROM tutors t
JOIN tutor_regions r ON r.tutor_id = t.id AND r.priority_order = 0
LEFT JOIN regions reg ON reg.id = r.region_id
GROUP BY reg.sido_name, reg.sigungu_name, reg.sigungu_code, reg.unit_level
UNION ALL
SELECT '학생', reg.sido_name, reg.sigungu_name, reg.sigungu_code, reg.unit_level, COUNT(*)
FROM students s
LEFT JOIN regions reg ON reg.id = CASE WHEN s.preferred_lesson_type = 'tutor' THEN s.preferred_tutor_region_id
                                       WHEN s.preferred_lesson_type = 'study_room' THEN s.preferred_studyroom_region_id END
WHERE s.published_at IS NOT NULL AND s.deleted_at IS NULL
GROUP BY reg.sido_name, reg.sigungu_name, reg.sigungu_code, reg.unit_level
ORDER BY 1, 2, 3;
