-- =============================================================================
-- study114 schema 045 — 시설 마스터 보강 (Wi-Fi, 공기청정기, 정수기 등)
-- Apply AFTER 044_study_room_address_line2.sql
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

INSERT INTO facility_masters (facility_code, facility_name, sort_order, is_active) VALUES
  ('aircon',        '냉난방',         1, 1),
  ('ventilation',   '환기',           2, 1),
  ('restroom',      '화장실/위생',    3, 1),
  ('parking',       '통학/주차 편의', 4, 1),
  ('safety',        'CCTV/안전관리',  5, 1),
  ('wifi',          'Wi-Fi',          6, 1),
  ('air_purifier',  '공기청정기',     7, 1),
  ('water_purifier','정수기',         8, 1),
  ('whiteboard',    '화이트보드',     9, 1)
ON DUPLICATE KEY UPDATE
  facility_name = VALUES(facility_name),
  sort_order = VALUES(sort_order),
  is_active = VALUES(is_active);
