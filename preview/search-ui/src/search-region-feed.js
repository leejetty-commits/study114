/**
 * 검색 전 — 내 지역 기준 Prime · Pick · Basic 피드
 * 공부방: 행정동 + 단지 · 과외: 시/구
 */

import {
  EXPOSURE_STUDY_ROOMS,
  EXPOSURE_TUTORS,
  EXPOSURE_STUDENTS,
} from '@home-ui/exposure-data.js';
import { MOCK_REGIONS, getTutorRegionLabel } from './search-schema.js';
import { getProviderSelfFeed } from './search-provider-self.js';

/**
 * @param {string} regionHint
 * @returns {{ dong: string, complex: string }}
 */
export function parseStudyRoomRegion(regionHint) {
  const parts = regionHint.split('·').map((s) => s.trim()).filter(Boolean);
  return { dong: parts[0] || '', complex: parts[1] || '' };
}

/**
 * @param {object[]} items
 * @param {string} regionHint
 */
export function filterStudyRoomsByRegion(items, regionHint) {
  const { dong, complex } = parseStudyRoomRegion(regionHint);
  if (!dong) return [];

  const dongMatches = items.filter((item) => String(item.location_label || '').includes(dong));
  if (!complex) return dongMatches;

  const complexMatches = dongMatches.filter((item) => {
    const loc = String(item.location_label || '');
    const complexKey = complex.replace(/\s+/g, '');
    const locNorm = loc.replace(/\s+/g, '');
    return loc.includes(complex) || locNorm.includes(complexKey);
  });

  return complexMatches.length ? complexMatches : dongMatches;
}

/**
 * @param {object[]} items
 * @param {string} regionHint — 예: 서울시 강남구
 */
export function filterTutorsByRegion(items, regionHint) {
  const city = regionHint.trim();
  if (!city) return [];

  const cityNorm = city.replace(/\s+/g, '');
  const tokens = city
    .split(/\s+/)
    .map((t) => t.replace(/[시구군]/g, '').trim())
    .filter((t) => t.length >= 2);

  return items.filter((item) => {
    const loc = String(item.location_label || '');
    const locNorm = loc.replace(/\s+/g, '');
    if (locNorm.includes(cityNorm) || cityNorm.includes(locNorm)) return true;
    return tokens.some((token) => loc.includes(token));
  });
}

/**
 * @param {object[]} items
 * @param {string} regionHint
 */
function filterStudentsByRegion(items, regionHint) {
  const { dong, complex } = parseStudyRoomRegion(regionHint);
  if (!dong) return [];

  return items.filter((item) => {
    const loc = String(item.location_label || '');
    if (!loc.includes(dong)) return false;
    if (!complex) return true;
    return loc.includes(complex);
  });
}

/**
 * 인덱스 기반 Prime 채움 금지 — 빈 슬롯은 exposure-rules가 EMPTY 카드로 유지
 * @param {object[]} items
 */
function assignProviderTiers(items) {
  return items.map((item) => ({
    ...item,
    exposure_tier:
      item.exposure_tier ||
      (item.position_sku === 'prime' || item.sku === 'prime'
        ? 'prime'
        : item.position_sku === 'pick' || item.sku === 'pick'
          ? 'pick'
          : 'basic'),
  }));
}

/**
 * @param {import('./state.js').SearchTab} tab
 * @param {{ tutorRegionIndex?: number, role?: import('./state.js').ViewerRole, homeSelf?: boolean }} [ctx]
 * @returns {{ items: object[], regionLabel: string }}
 */
export function getRegionFeed(tab, ctx = {}) {
  if (ctx.role) {
    const selfFeed = getProviderSelfFeed(tab, ctx.role, { home: ctx.homeSelf === true });
    if (selfFeed) {
      return selfFeed;
    }
  }

  if (tab === 'room') {
    const regionLabel = MOCK_REGIONS.room;
    const pool = filterStudyRoomsByRegion(EXPOSURE_STUDY_ROOMS, regionLabel);
    return { items: assignProviderTiers(pool.slice(0, 11)), regionLabel };
  }
  if (tab === 'tutor') {
    const idx = ctx.tutorRegionIndex ?? 0;
    const regionLabel = getTutorRegionLabel(idx);
    const pool = filterTutorsByRegion(EXPOSURE_TUTORS, regionLabel);
    return { items: assignProviderTiers(pool.slice(0, 11)), regionLabel };
  }
  const regionLabel = MOCK_REGIONS.student;
  const pool = filterStudentsByRegion(EXPOSURE_STUDENTS, regionLabel);
  return {
    items: pool.slice(0, 8).map((item) => ({
      ...item,
      exposure_tier: 'basic',
    })),
    regionLabel,
  };
}
