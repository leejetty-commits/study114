-- =============================================================================
-- 078 — 과외 단위 「전남광주통합특별시 광주」 행 1개
-- 정본: docs/internal/72-region-unit-lock.md (2026-10-08 잠금) · 코드: src/Region/TutorRegionUnit.php
-- 옛 광주광역시 5개 구(12210·12240·12270·12300·12330)를 과외 단위로 묶는 행이다.
-- sigungu_code '12200' 은 073 에 없는 빈 번호(비공식 내부 번호). official_code 는 NULL.
-- is_selectable = 0 이라 공부방 구 단위 목록·검색에는 나오지 않는다.
-- 여러 번 실행해도 행은 1개다. Actions는 이 SQL을 실행하지 않는다. 운영 phpMyAdmin에서 사람이 적용한다.
-- 선행: 072_region_unit_level.sql, 073_region_official_seed.sql
-- 되돌리기: DELETE FROM regions WHERE sido_code = '12' AND sigungu_code = '12200';
--           (tutor_regions·students 가 이 행을 가리키면 FK 때문에 지워지지 않는다)
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

INSERT INTO regions (
  sido_code, sido_name, sigungu_code, sigungu_name, dong_code, dong_name,
  unit_level, official_code, is_selectable, is_active
)
SELECT '12', '전남광주통합특별시', '12200', '광주', NULL, '',
       'sigungu', NULL, 0, 1
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM regions WHERE sido_code = '12' AND sigungu_code = '12200'
);

-- 확인: 1행이어야 한다.
SELECT id, sido_code, sido_name, sigungu_code, sigungu_name, unit_level, official_code, is_selectable, is_active
FROM regions
WHERE sido_code = '12' AND sigungu_code = '12200';
