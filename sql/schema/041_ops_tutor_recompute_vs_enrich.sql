-- =============================================================================
-- 운영: recompute-only vs 소유자 보강 분리 (읽기 전용)
-- Evaluator 필수필드와 동일 축. 실행 후 결과로 A/B 버킷 확정.
-- =============================================================================
USE study114;

SELECT
  t.id,
  t.tutor_display_name,
  t.profile_status,
  t.detail_completion_status AS status_now,
  t.university_name,
  /* 필수 누락 합계 (이미지 제외 — complete 판정용) */
  (
    (CASE WHEN TRIM(COALESCE(t.tutor_display_name,'')) = '' THEN 1 ELSE 0 END) +
    (CASE WHEN NOT EXISTS (
      SELECT 1 FROM tutor_regions tr WHERE tr.tutor_id = t.id AND tr.is_primary = 1
    ) THEN 1 ELSE 0 END) +
    (CASE WHEN TRIM(COALESCE(t.main_subject_note,'')) = ''
      AND NOT EXISTS (SELECT 1 FROM tutor_subject_targets s WHERE s.tutor_id = t.id LIMIT 1)
      THEN 1 ELSE 0 END) +
    (CASE WHEN NOT EXISTS (SELECT 1 FROM tutor_lesson_places p WHERE p.tutor_id = t.id)
      THEN 1 ELSE 0 END) +
    (CASE WHEN COALESCE(t.preferred_fee_amount, 0) <= 0 THEN 1 ELSE 0 END) +
    (CASE WHEN t.fee_basis_type NOT IN ('monthly_by_weekly_schedule','monthly_by_total_sessions')
      THEN 1 ELSE 0 END) +
    (CASE
      WHEN t.fee_basis_type = 'monthly_by_weekly_schedule' AND COALESCE(t.lessons_per_week, 0) <= 0 THEN 1
      WHEN t.fee_basis_type = 'monthly_by_total_sessions' AND COALESCE(t.monthly_session_count, 0) <= 0 THEN 1
      WHEN t.fee_basis_type NOT IN ('monthly_by_weekly_schedule','monthly_by_total_sessions') THEN 1
      ELSE 0
    END) +
    (CASE WHEN COALESCE(t.minutes_per_lesson, 0) <= 0 THEN 1 ELSE 0 END) +
    (CASE WHEN TRIM(COALESCE(t.intro_short,'')) = '' AND TRIM(COALESCE(t.intro_long,'')) = ''
      THEN 1 ELSE 0 END) +
    (CASE WHEN TRIM(COALESCE(t.university_name,'')) = '' THEN 1 ELSE 0 END)
  ) AS miss_required_n,
  CASE
    WHEN (
      (CASE WHEN TRIM(COALESCE(t.tutor_display_name,'')) = '' THEN 1 ELSE 0 END) +
      (CASE WHEN NOT EXISTS (
        SELECT 1 FROM tutor_regions tr WHERE tr.tutor_id = t.id AND tr.is_primary = 1
      ) THEN 1 ELSE 0 END) +
      (CASE WHEN TRIM(COALESCE(t.main_subject_note,'')) = ''
        AND NOT EXISTS (SELECT 1 FROM tutor_subject_targets s WHERE s.tutor_id = t.id LIMIT 1)
        THEN 1 ELSE 0 END) +
      (CASE WHEN NOT EXISTS (SELECT 1 FROM tutor_lesson_places p WHERE p.tutor_id = t.id)
        THEN 1 ELSE 0 END) +
      (CASE WHEN COALESCE(t.preferred_fee_amount, 0) <= 0 THEN 1 ELSE 0 END) +
      (CASE WHEN t.fee_basis_type NOT IN ('monthly_by_weekly_schedule','monthly_by_total_sessions')
        THEN 1 ELSE 0 END) +
      (CASE
        WHEN t.fee_basis_type = 'monthly_by_weekly_schedule' AND COALESCE(t.lessons_per_week, 0) <= 0 THEN 1
        WHEN t.fee_basis_type = 'monthly_by_total_sessions' AND COALESCE(t.monthly_session_count, 0) <= 0 THEN 1
        WHEN t.fee_basis_type NOT IN ('monthly_by_weekly_schedule','monthly_by_total_sessions') THEN 1
        ELSE 0
      END) +
      (CASE WHEN COALESCE(t.minutes_per_lesson, 0) <= 0 THEN 1 ELSE 0 END) +
      (CASE WHEN TRIM(COALESCE(t.intro_short,'')) = '' AND TRIM(COALESCE(t.intro_long,'')) = ''
        THEN 1 ELSE 0 END) +
      (CASE WHEN TRIM(COALESCE(t.university_name,'')) = '' THEN 1 ELSE 0 END)
    ) = 0
    THEN 'A_recompute_only'
    ELSE 'B_owner_enrich'
  END AS bucket,
  /* 검색 노출까지: A이면서 published면 recompute 직후 검색 가능 */
  CASE
    WHEN t.profile_status = 'published'
     AND (
      (CASE WHEN TRIM(COALESCE(t.tutor_display_name,'')) = '' THEN 1 ELSE 0 END) +
      (CASE WHEN NOT EXISTS (
        SELECT 1 FROM tutor_regions tr WHERE tr.tutor_id = t.id AND tr.is_primary = 1
      ) THEN 1 ELSE 0 END) +
      (CASE WHEN TRIM(COALESCE(t.main_subject_note,'')) = ''
        AND NOT EXISTS (SELECT 1 FROM tutor_subject_targets s WHERE s.tutor_id = t.id LIMIT 1)
        THEN 1 ELSE 0 END) +
      (CASE WHEN NOT EXISTS (SELECT 1 FROM tutor_lesson_places p WHERE p.tutor_id = t.id)
        THEN 1 ELSE 0 END) +
      (CASE WHEN COALESCE(t.preferred_fee_amount, 0) <= 0 THEN 1 ELSE 0 END) +
      (CASE WHEN t.fee_basis_type NOT IN ('monthly_by_weekly_schedule','monthly_by_total_sessions')
        THEN 1 ELSE 0 END) +
      (CASE
        WHEN t.fee_basis_type = 'monthly_by_weekly_schedule' AND COALESCE(t.lessons_per_week, 0) <= 0 THEN 1
        WHEN t.fee_basis_type = 'monthly_by_total_sessions' AND COALESCE(t.monthly_session_count, 0) <= 0 THEN 1
        WHEN t.fee_basis_type NOT IN ('monthly_by_weekly_schedule','monthly_by_total_sessions') THEN 1
        ELSE 0
      END) +
      (CASE WHEN COALESCE(t.minutes_per_lesson, 0) <= 0 THEN 1 ELSE 0 END) +
      (CASE WHEN TRIM(COALESCE(t.intro_short,'')) = '' AND TRIM(COALESCE(t.intro_long,'')) = ''
        THEN 1 ELSE 0 END) +
      (CASE WHEN TRIM(COALESCE(t.university_name,'')) = '' THEN 1 ELSE 0 END)
    ) = 0
    THEN 'A1_search_after_recompute'
    WHEN (
      (CASE WHEN TRIM(COALESCE(t.tutor_display_name,'')) = '' THEN 1 ELSE 0 END) +
      (CASE WHEN NOT EXISTS (
        SELECT 1 FROM tutor_regions tr WHERE tr.tutor_id = t.id AND tr.is_primary = 1
      ) THEN 1 ELSE 0 END) +
      (CASE WHEN TRIM(COALESCE(t.main_subject_note,'')) = ''
        AND NOT EXISTS (SELECT 1 FROM tutor_subject_targets s WHERE s.tutor_id = t.id LIMIT 1)
        THEN 1 ELSE 0 END) +
      (CASE WHEN NOT EXISTS (SELECT 1 FROM tutor_lesson_places p WHERE p.tutor_id = t.id)
        THEN 1 ELSE 0 END) +
      (CASE WHEN COALESCE(t.preferred_fee_amount, 0) <= 0 THEN 1 ELSE 0 END) +
      (CASE WHEN t.fee_basis_type NOT IN ('monthly_by_weekly_schedule','monthly_by_total_sessions')
        THEN 1 ELSE 0 END) +
      (CASE
        WHEN t.fee_basis_type = 'monthly_by_weekly_schedule' AND COALESCE(t.lessons_per_week, 0) <= 0 THEN 1
        WHEN t.fee_basis_type = 'monthly_by_total_sessions' AND COALESCE(t.monthly_session_count, 0) <= 0 THEN 1
        WHEN t.fee_basis_type NOT IN ('monthly_by_weekly_schedule','monthly_by_total_sessions') THEN 1
        ELSE 0
      END) +
      (CASE WHEN COALESCE(t.minutes_per_lesson, 0) <= 0 THEN 1 ELSE 0 END) +
      (CASE WHEN TRIM(COALESCE(t.intro_short,'')) = '' AND TRIM(COALESCE(t.intro_long,'')) = ''
        THEN 1 ELSE 0 END) +
      (CASE WHEN TRIM(COALESCE(t.university_name,'')) = '' THEN 1 ELSE 0 END)
    ) = 0
    THEN 'A2_complete_but_need_publish'
    ELSE 'B_need_fields'
  END AS exposure_path,
  CASE WHEN NOT EXISTS (SELECT 1 FROM tutor_images i WHERE i.tutor_id = t.id)
    THEN 1 ELSE 0 END AS miss_image_for_publish
FROM tutors t
ORDER BY
  CASE
    WHEN t.profile_status = 'published' THEN 0
    ELSE 1
  END,
  t.id;

-- 버킷 집계
SELECT
  CASE
    WHEN miss_required_n = 0 AND profile_status = 'published' THEN 'A1_search_after_recompute'
    WHEN miss_required_n = 0 THEN 'A2_complete_but_need_publish'
    ELSE 'B_owner_enrich'
  END AS bucket,
  COUNT(*) AS n
FROM (
  SELECT
    t.profile_status,
    (
      (CASE WHEN TRIM(COALESCE(t.tutor_display_name,'')) = '' THEN 1 ELSE 0 END) +
      (CASE WHEN NOT EXISTS (
        SELECT 1 FROM tutor_regions tr WHERE tr.tutor_id = t.id AND tr.is_primary = 1
      ) THEN 1 ELSE 0 END) +
      (CASE WHEN TRIM(COALESCE(t.main_subject_note,'')) = ''
        AND NOT EXISTS (SELECT 1 FROM tutor_subject_targets s WHERE s.tutor_id = t.id LIMIT 1)
        THEN 1 ELSE 0 END) +
      (CASE WHEN NOT EXISTS (SELECT 1 FROM tutor_lesson_places p WHERE p.tutor_id = t.id)
        THEN 1 ELSE 0 END) +
      (CASE WHEN COALESCE(t.preferred_fee_amount, 0) <= 0 THEN 1 ELSE 0 END) +
      (CASE WHEN t.fee_basis_type NOT IN ('monthly_by_weekly_schedule','monthly_by_total_sessions')
        THEN 1 ELSE 0 END) +
      (CASE
        WHEN t.fee_basis_type = 'monthly_by_weekly_schedule' AND COALESCE(t.lessons_per_week, 0) <= 0 THEN 1
        WHEN t.fee_basis_type = 'monthly_by_total_sessions' AND COALESCE(t.monthly_session_count, 0) <= 0 THEN 1
        WHEN t.fee_basis_type NOT IN ('monthly_by_weekly_schedule','monthly_by_total_sessions') THEN 1
        ELSE 0
      END) +
      (CASE WHEN COALESCE(t.minutes_per_lesson, 0) <= 0 THEN 1 ELSE 0 END) +
      (CASE WHEN TRIM(COALESCE(t.intro_short,'')) = '' AND TRIM(COALESCE(t.intro_long,'')) = ''
        THEN 1 ELSE 0 END) +
      (CASE WHEN TRIM(COALESCE(t.university_name,'')) = '' THEN 1 ELSE 0 END)
    ) AS miss_required_n
  FROM tutors t
) x
GROUP BY bucket;
