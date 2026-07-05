/** 20장 P20-xx — hash 경로 (부록 A) */

/** @typedef {'P20-01'|'P20-02'|'P20-03a'|'P20-03b'|'P20-04'|'P20-05'|'P20-06'} StudyRoomRegScreenId */

/**
 * @typedef {object} StudyRoomRegRoute
 * @property {StudyRoomRegScreenId} screenId
 * @property {number} [roomId]
 * @property {'all'|'draft'|'published'|'hidden'|'not_ready'} [listTab]
 * @property {'hub'|'basic'|'detail'|'publish'|'exposure'} [section]
 */

export const BASE = '/mypage/registrations/study-rooms';

/**
 * @param {string} hashPath
 * @returns {StudyRoomRegRoute | null}
 */
export function parseStudyRoomRegPath(hashPath) {
  const p = hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
  if (p === BASE) return { screenId: 'P20-01', listTab: 'all' };

  const tabMatch = p.match(/^\/mypage\/registrations\/study-rooms\/tab\/(all|draft|published|hidden|not_ready)$/);
  if (tabMatch) {
    return { screenId: 'P20-01', listTab: /** @type {any} */ (tabMatch[1]) };
  }

  const hubMatch = p.match(/^\/mypage\/registrations\/study-rooms\/(\d+)$/);
  if (hubMatch) {
    return { screenId: 'P20-02', roomId: Number(hubMatch[1]), section: 'hub' };
  }

  const sectionMatch = p.match(/^\/mypage\/registrations\/study-rooms\/(\d+)\/(basic|detail|publish|exposure)$/);
  if (sectionMatch) {
    const roomId = Number(sectionMatch[1]);
    const sec = sectionMatch[2];
    const map = {
      basic: 'P20-03a',
      detail: 'P20-03b',
      publish: 'P20-04',
      exposure: 'P20-05',
    };
    return {
      screenId: /** @type {StudyRoomRegScreenId} */ (map[sec]),
      roomId,
      section: /** @type {any} */ (sec),
    };
  }

  return null;
}

/** @param {string} hashPath */
export function isStudyRoomRegPath(hashPath) {
  return parseStudyRoomRegPath(hashPath) != null;
}

/** @param {StudyRoomRegScreenId} screenId */
export function studyRoomRegScreenTitle(screenId) {
  const map = {
    'P20-01': '공부방 목록',
    'P20-02': '공부방 운영',
    'P20-03a': '기본정보',
    'P20-03b': '상세정보',
    'P20-04': '미리보기·공개',
    'P20-05': '노출·상담',
    'P20-06': '숨김·삭제',
  };
  return map[screenId] || '공부방 운영 관리';
}

/** @param {number} id */
export function studyRoomHubPath(id) {
  return `${BASE}/${id}`;
}

/** @param {number} id @param {'basic'|'detail'|'publish'|'exposure'} section */
export function studyRoomSectionPath(id, section) {
  return `${BASE}/${id}/${section}`;
}

/** @param {'all'|'draft'|'published'|'hidden'|'not_ready'} tab */
export function studyRoomListTabPath(tab) {
  return tab === 'all' ? BASE : `${BASE}/tab/${tab}`;
}

export const STUDY_ROOM_REG_MENUS = [
  { key: 'basic', label: '기본정보', screenId: 'P20-03a' },
  { key: 'detail', label: '상세정보', screenId: 'P20-03b' },
  { key: 'publish', label: '미리보기·공개', screenId: 'P20-04' },
  { key: 'exposure', label: '노출·상담', screenId: 'P20-05' },
];
