-- =============================================================================
-- 운영 A/B 분리 — phpMyAdmin 「SQL」탭용 (Import 금지 · 읽기 전용)
-- 좌측 study114 선택 후, 아래만 복사 → 실행
-- =============================================================================

SELECT
  t.id,
  t.tutor_display_name AS name,
  t.profile_status,
  t.detail_completion_status AS status_now,
  t.university_name,
  t.preferred_fee_amount AS fee,
  t.fee_basis_type,
  t.lessons_per_week,
  t.monthly_session_count,
  t.minutes_per_lesson,
  CASE WHEN TRIM(COALESCE(t.intro_short,'')) = '' AND TRIM(COALESCE(t.intro_long,'')) = ''
    THEN 1 ELSE 0 END AS miss_intro,
  CASE WHEN TRIM(COALESCE(t.university_name,'')) = '' THEN 1 ELSE 0 END AS miss_univ,
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
  CASE WHEN NOT EXISTS (
    SELECT 1 FROM tutor_regions tr WHERE tr.tutor_id = t.id AND tr.is_primary = 1
  ) THEN 1 ELSE 0 END AS miss_region,
  CASE WHEN TRIM(COALESCE(t.main_subject_note,'')) = ''
    AND NOT EXISTS (SELECT 1 FROM tutor_subject_targets s WHERE s.tutor_id = t.id LIMIT 1)
    THEN 1 ELSE 0 END AS miss_subject,
  CASE WHEN NOT EXISTS (SELECT 1 FROM tutor_lesson_places p WHERE p.tutor_id = t.id)
    THEN 1 ELSE 0 END AS miss_places,
  CASE WHEN NOT EXISTS (SELECT 1 FROM tutor_images i WHERE i.tutor_id = t.id)
    THEN 1 ELSE 0 END AS miss_image
FROM tutors t
ORDER BY t.id;
