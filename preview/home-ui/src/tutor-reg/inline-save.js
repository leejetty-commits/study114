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
import { tutorBasicMissing, tutorBasicMissingMessage } from '../../../shared/tutor-basic-fields.js';

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
 * 기본정보(베이직카드 항목) 저장. 과외지역은 basic.saved_regions 가 있을 때만 같이 보낸다.
 * @param {number} tutorId
 * @param {Record<string, unknown>} basic
 */
export async function saveTutorBasicInline(tutorId, basic) {
  const current = getTutor(tutorId) || {};
  const hasRegions = Array.isArray(basic.saved_regions);
  const slots = hasRegions
    ? basic.saved_regions.filter((s) => /^[1-9]\d*$/.test(String(s.region_id || '')))
    : [];
  const regionLabel = String(basic.primary_region_label || '').trim();
  const values = {
    tutor_display_name: String(basic.tutor_display_name || '').trim(),
    has_primary_region: hasRegions
      ? slots.length > 0 && regionLabel !== ''
      : !!(current.has_primary_region && String(current.primary_region_label || '').trim()),
    school_level: String(basic.school_level || ''),
    main_subject_note: String(basic.main_subject_note || '').trim(),
    preferred_fee_amount: basic.preferred_fee_amount,
    lessons_per_week: String(basic.lessons_per_week || ''),
    minutes_per_lesson: String(basic.minutes_per_lesson || ''),
    lesson_places: Array.isArray(basic.lesson_places) ? basic.lesson_places.map(String) : [],
    student_gender_group: String(basic.student_gender_group || ''),
    student_count_group: String(basic.student_count_group || ''),
    feature_1: String(basic.feature_1 || '').trim(),
    slogan: String(basic.slogan || '').trim(),
    has_profile_image: !!current.has_profile_image,
  };
  const missing = tutorBasicMissing(values);
  if (missing.length) throw new Error(tutorBasicMissingMessage(missing));

  if (isRegistrationsApiMode()) {
    const payload = {
      tutor_display_name: values.tutor_display_name,
      school_level: values.school_level,
      main_subject_note: values.main_subject_note,
      preferred_fee_amount: values.preferred_fee_amount,
      lessons_per_week: values.lessons_per_week,
      minutes_per_lesson: values.minutes_per_lesson,
      lesson_places: values.lesson_places,
      student_gender_group: values.student_gender_group,
      student_count_group: values.student_count_group,
      feature_1: values.feature_1,
      slogan: values.slogan,
    };
    if (hasRegions) {
      payload.saved_regions = slots.map((s) => ({
        region_id: String(s.region_id),
        scope_type: 'city',
        is_primary: !!s.is_primary,
      }));
    }
    await postRegisterSave('basic', tutorId, payload);
    await hydrateRegistrationsCache();
    return getTutor(tutorId);
  }

  const patch = {
    tutor_display_name: values.tutor_display_name,
    school_level: values.school_level,
    main_subject_note: values.main_subject_note,
    has_primary_subject: true,
    preferred_fee_amount: Number(values.preferred_fee_amount),
    lessons_per_week: Number(values.lessons_per_week),
    minutes_per_lesson: Number(values.minutes_per_lesson),
    lesson_places: values.lesson_places,
    has_lesson_places: true,
    student_gender_group: values.student_gender_group,
    student_count_group: values.student_count_group,
    feature_1: values.feature_1,
    slogan: values.slogan,
  };
  if (hasRegions) {
    Object.assign(patch, {
      primary_region_label: regionLabel,
      location_label: regionLabel,
      has_primary_region: true,
      primary_region_id: basic.primary_region_id || undefined,
      saved_regions: basic.saved_regions,
    });
  }
  return updateTutor(tutorId, patch);
}

/**
 * 상세정보 저장. 기본정보 항목은 saveTutorBasicInline 만 저장한다.
 * @param {number} tutorId
 * @param {Record<string, unknown>} detail
 */
export async function saveTutorDetailInline(tutorId, detail) {
  const feeBasis = String(detail.fee_basis_type || '');
  const monthlySessions = Number(detail.monthly_session_count || 0);
  const university = String(detail.university_name || '').trim();
  const introShort = String(detail.intro_short || '').trim();
  const introLong = String(detail.intro_long || '').trim();

  if (!feeBasis) throw new Error('산정방식을 선택해 주세요.');
  if (feeBasis === 'monthly_by_total_sessions' && (!monthlySessions || monthlySessions <= 0)) {
    throw new Error('월 총 횟수를 입력해 주세요.');
  }
  if (!university) throw new Error('대학/대학원을 입력해 주세요.');
  if (!introShort && !introLong) throw new Error('소개문을 입력해 주세요.');

  if (isRegistrationsApiMode()) {
    await postRegisterSave('lesson', tutorId, {
      fee_basis_type: feeBasis,
      monthly_session_count: detail.monthly_session_count || '',
      fee_description: detail.fee_description || '',
    });
    await postRegisterSave('career', tutorId, {
      university_name: university,
      major_name: detail.major_name || '',
      university_status: detail.university_status || '',
      feature_2: detail.feature_2 || '',
      feature_3: detail.feature_3 || '',
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
    fee_basis_type: feeBasis,
    monthly_session_count: monthlySessions || undefined,
    fee_description: String(detail.fee_description || ''),
    university_name: university,
    major_name: String(detail.major_name || ''),
    university_status: String(detail.university_status || ''),
    feature_2: String(detail.feature_2 || ''),
    feature_3: String(detail.feature_3 || ''),
    intro_short: introShort,
    intro_long: introLong,
    contact_time_note: String(detail.contact_time_note || ''),
    // 프리뷰만: 서버 SSOT와 동일한 필드 충족 시에만 complete
    detail_completion_status: 'expanded_complete',
    detail_missing: [],
  });
}
