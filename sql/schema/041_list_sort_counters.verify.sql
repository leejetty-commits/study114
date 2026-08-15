-- =============================================================================
-- 041 적용 후 검증 SQL (수동 실행)
-- =============================================================================

USE study114;

-- 1) 컬럼 존재
SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('study_rooms', 'tutors')
  AND COLUMN_NAME = 'recommend_count';

-- 2) NULL/이상값 (NOT NULL DEFAULT 0 이면 0건이어야 함)
SELECT 'study_rooms' AS tbl, COUNT(*) AS null_or_neg
FROM study_rooms WHERE recommend_count IS NULL OR recommend_count < 0
UNION ALL
SELECT 'tutors', COUNT(*)
FROM tutors WHERE recommend_count IS NULL OR recommend_count < 0;

-- 3) 공개 프로필 분포 샘플
SELECT 'study_rooms' AS tbl, MIN(recommend_count) mn, MAX(recommend_count) mx, AVG(recommend_count) av
FROM study_rooms WHERE profile_status = 'published'
UNION ALL
SELECT 'tutors', MIN(recommend_count), MAX(recommend_count), AVG(recommend_count)
FROM tutors WHERE profile_status = 'published';

-- 4) 후기 테이블(040) 존재 — 후기순 COUNT용
SELECT COUNT(*) AS provider_reviews_table
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'provider_reviews';

-- 5) SKY 후보 university_name 샘플 (데이터 정리용 · 판정은 앱의 정식명 매칭)
SELECT id, university_name, recommend_count
FROM tutors
WHERE profile_status = 'published'
  AND university_name IS NOT NULL
  AND TRIM(university_name) <> ''
ORDER BY id
LIMIT 50;

-- 6) 비정규 학교명 후보 (정식 3개·짧은 표기 외 · 수동 검토)
SELECT id, university_name
FROM tutors
WHERE university_name IS NOT NULL
  AND TRIM(university_name) NOT IN (
    '서울대학교', '연세대학교', '고려대학교',
    '서울대', '연세대', '고려대'
  )
  AND (
    university_name LIKE '%서울대%'
    OR university_name LIKE '%연세대%'
    OR university_name LIKE '%고려대%'
    OR university_name LIKE '%SKY%'
    OR university_name LIKE '%대학원%'
  );
