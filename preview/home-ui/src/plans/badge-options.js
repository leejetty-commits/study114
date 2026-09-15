/**
 * 노출상품 종속 홍보 배지 — 허용 집합은 card-visual / PaidBadgeResolver 와 동일.
 * 가격은 PaidCatalog(badgePriceKrw)만 사용. 프론트 금액 하드코딩 금지.
 * access(쪽지권)는 이 모듈을 import 하지 않는다.
 */

import { CARD_VISUAL_POLICY, PAID_BADGE_LABELS, normalizePaidBadgeCode } from '../card-visual.js';
import { badgePriceKrw, formatKrw, getCatalogByFamily } from './runtime-config.js';

const BADGE_DESC = Object.freeze({
  hot: '지금 눈에 띄게 하는 광고 표현',
  subject_track: '특정 과목 중심 운영 강조',
  jjokjipge: '핵심 대비 이미지',
  sky: '학교정보 기반 광고 표현이며 학교·학력 인증이 아님',
});

/** @param {'study_room'|'tutor'|string} role */
export function allowedBadgeCodes(role) {
  if (role === 'tutor') return [...CARD_VISUAL_POLICY.paidTutor];
  if (role === 'study_room') return [...CARD_VISUAL_POLICY.paidStudyRoom];
  return [];
}

/**
 * @param {'study_room'|'tutor'|string} role
 * @param {string[]} raw
 * @returns {string[]}
 */
export function sanitizeBadgeCodes(role, raw) {
  const seen = new Set();
  const out = [];
  for (const item of raw || []) {
    const code = normalizePaidBadgeCode(item, role === 'tutor' ? 'tutor' : 'study_room');
    if (!code || seen.has(code)) continue;
    seen.add(code);
    out.push(code);
    if (out.length >= 2) break;
  }
  return out;
}

/**
 * @param {Record<string, string>} query
 * @param {'study_room'|'tutor'|string} role
 */
export function applyBadgeQuery(query, role) {
  const next = { ...query };
  const codes = sanitizeBadgeCodes(role, String(next.badges || '').split(','));
  if (codes.length) next.badges = codes.join(',');
  else delete next.badges;
  return next;
}

/** @param {string} code */
export function badgeDisplayName(code) {
  return PAID_BADGE_LABELS[code] || code;
}

/**
 * @param {'study_room'|'tutor'|string} role
 * @param {string} periodLabel
 */
export function listBadgeOptions(role, periodLabel) {
  const providerType = role === 'tutor' ? 'tutor' : 'study_room';
  const allowed = allowedBadgeCodes(role);
  const catalog = getCatalogByFamily('badge_addon', providerType);
  const catalogCodes = catalog.map((p) => p.productCode).filter((c) => allowed.includes(c));
  const codes = catalogCodes.length ? catalogCodes : allowed;
  const price = badgePriceKrw(providerType, undefined, 'hot', periodLabel);
  const priceLine = price != null ? `${periodLabel} · ${formatKrw(price)}` : '가격표 로드 후 표시';
  return codes.map((id) => ({
    id,
    name: badgeDisplayName(id),
    desc: BADGE_DESC[id] || '',
    priceLine,
    priceKrw: badgePriceKrw(providerType, undefined, id, periodLabel),
  }));
}
