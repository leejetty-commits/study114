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
    'P19-01': '마이프로필',
    'P19-02': '마이프로필',
    'P19-03a': '기본정보',
    'P19-03b': '상세정보',
    'P19-04': '마이프로필',
    'P19-05': '쪽지설정',
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

/**
 * 내 등록 상단 탭. 과외쌤 TUTOR_REG_TOP_TABS에서 등록점검(publish)만 뺀다.
 * publish URL은 파싱만 하고 마이프로필로 보낸다.
 */
export const STUDENT_REG_TOP_TABS = [
  { key: 'hub', label: '마이프로필' },
  { key: 'basic', label: '기본정보' },
  { key: 'detail', label: '상세정보' },
  { key: 'settings', label: '쪽지설정' },
];

/** @deprecated 좌측 메뉴. 상단 탭(STUDENT_REG_TOP_TABS)을 쓴다. */
export const STUDENT_REG_MENUS = [
  { key: 'basic', label: '기본정보', screenId: 'P19-03a' },
  { key: 'detail', label: '상세정보', screenId: 'P19-03b' },
  { key: 'settings', label: '쪽지설정', screenId: 'P19-05' },
];

/** 목록·탭·미리보기(공개) — 마이프로필로 보내는 구 경로 */
export function isStudentLegacyEntryPath(hashPath) {
  const route = parseStudentRegPath(hashPath);
  if (!route) return false;
  return route.screenId === 'P19-01' || route.screenId === 'P19-04';
}
