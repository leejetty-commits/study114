/**
 * 마지막 로그인 역할 힌트. 세션 확인 전에 게스트 지도를 그릴지 판단하는 데만 쓴다.
 * 역할 문자열만 둔다. 토큰·이메일·아이디는 넣지 않는다.
 */

const KEY = 'study114.last-role';

const ROLES = new Set(['tutor', 'study_room_owner', 'guardian_student', 'admin']);

/** @returns {'tutor'|'study_room_owner'|'guardian_student'|'admin'|''} */
export function readLastRoleHint() {
  try {
    const value = localStorage.getItem(KEY);
    return ROLES.has(value) ? value : '';
  } catch {
    return '';
  }
}

/** @param {string} role */
export function noteLastRole(role) {
  if (!ROLES.has(role)) return;
  try {
    localStorage.setItem(KEY, role);
  } catch {
    /* private mode */
  }
}

export function clearLastRole() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
