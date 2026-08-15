-- =============================================================================
-- study114 schema 041 — 목록 정렬용 추천 카운터 (공부방·과외쌤)
-- Apply AFTER 040_provider_reviews.sql
-- 후기순: provider_reviews COUNT (캐시 컬럼 없음 · 1차 유지)
-- SKY: sky_flag 없음 · tutors.university_name 만 (앱 로직)
-- 멱등: 컬럼 있으면 시 ADD 스킵 (프로시저)
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS study114_041_add_recommend_count;

DELIMITER $$
CREATE PROCEDURE study114_041_add_recommend_count()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'study_rooms'
      AND COLUMN_NAME = 'recommend_count'
  ) THEN
    ALTER TABLE study_rooms
      ADD COLUMN recommend_count INT UNSIGNED NOT NULL DEFAULT 0
        COMMENT '카드 추천(엄지) 수 · 목록 정렬용'
        AFTER feature_3;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'tutors'
      AND COLUMN_NAME = 'recommend_count'
  ) THEN
    ALTER TABLE tutors
      ADD COLUMN recommend_count INT UNSIGNED NOT NULL DEFAULT 0
        COMMENT '카드 추천(엄지) 수 · 목록 정렬용'
        AFTER feature_1;
  END IF;
END$$
DELIMITER ;

CALL study114_041_add_recommend_count();
DROP PROCEDURE IF EXISTS study114_041_add_recommend_count;

-- ---------------------------------------------------------------------------
-- 로컬 데모 시드 (운영 금지) — 추천 API/카운터 쓰기 경로가 생기기 전 정렬 확인용
-- 운영은 DEFAULT 0 유지. 필요 시 아래 2문을 따로 실행.
-- ---------------------------------------------------------------------------
-- UPDATE study_rooms SET recommend_count = ((id % 7) + 2)
-- WHERE recommend_count = 0 AND profile_status = 'published';
-- UPDATE tutors SET recommend_count = ((id % 9) + 1)
-- WHERE recommend_count = 0 AND profile_status = 'published';

-- 검증: sql/schema/041_list_sort_counters.verify.sql
