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
    slogan: String(basic.slogan || '').trim(),
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
