/** 19장 P19-xx — hash 경로 (부록 A) */

/** @typedef {'P19-01'|'P19-02'|'P19-03a'|'P19-03b'|'P19-04'|'P19-05'|'P19-06'} StudentRegScreenId */

/**
 * @typedef {object} StudentRegRoute
 * @property {StudentRegScreenId} screenId
 * @property {number} [studentId]
 * @property {'all'|'draft'|'published'|'hidden'} [listTab]
 * @property {'hub'|'basic'|'detail'|'publish'|'settings'} [section]
 */

const BASE = '/mypage/registrations/students';

/**
 * @param {string} hashPath
 * @returns {StudentRegRoute | null}
 */
export function parseStudentRegPath(hashPath) {
  const p = hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
  if (p === BASE) return { screenId: 'P19-01', listTab: 'all' };
  const tabMatch = p.match(/^\/mypage\/registrations\/students\/tab\/(all|draft|published|hidden)$/);
  if (tabMatch) return { screenId: 'P19-01', listTab: /** @type {any} */ (tabMatch[1]) };

  const hubMatch = p.match(/^\/mypage\/registrations\/students\/(\d+)$/);
  if (hubMatch) {
    return { screenId: 'P19-02', studentId: Number(hubMatch[1]), section: 'hub' };
  }

  const sectionMatch = p.match(/^\/mypage\/registrations\/students\/(\d+)\/(basic|detail|publish|settings)$/);
  if (sectionMatch) {
    const studentId = Number(sectionMatch[1]);
    const sec = sectionMatch[2];
    const map = {
      basic: 'P19-03a',
      detail: 'P19-03b',
      publish: 'P19-04',
      settings: 'P19-05',
    };
    return {
      screenId: /** @type {StudentRegScreenId} */ (map[sec]),
      studentId,
      section: /** @type {any} */ (sec),
    };
  }

  return null;
}

/** @param {string} hashPath */
export function isStudentRegPath(hashPath) {
  return parseStudentRegPath(hashPath) != null;
}

/** @param {StudentRegScreenId} screenId */
export function studentRegScreenTitle(screenId) {
  const map = {
    'P19-01': '자녀(학생) 목록',
    'P19-02': '자녀 관리',
    'P19-03a': '기본등록',
    'P19-03b': '상세등록',
    'P19-04': '미리보기·공개',
    'P19-05': '공개설정',
    'P19-06': '숨김·삭제',
  };
  return map[screenId] || '학생 의뢰 관리';
}

/** @param {number} id */
export function studentHubPath(id) {
  return `${BASE}/${id}`;
}

/** @param {number} id @param {'basic'|'detail'|'publish'|'settings'} section */
export function studentSectionPath(id, section) {
  return `${BASE}/${id}/${section}`;
}

/** @param {'all'|'draft'|'published'|'hidden'} tab */
export function studentListTabPath(tab) {
  return tab === 'all' ? BASE : `${BASE}/tab/${tab}`;
}

export const STUDENT_REG_MENUS = [
  { key: 'basic', label: '기본등록', screenId: 'P19-03a' },
  { key: 'detail', label: '상세등록', screenId: 'P19-03b' },
  { key: 'settings', label: '공개설정', screenId: 'P19-05' },
  { key: 'publish', label: '미리보기', screenId: 'P19-04' },
];
