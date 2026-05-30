-- =============================================================================
-- study114 schema 006 — facility_masters seed (5장 §11-3 권장 ~5개)
-- Apply AFTER 005_study_room_ssot_align.sql
-- =============================================================================

-- Apply: mysql ... study114_dev < this file (USE 생략 — DB는 CLI 인자)

INSERT INTO facility_masters (facility_code, facility_name, sort_order, is_active) VALUES
  ('aircon',      '냉난방',           1, 1),
  ('ventilation', '환기',             2, 1),
  ('restroom',    '화장실/위생',      3, 1),
  ('parking',     '통학/주차 편의',   4, 1),
  ('safety',      'CCTV/안전관리',    5, 1)
ON DUPLICATE KEY UPDATE
  facility_name = VALUES(facility_name),
  sort_order = VALUES(sort_order),
  is_active = VALUES(is_active);
