/** 20장 P20-xx — hash 경로 (부록 A · P20-05 inquiries) */

/** @typedef {'P20-01'|'P20-02'|'P20-03a'|'P20-03b'|'P20-03c'|'P20-04'|'P20-05'|'P20-06'|'P23-04'} StudyRoomRegScreenId */

/**
 * @typedef {object} StudyRoomRegRoute
 * @property {StudyRoomRegScreenId} screenId
 * @property {number} [roomId]
 * @property {'all'|'draft'|'published'|'hidden'|'not_ready'} [listTab]
 * @property {'hub'|'basic'|'detail'|'detail2'|'publish'|'inquiries'|'submission'} [section]
 */

export const BASE = '/mypage/registrations/study-rooms';

/** hash path에서 query 제거 (예: `?from=review`) */
export function stripHashQuery(hashPath) {
  const raw = hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
  return raw.split('?')[0];
}

/**
 * @param {string} hashPath
 * @returns {StudyRoomRegRoute | null}
 */
export function parseStudyRoomRegPath(hashPath) {
  const p = stripHashQuery(hashPath);
  if (p === BASE) return { screenId: 'P20-01', listTab: 'all' };

  const tabMatch = p.match(/^\/mypage\/registrations\/study-rooms\/tab\/(all|draft|published|hidden|not_ready)$/);
  if (tabMatch) {
    return { screenId: 'P20-01', listTab: /** @type {any} */ (tabMatch[1]) };
  }

  const hubMatch = p.match(/^\/mypage\/registrations\/study-rooms\/(\d+)$/);
  if (hubMatch) {
    return { screenId: 'P20-02', roomId: Number(hubMatch[1]), section: 'hub' };
  }

  const sectionMatch = p.match(
    /^\/mypage\/registrations\/study-rooms\/(\d+)\/(basic|detail2|detail|publish|inquiries|exposure|submission)$/,
  );
  if (sectionMatch) {
    const roomId = Number(sectionMatch[1]);
    const rawSec = sectionMatch[2];
    const sec = rawSec === 'exposure' ? 'inquiries' : rawSec;
    const map = {
      basic: 'P20-03a',
      detail: 'P20-03b',
      detail2: 'P20-03c',
      publish: 'P20-04',
      inquiries: 'P20-05',
      submission: 'P23-04',
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

/** 레거시 exposure → inquiries 리다이렉트 대상 */
export function studyRoomLegacyExposureRedirect(hashPath) {
  const p = stripHashQuery(hashPath);
  const m = p.match(/^(\/mypage\/registrations\/study-rooms\/\d+)\/exposure$/);
  if (!m) return null;
  return `${m[1]}/inquiries`;
}

/** @param {StudyRoomRegScreenId} screenId */
export function studyRoomRegScreenTitle(screenId) {
  const map = {
    'P20-01': '공부방 목록',
    'P20-02': '내 등록',
    'P20-03a': '기본정보',
    'P20-03b': '상세정보1',
    'P20-03c': '상세정보2',
    'P20-04': '미리보기·공개',
    'P20-05': '쪽지와 문의',
    'P20-06': '숨김·삭제',
    'P23-04': '제출함',
  };
  return map[screenId] || '공부방';
}

/** @param {number} id */
export function studyRoomHubPath(id) {
  return `${BASE}/${id}`;
}

/** @param {number} id @param {'basic'|'detail'|'detail2'|'publish'|'inquiries'|'submission'} section */
export function studyRoomSectionPath(id, section) {
  return `${BASE}/${id}/${section}`;
}

/** @param {'all'|'draft'|'published'|'hidden'|'not_ready'} tab */
export function studyRoomListTabPath(tab) {
  return tab === 'all' ? BASE : `${BASE}/tab/${tab}`;
}

/** 바디 상단 가로 탭 — 필/라운드 박스 금지, 밑줄형 */
export const STUDY_ROOM_TOP_TABS = [
  { key: 'hub', label: '운영홈' },
  { key: 'basic', label: '기본정보' },
  { key: 'detail', label: '상세정보1' },
  { key: 'detail2', label: '상세정보2' },
  { key: 'publish', label: '미리보기·공개' },
  { key: 'inquiries', label: '쪽지와 문의' },
];

/** @deprecated STUDY_ROOM_TOP_TABS 사용 */
export const STUDY_ROOM_REG_MENUS = STUDY_ROOM_TOP_TABS.filter((t) => t.key !== 'hub' && t.key !== 'submission').map(
  (t) => ({
    key: t.key,
    label: t.label,
    screenId:
      t.key === 'basic'
        ? 'P20-03a'
        : t.key === 'detail'
          ? 'P20-03b'
          : t.key === 'detail2'
            ? 'P20-03c'
            : t.key === 'publish'
              ? 'P20-04'
              : 'P20-05',
  }),
);
