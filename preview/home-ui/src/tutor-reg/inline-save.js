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
    if (res.status === 401) {
      throw new Error(data.message || '로그인이 만료되었습니다. 과외쌤 계정으로 다시 로그인해 주세요.');
    }
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
    const slots = Array.isArray(basic.saved_regions)
      ? basic.saved_regions.filter((s) => /^\d+$/.test(String(s.region_id || '')))
      : null;
    if (slots?.length) {
      await postRegisterSave('regions', tutorId, {
        saved_regions: slots.map((s) => ({
          region_id: String(s.region_id),
          scope_type: 'city',
          is_primary: !!s.is_primary,
        })),
      });
    } else {
      throw new Error('과외지역을 1곳 이상 선택해 주세요. (도는 시까지 선택)');
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
    saved_regions: Array.isArray(basic.saved_regions) ? basic.saved_regions : undefined,
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
  const feeBasis = String(detail.fee_basis_type || current.fee_basis_type || 'monthly_by_weekly_schedule');
  const minutes = Number(detail.minutes_per_lesson || current.minutes_per_lesson || 0);
  const lessonsPerWeek = Number(detail.lessons_per_week || current.lessons_per_week || 0);
  const monthlySessions = Number(detail.monthly_session_count || current.monthly_session_count || 0);
  const university = String(detail.university_name || '').trim();
  const introShort = String(detail.intro_short || '').trim();
  const introLong = String(detail.intro_long || '').trim();

  if (!subject) throw new Error('주력과목이 없습니다. 기본등록에서 주력과목을 먼저 저장해 주세요.');
  if (!fee || fee <= 0) throw new Error('월 과외비를 입력해 주세요.');
  if (!places.length) throw new Error('강의장소를 1개 이상 선택해 주세요.');
  if (!minutes || minutes <= 0) throw new Error('1회 수업 시간을 입력해 주세요.');
  if (feeBasis === 'monthly_by_weekly_schedule' && (!lessonsPerWeek || lessonsPerWeek <= 0)) {
    throw new Error('주 횟수를 입력해 주세요.');
  }
  if (feeBasis === 'monthly_by_total_sessions' && (!monthlySessions || monthlySessions <= 0)) {
    throw new Error('월 총 횟수를 입력해 주세요.');
  }
  if (!university) throw new Error('학교명을 입력해 주세요.');
  if (!introShort && !introLong) throw new Error('소개문을 입력해 주세요.');

  if (isRegistrationsApiMode()) {
    await postRegisterSave('lesson', tutorId, {
      main_subject_note: subject,
      student_gender_group: detail.student_gender_group || current.student_gender_group || 'mixed',
      student_count_group: detail.student_count_group || current.student_count_group || 'solo',
      age_band: detail.age_band || current.age_band || '',
      preferred_fee_amount: fee,
      fee_basis_type: feeBasis,
      lessons_per_week: detail.lessons_per_week || current.lessons_per_week || '',
      monthly_session_count: detail.monthly_session_count || '',
      minutes_per_lesson: minutes,
      fee_description: detail.fee_description || '',
      lesson_places: places,
      subjects: detail.subjects || [],
    });
    await postRegisterSave('career', tutorId, {
      university_name: university,
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
      intro_short: introShort || detail.intro_short || '',
      intro_long: introLong || detail.intro_long || '',
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
    fee_basis_type: feeBasis,
    lessons_per_week: lessonsPerWeek || undefined,
    monthly_session_count: monthlySessions || undefined,
    minutes_per_lesson: minutes,
    fee_description: String(detail.fee_description || ''),
    lesson_places: places,
    has_lesson_places: places.length > 0,
    student_gender_group: detail.student_gender_group || undefined,
    student_count_group: detail.student_count_group || undefined,
    university_name: university,
    major_name: String(detail.major_name || ''),
    university_status: String(detail.university_status || ''),
    feature_1: String(detail.feature_1 || ''),
    intro_short: introShort,
    intro_long: introLong,
    contact_time_note: String(detail.contact_time_note || ''),
    // 프리뷰만: 서버 SSOT와 동일한 필드 충족 시에만 complete
    detail_completion_status: 'expanded_complete',
    detail_missing: [],
  });
}
