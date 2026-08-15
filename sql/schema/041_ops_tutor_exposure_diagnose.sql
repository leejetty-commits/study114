-- =============================================================================
-- 운영 tutor 0건 원인 분리 진단 (읽기 전용)
-- phpMyAdmin SQL 탭에서 study114 선택 후 실행 → 결과 전체를 복사해
-- docs/internal/verify-snapshots/ 에 보관
-- =============================================================================

USE study114;

SELECT 'tutors_total' AS metric, COUNT(*) AS n FROM tutors
UNION ALL
SELECT 'tutors_published', COUNT(*) FROM tutors WHERE profile_status = 'published'
UNION ALL
SELECT 'tutors_expanded_complete', COUNT(*) FROM tutors WHERE detail_completion_status = 'expanded_complete'
UNION ALL
SELECT 'tutors_published_and_expanded', COUNT(*) FROM tutors
  WHERE profile_status = 'published' AND detail_completion_status = 'expanded_complete'
UNION ALL
SELECT 'tutors_with_university_name', COUNT(*) FROM tutors
  WHERE university_name IS NOT NULL AND TRIM(university_name) <> ''
UNION ALL
SELECT 'tutors_sky_name_match', COUNT(*) FROM tutors
  WHERE TRIM(university_name) IN (
    '서울대학교','연세대학교','고려대학교','서울대','연세대','고려대'
  );

-- 검색 API와 동일 노출 조건
SELECT id, tutor_display_name, profile_status, detail_completion_status,
       university_name, recommend_count, published_at
FROM tutors
ORDER BY id;

SELECT profile_status, detail_completion_status, COUNT(*) AS n
FROM tutors
GROUP BY profile_status, detail_completion_status;

SELECT
  MIN(recommend_count) AS rec_min,
  MAX(recommend_count) AS rec_max,
  AVG(recommend_count) AS rec_avg,
  SUM(recommend_count = 0) AS rec_zero_rows
FROM tutors;

SELECT COUNT(*) AS provider_reviews_tutor
FROM provider_reviews
WHERE provider_type = 'tutor' AND review_status = 'visible';

SELECT COUNT(*) AS provider_reviews_room
FROM provider_reviews
WHERE provider_type = 'study_room' AND review_status = 'visible';
