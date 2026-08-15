-- =============================================================================
-- 운영 tutor 검색 미노출 진단 (읽기 전용)
-- phpMyAdmin SQL 탭에서 study114 선택 후 실행 → 결과 전체를 복사해
-- docs/internal/verify-snapshots/ 에 보관
--
-- 검색 노출 SSOT: profile_status='published' AND detail_completion_status='expanded_complete'
-- expanded_complete 판정 SSOT: TutorDetailCompletionEvaluator (필드 기반, 스텝 아님)
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

SELECT profile_status, detail_completion_status, COUNT(*) AS n
FROM tutors
GROUP BY profile_status, detail_completion_status;

-- 검색 API와 동일 노출 조건 + 필수필드 누락 플래그 (진단용, 코드 Evaluator 와 동일 축)
SELECT
  t.id,
  t.tutor_display_name,
  t.profile_status,
  t.detail_completion_status,
  t.university_name,
  t.preferred_fee_amount,
  t.fee_basis_type,
  t.lessons_per_week,
  t.monthly_session_count,
  t.minutes_per_lesson,
  CASE WHEN TRIM(COALESCE(t.tutor_display_name,'')) = '' THEN 1 ELSE 0 END AS miss_name,
  CASE WHEN NOT EXISTS (
    SELECT 1 FROM tutor_regions tr WHERE tr.tutor_id = t.id AND tr.is_primary = 1
  ) THEN 1 ELSE 0 END AS miss_region,
  CASE WHEN TRIM(COALESCE(t.main_subject_note,'')) = ''
    AND NOT EXISTS (SELECT 1 FROM tutor_subject_targets s WHERE s.tutor_id = t.id LIMIT 1)
    THEN 1 ELSE 0 END AS miss_subject,
  CASE WHEN NOT EXISTS (SELECT 1 FROM tutor_lesson_places p WHERE p.tutor_id = t.id)
    THEN 1 ELSE 0 END AS miss_places,
  CASE WHEN COALESCE(t.preferred_fee_amount, 0) <= 0 THEN 1 ELSE 0 END AS miss_fee,
  CASE WHEN t.fee_basis_type NOT IN ('monthly_by_weekly_schedule','monthly_by_total_sessions')
    THEN 1 ELSE 0 END AS miss_fee_basis,
  CASE
    WHEN t.fee_basis_type = 'monthly_by_weekly_schedule' AND COALESCE(t.lessons_per_week, 0) <= 0 THEN 1
    WHEN t.fee_basis_type = 'monthly_by_total_sessions' AND COALESCE(t.monthly_session_count, 0) <= 0 THEN 1
    WHEN t.fee_basis_type NOT IN ('monthly_by_weekly_schedule','monthly_by_total_sessions') THEN 1
    ELSE 0
  END AS miss_schedule,
  CASE WHEN COALESCE(t.minutes_per_lesson, 0) <= 0 THEN 1 ELSE 0 END AS miss_minutes,
  CASE WHEN TRIM(COALESCE(t.intro_short,'')) = '' AND TRIM(COALESCE(t.intro_long,'')) = ''
    THEN 1 ELSE 0 END AS miss_intro,
  CASE WHEN TRIM(COALESCE(t.university_name,'')) = '' THEN 1 ELSE 0 END AS miss_university,
  CASE WHEN NOT EXISTS (SELECT 1 FROM tutor_images i WHERE i.tutor_id = t.id)
    THEN 1 ELSE 0 END AS miss_image_publish_only,
  t.recommend_count,
  t.published_at
FROM tutors t
ORDER BY t.id;

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
