/**
 * 홍보 랜딩 카탈로그 — 운영 바로가기·배너 연결 SSOT
 * 고객센터/자료실이 아닌 #/promo/* 네임스페이스
 */

/** @typedef {{
 *   id: string;
 *   path: string;
 *   title: string;
 *   audience: string;
 *   status: 'live'|'draft'|'planned';
 *   railHint: string;
 *   shareText: string;
 * }} PromoLanding */

/** @type {PromoLanding[]} */
export const PROMO_LANDINGS = [
  {
    id: 'study-room',
    path: '/promo/study-room',
    title: '공부방 카달로그',
    audience: '학부모 · 원장',
    status: 'live',
    railHint: '홈/검색 우측 CTA · 게스트 본문 인라인',
    shareText: '우리동네 공부방, 더 쉽게 찾고 비교해보세요 — 우동공과',
  },
  {
    id: 'tutor',
    path: '/promo/tutor',
    title: '과외쌤 카달로그',
    audience: '과외쌤',
    status: 'live',
    railHint: '과외쌤 우측 소개',
    shareText: '과외지역과 주력 과목으로, 프로필을 분명하게 보여 주세요 — 우동공과',
  },
  {
    id: 'parent',
    path: '/promo/parent',
    title: '학생 카달로그',
    audience: '학생 · 학부모(보조)',
    status: 'live',
    railHint: '학생 우측 소개',
    shareText: '우리동네 공부방·과외, 기준으로 비교하고 쪽지로 시작하세요 — 우동공과',
  },
];

export function listLivePromoLandings() {
  return PROMO_LANDINGS.filter((p) => p.status === 'live');
}

export function getPromoLanding(id) {
  return PROMO_LANDINGS.find((p) => p.id === id) || null;
}

export function getPromoLandingByPath(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return PROMO_LANDINGS.find((row) => row.path === p.split('?')[0]) || null;
}
