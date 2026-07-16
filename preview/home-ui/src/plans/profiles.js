/**
 * 적용 프로필 목록 — 현재 역할의 등록 프로필
 * (역할 재선택 UI 없음 · 프로필만 선택)
 */

import { getStudyRooms } from '../study-room-reg/store.js';
import { getTutors } from '../tutor-reg/store.js';
import { getAuthUser } from '../auth-session.js';
import { getActiveRole } from '../state.js';

/**
 * @typedef {object} ProviderProfile
 * @property {string} id
 * @property {string} label
 * @property {'study_room'|'tutor'} providerType
 * @property {string} [status]
 */

/**
 * @param {'study_room'|'tutor'|'parent'|'guest'|string} role
 * @returns {ProviderProfile[]}
 */
export function listProviderProfiles(role) {
  if (role === 'study_room') {
    return getStudyRooms().map((r) => ({
      id: String(r.id),
      label: r.study_room_name || `공부방 #${r.id}`,
      providerType: 'study_room',
      status: r.profile_status || '',
    }));
  }
  if (role === 'tutor') {
    return getTutors().map((t) => ({
      id: String(t.id),
      label: t.tutor_display_name || `과외쌤 #${t.id}`,
      providerType: 'tutor',
      status: t.profile_status || '',
    }));
  }
  return [];
}

/**
 * 세션 역할 → 상품센터용 provider 역할
 * @returns {'study_room'|'tutor'|'guest'|'parent'}
 */
export function getPlansRole() {
  const user = getAuthUser();
  if (!user) return 'guest';
  if (user.role_type === 'study_room_owner') return 'study_room';
  if (user.role_type === 'tutor') return 'tutor';
  if (user.role_type === 'admin') return 'parent';
  return 'parent';
}

/**
 * @param {Record<string, string>} query
 * @param {'study_room'|'tutor'|'guest'|'parent'} role
 * @returns {ProviderProfile | null}
 */
export function resolveSelectedProfile(query, role) {
  const profiles = listProviderProfiles(role);
  if (!profiles.length) return null;
  const qType = query.provider_type;
  const qId = query.provider_id;
  if (qId) {
    const hit = profiles.find(
      (p) => p.id === String(qId) && (!qType || p.providerType === qType),
    );
    if (hit) return hit;
  }
  if (profiles.length === 1) return profiles[0];
  return null;
}

/** 미리보기 툴바 역할과 auth 불일치 시: 로그인 역할 우선, 비로그인은 툴바 공급자 역할 허용 */
export function getPlansEffectiveRole() {
  const authRole = getPlansRole();
  if (authRole === 'study_room' || authRole === 'tutor' || authRole === 'parent') {
    return authRole;
  }
  const active = getActiveRole();
  if (active === 'study_room' || active === 'tutor') return active;
  return 'guest';
}
