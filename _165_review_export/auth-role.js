/** 세션 role_type 스냅샷. state ↔ auth-session 순환을 피한다. */

/** @type {string} */
let roleType = '';

/** @param {string} next */
export function noteAuthRoleType(next) {
  roleType = String(next || '');
}

export function authRoleType() {
  return roleType;
}

export function isStudyRoomAuth() {
  return roleType === 'study_room_owner';
}
