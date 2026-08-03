/**
 * 마이페이지 「내 등록」인페이지 수정 저장
 * — API 모드: /api/tutor/register.php 스텝 저장 후 캐시 갱신
 * — 프리뷰: sessionStorage 패치
 */

import {
  isRegistrationsApiMode,
  hydrateRegistrationsCache,
} from '../registrations-backend.js';
import { getTutor, updateTutor } from './store.js';

async function postRegisterSave(step, tutorId, payload) {
  const res = await fetch('/api/tutor/register.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ action: 'save', step, tutor_id: tutorId, payload }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.message || `저장 실패 (${res.status})`);
  }
  return data;
}

/**
 * @param {number} tutorId
 * @param {Record<string, unknown>} basic
 */
export async function saveTutorBasicInline(tutorId, basic) {
  const name = String(basic.tutor_display_name || '').trim();
  const subject = String(basic.main_subject_note || '').trim();
  const regionLabel = String(basic.primary_region_label || '').trim();
  if (!name) throw new Error('표시명을 입력해 주세요.');
  if (!subject) throw new Error('주력과목을 선택해 주세요.');
  if (!regionLabel) throw new Error('과외지역(시·도)을 선택해 주세요.');

  if (isRegistrationsApiMode()) {
    const current = getTutor(tutorId) || {};
    await postRegisterSave('basic', tutorId, {
      tutor_display_name: name,
      main_subject_note: subject,
      slogan: current.slogan || '',
      intro_short: current.intro_short || '',
      intro_long: current.intro_long || '',
      student_gender_group: current.student_gender_group || 'mixed',
      student_count_group: current.student_count_group || 'solo',
      age_band: current.age_band || '',
      gender: basic.gender || current.gender || 'male',
    });
    const slots = Array.isArray(basic.saved_regions) ? basic.saved_regions : null;
    if (slots?.length) {
      await postRegisterSave('regions', tutorId, {
        saved_regions: slots
          .filter((s) => s.region_id)
          .map((s) => ({
            region_id: String(s.region_id),
            scope_type: 'city',
            is_primary: !!s.is_primary,
          })),
      });
    } else {
      const regionId = basic.primary_region_id || current.primary_region_id || '';
      if (regionId) {
        await postRegisterSave('regions', tutorId, {
          saved_regions: [
            {
              region_id: String(regionId),
              scope_type: 'city',
              is_primary: true,
            },
          ],
        });
      }
    }
    await hydrateRegistrationsCache();
    return getTutor(tutorId);
  }

  return updateTutor(tutorId, {
    tutor_display_name: name,
    main_subject_note: subject,
    has_primary_subject: true,
    primary_region_label: regionLabel,
    location_label: regionLabel,
    has_primary_region: true,
    primary_region_id: basic.primary_region_id || undefined,
  });
}

/**
 * @param {number} tutorId
 * @param {Record<string, unknown>} detail
 */
export async function saveTutorDetailInline(tutorId, detail) {
  const current = getTutor(tutorId) || {};
  const subject = String(detail.main_subject_note || current.main_subject_note || '').trim();
  const fee = Number(detail.preferred_fee_amount || 0);
  const places = Array.isArray(detail.lesson_places) ? detail.lesson_places : [];
  if (!subject) throw new Error('주력과목이 없습니다. 기본등록에서 주력과목을 먼저 저장해 주세요.');
  if (!fee || fee <= 0) throw new Error('월 과외비를 입력해 주세요.');
  if (!places.length) throw new Error('강의장소를 1개 이상 선택해 주세요.');

  if (isRegistrationsApiMode()) {
    const current = getTutor(tutorId) || {};
    await postRegisterSave('lesson', tutorId, {
      main_subject_note: subject,
      student_gender_group: detail.student_gender_group || current.student_gender_group || 'mixed',
      student_count_group: detail.student_count_group || current.student_count_group || 'solo',
      age_band: detail.age_band || current.age_band || '',
      preferred_fee_amount: fee,
      fee_basis_type: detail.fee_basis_type || 'monthly_by_weekly_schedule',
      lessons_per_week: detail.lessons_per_week || current.lessons_per_week || '',
      monthly_session_count: detail.monthly_session_count || '',
      minutes_per_lesson: detail.minutes_per_lesson || current.minutes_per_lesson || '',
      fee_description: detail.fee_description || '',
      lesson_places: places,
      subjects: detail.subjects || [],
    });
    await postRegisterSave('career', tutorId, {
      university_name: detail.university_name || '',
      major_name: detail.major_name || '',
      university_status: detail.university_status || '',
      career_year_band: detail.career_year_band || '',
      feature_1: detail.feature_1 || '',
      feature_2: detail.feature_2 || '',
      main_material_note: detail.main_material_note || '',
      proof_document_available: !!detail.proof_document_available,
      teaching_style_badges: detail.teaching_style_badges || [],
    });
    await postRegisterSave('contact', tutorId, {
      contact_time_note: detail.contact_time_note || '',
      intro_short: detail.intro_short || '',
      intro_long: detail.intro_long || '',
      profile_status: detail.profile_status || current.profile_status || 'draft',
      youtube_url: detail.youtube_url || '',
      facebook_url: detail.facebook_url || '',
      instagram_url: detail.instagram_url || '',
    });
    await hydrateRegistrationsCache();
    return getTutor(tutorId);
  }

  return updateTutor(tutorId, {
    main_subject_note: subject,
    has_primary_subject: true,
    preferred_fee_amount: fee,
    fee_basis_type: detail.fee_basis_type || 'monthly_by_weekly_schedule',
    lessons_per_week: detail.lessons_per_week ? Number(detail.lessons_per_week) : undefined,
    minutes_per_lesson: detail.minutes_per_lesson ? Number(detail.minutes_per_lesson) : undefined,
    fee_description: String(detail.fee_description || ''),
    lesson_places: places,
    has_lesson_places: places.length > 0,
    student_gender_group: detail.student_gender_group || undefined,
    student_count_group: detail.student_count_group || undefined,
    university_name: String(detail.university_name || ''),
    major_name: String(detail.major_name || ''),
    university_status: String(detail.university_status || ''),
    feature_1: String(detail.feature_1 || ''),
    intro_short: String(detail.intro_short || ''),
    intro_long: String(detail.intro_long || ''),
    contact_time_note: String(detail.contact_time_note || ''),
    detail_completion_status: 'expanded_complete',
  });
}
