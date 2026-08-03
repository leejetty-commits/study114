/**
 * 마이페이지 공부방 「내 등록」인페이지 수정 저장
 */

import {
  isRegistrationsApiMode,
  hydrateRegistrationsCache,
} from '../registrations-backend.js';
import { getStudyRoom, updateStudyRoom } from './store.js';

async function postRegisterSave(step, roomId, payload) {
  const res = await fetch('/api/study-room/register.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ action: 'save', step, study_room_id: roomId, payload }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.message || `저장 실패 (${res.status})`);
  }
  return data;
}

/**
 * @param {number} roomId
 * @param {Record<string, unknown>} basic
 */
export async function saveStudyRoomBasicInline(roomId, basic) {
  const name = String(basic.study_room_name || '').trim();
  const subject = String(basic.main_subject_note || '').trim();
  const region = String(basic.region_label || '').trim();
  if (!name) throw new Error('공부방명을 입력해 주세요.');
  if (!subject) throw new Error('주력과목을 선택해 주세요.');
  if (!region) throw new Error('노출지역을 입력해 주세요.');

  if (isRegistrationsApiMode()) {
    await postRegisterSave('basic', roomId, {
      study_room_name: name,
      main_subject_note: subject,
      region_label: region,
      region_id: basic.region_id || undefined,
    });
    await hydrateRegistrationsCache();
    return getStudyRoom(roomId);
  }

  return updateStudyRoom(roomId, {
    study_room_name: name,
    main_subject_note: subject,
    region_label: region,
    has_regions: true,
    has_subject_targets: true,
  });
}

/**
 * @param {number} roomId
 * @param {Record<string, unknown>} detail
 */
export async function saveStudyRoomDetailInline(roomId, detail) {
  const subject = String(detail.main_subject_note || '').trim();
  const price = Number(detail.price_amount || 0);
  if (!subject) throw new Error('주력과목을 선택해 주세요.');
  if (!price || price <= 0) throw new Error('월 대표 가격을 입력해 주세요.');

  if (isRegistrationsApiMode()) {
    await postRegisterSave('lesson', roomId, {
      main_subject_note: subject,
      price_amount: price,
      intro_short: detail.intro_short || '',
      intro_long: detail.intro_long || '',
      slogan: detail.slogan || '',
      feature_1: detail.feature_1 || '',
      facility_summary: detail.facility_summary || '',
      capacity_per_time: detail.capacity_per_time || '',
      weekend_available: !!detail.weekend_available,
      one_on_one_available: !!detail.one_on_one_available,
    });
    await hydrateRegistrationsCache();
    return getStudyRoom(roomId);
  }

  return updateStudyRoom(roomId, {
    main_subject_note: subject,
    has_subject_targets: true,
    price_amount: price,
    intro_short: String(detail.intro_short || ''),
    intro_long: String(detail.intro_long || ''),
    slogan: String(detail.slogan || ''),
    feature_1: String(detail.feature_1 || ''),
    facility_summary: String(detail.facility_summary || ''),
    capacity_per_time: String(detail.capacity_per_time || ''),
    weekend_available: !!detail.weekend_available,
    one_on_one_available: !!detail.one_on_one_available,
    detail_completion_status: 'expanded_complete',
    contact_method_set: true,
    lesson_place_set: true,
  });
}
