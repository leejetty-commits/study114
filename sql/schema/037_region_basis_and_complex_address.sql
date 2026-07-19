-- =============================================================================
-- study114 schema 037 — 가입 후 지역등록: 기준 타입 + 단지 주소 백필
-- 10-6: 행정동|단지 선선택 · complexes.address 노출 · 기본주소와 분리
-- Apply AFTER 036_admin_level_and_must_change.sql (or after latest)
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- 1) complexes.address 백필 (이미 컬럼 있음 — 시드·기존 NULL 채움)
-- ---------------------------------------------------------------------------
UPDATE complexes SET address = CASE name
  WHEN '은마아파트' THEN '서울특별시 강남구 대치동 316'
  WHEN '센텀자이' THEN '부산광역시 해운대구 센텀동로 99'
  ELSE COALESCE(NULLIF(TRIM(address), ''), CONCAT('(주소 미등록) ', name))
END
WHERE address IS NULL OR TRIM(address) = '';

-- 개발 시드에 없는 프리뷰용 단지명이 추가될 수 있으므로, 이름 기준 upsert 보조
INSERT INTO complexes (region_id, name, address, is_active)
SELECT r.id, v.name, v.address, 1
FROM (
  SELECT '은마아파트' AS name, '서울특별시 강남구 대치동 316' AS address, '대치동' AS dong
  UNION ALL SELECT '대치래미안', '서울특별시 강남구 대치동 888', '대치동'
  UNION ALL SELECT '잠실주공', '서울특별시 송파구 잠실동 22', '잠실동'
  UNION ALL SELECT '해운대아이파크', '부산광역시 해운대구 우동 1408', '우동'
  UNION ALL SELECT '래미안대치팰리스', '서울특별시 강남구 대치동 1027', '대치동'
  UNION ALL SELECT '대치아이파크', '서울특별시 강남구 대치동 950', '대치동'
  UNION ALL SELECT '해운대두산위브', '부산광역시 해운대구 우동 1514', '우동'
) AS v
INNER JOIN regions r ON r.dong_name = v.dong AND r.is_active = 1
WHERE NOT EXISTS (
  SELECT 1 FROM complexes c WHERE c.name = v.name AND c.region_id = r.id
);

UPDATE complexes c
INNER JOIN (
  SELECT '은마아파트' AS name, '서울특별시 강남구 대치동 316' AS address
  UNION ALL SELECT '대치래미안', '서울특별시 강남구 대치동 888'
  UNION ALL SELECT '잠실주공', '서울특별시 송파구 잠실동 22'
  UNION ALL SELECT '해운대아이파크', '부산광역시 해운대구 우동 1408'
  UNION ALL SELECT '래미안대치팰리스', '서울특별시 강남구 대치동 1027'
  UNION ALL SELECT '대치아이파크', '서울특별시 강남구 대치동 950'
  UNION ALL SELECT '해운대두산위브', '부산광역시 해운대구 우동 1514'
  UNION ALL SELECT '센텀자이', '부산광역시 해운대구 센텀동로 99'
) AS v ON c.name = v.name
SET c.address = v.address
WHERE c.address IS NULL OR TRIM(c.address) = '' OR c.address LIKE '(주소 미등록)%';

-- ---------------------------------------------------------------------------
-- 2) students — 공부방찾기 기준 타입 (dong | complex)
-- ---------------------------------------------------------------------------
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'students'
    AND COLUMN_NAME = 'preferred_studyroom_region_basis'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE students
     ADD COLUMN preferred_studyroom_region_basis ENUM(''dong'', ''complex'') NULL
       COMMENT ''공부방찾기 지역 기준: 행정동|아파트단지''
       AFTER preferred_studyroom_complex_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 기존 데이터: complex_id 있으면 complex, region만 있으면 dong
UPDATE students
SET preferred_studyroom_region_basis = CASE
  WHEN preferred_studyroom_complex_id IS NOT NULL THEN 'complex'
  WHEN preferred_studyroom_region_id IS NOT NULL THEN 'dong'
  ELSE preferred_studyroom_region_basis
END
WHERE preferred_studyroom_region_basis IS NULL
  AND (preferred_studyroom_region_id IS NOT NULL OR preferred_studyroom_complex_id IS NOT NULL);

-- ---------------------------------------------------------------------------
-- 3) study_rooms — 노출/기본 위치 기준 타입
-- ---------------------------------------------------------------------------
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'study_rooms'
    AND COLUMN_NAME = 'region_basis_type'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE study_rooms
     ADD COLUMN region_basis_type ENUM(''dong'', ''complex'') NOT NULL DEFAULT ''dong''
       COMMENT ''노출·기본위치 기준: 행정동|아파트단지''
       AFTER complex_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE study_rooms
SET region_basis_type = CASE
  WHEN complex_id IS NOT NULL THEN 'complex'
  ELSE 'dong'
END
WHERE region_basis_type = 'dong' AND complex_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 4) study_room_regions — 슬롯별 기준 타입 (슬롯 간 혼용 금지용)
-- ---------------------------------------------------------------------------
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'study_room_regions'
    AND COLUMN_NAME = 'region_basis_type'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE study_room_regions
     ADD COLUMN region_basis_type ENUM(''dong'', ''complex'') NOT NULL DEFAULT ''dong''
       COMMENT ''슬롯 기준: 행정동|아파트단지''
       AFTER complex_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE study_room_regions
SET region_basis_type = CASE
  WHEN complex_id IS NOT NULL THEN 'complex'
  ELSE 'dong'
END
WHERE region_basis_type = 'dong' AND complex_id IS NOT NULL;
