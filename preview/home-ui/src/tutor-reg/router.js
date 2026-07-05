/** 21장 P21-xx — hash 경로 (부록 A) */

/** @typedef {'P21-01'|'P21-02'|'P21-03a'|'P21-03b'|'P21-04'|'P21-05'|'P21-06'|'P21-07'} TutorRegScreenId */

/**
 * @typedef {object} TutorRegRoute
 * @property {TutorRegScreenId} screenId
 * @property {number} [tutorId]
 * @property {'all'|'draft'|'published'|'hidden'|'not_ready'} [listTab]
 * @property {'hub'|'basic'|'detail'|'publish'|'access'|'exposure'} [section]
 */

export const BASE = '/mypage/registrations/tutors';

/**
 * @param {string} hashPath
 * @returns {TutorRegRoute | null}
 */
export function parseTutorRegPath(hashPath) {
  const p = hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
  if (p === BASE) return { screenId: 'P21-01', listTab: 'all' };

  const tabMatch = p.match(/^\/mypage\/registrations\/tutors\/tab\/(all|draft|published|hidden|not_ready)$/);
  if (tabMatch) {
    return { screenId: 'P21-01', listTab: /** @type {any} */ (tabMatch[1]) };
  }

  const hubMatch = p.match(/^\/mypage\/registrations\/tutors\/(\d+)$/);
  if (hubMatch) {
    return { screenId: 'P21-02', tutorId: Number(hubMatch[1]), section: 'hub' };
  }

  const sectionMatch = p.match(/^\/mypage\/registrations\/tutors\/(\d+)\/(basic|detail|publish|access|exposure)$/);
  if (sectionMatch) {
    const tutorId = Number(sectionMatch[1]);
    const sec = sectionMatch[2];
    const map = {
      basic: 'P21-03a',
      detail: 'P21-03b',
      publish: 'P21-04',
      access: 'P21-05',
      exposure: 'P21-06',
    };
    return {
      screenId: /** @type {TutorRegScreenId} */ (map[sec]),
      tutorId,
      section: /** @type {any} */ (sec),
    };
  }

  return null;
}

/** @param {string} hashPath */
export function isTutorRegPath(hashPath) {
  return parseTutorRegPath(hashPath) != null;
}

/** @param {TutorRegScreenId} screenId */
export function tutorRegScreenTitle(screenId) {
  const map = {
    'P21-01': '과외 프로필 목록',
    'P21-02': '과외쌤 운영',
    'P21-03a': '기본정보',
    'P21-03b': '상세정보',
    'P21-04': '미리보기·공개',
    'P21-05': '학생 접근·쪽지',
    'P21-06': '노출·부oost',
    'P21-07': '숨김·삭제',
  };
  return map[screenId] || '과외쌤 운영 관리';
}

/** @param {number} id */
export function tutorHubPath(id) {
  return `${BASE}/${id}`;
}

/** @param {number} id @param {'basic'|'detail'|'publish'|'access'|'exposure'} section */
export function tutorSectionPath(id, section) {
  return `${BASE}/${id}/${section}`;
}

/** @param {'all'|'draft'|'published'|'hidden'|'not_ready'} tab */
export function tutorListTabPath(tab) {
  return tab === 'all' ? BASE : `${BASE}/tab/${tab}`;
}

/** 21장 §3-1 — reg-mgmt 메뉴 순서 */
export const TUTOR_REG_MENUS = [
  { key: 'access', label: '학생 접근·쪽지', screenId: 'P21-05' },
  { key: 'publish', label: '미리보기·공개', screenId: 'P21-04' },
  { key: 'basic', label: '기본정보', screenId: 'P21-03a' },
  { key: 'detail', label: '상세정보', screenId: 'P21-03b' },
  { key: 'exposure', label: '노출·부oost', screenId: 'P21-06' },
];
