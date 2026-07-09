-- =============================================================================
-- study114 schema 033 — 공부방 대표 좌표 (지도 1차 · 부록 지도 API)
-- Apply AFTER 012_search_dev_seed.sql
-- =============================================================================

USE study114;

UPDATE study_rooms SET latitude = 37.4965, longitude = 127.0602 WHERE id = 1;
UPDATE study_rooms SET latitude = 35.1638, longitude = 129.1641 WHERE id = 2;
UPDATE study_rooms SET latitude = 35.1698, longitude = 129.1318 WHERE id = 3;
