/**
 * 검색 전 — 내 지역 기준 피드 (홈 화면에서만 대표/추천/기본 노출 배치 사용)
 * 공부방: 행정동 · 과외/학생: 시
 */

import {
  EXPOSURE_STUDY_ROOMS,
  EXPOSURE_TUTORS,
  EXPOSURE_STUDENTS,
} from '@home-ui/exposure-data.js';
import { MOCK_REGIONS, getTutorRegionLabel } from './search-schema.js';
import { getProviderSelfFeed } from './search-provider-self.js';

/** 시드 데이터가 시 접두어 없이 동/구만 가진 경우 — 서울시 스코프 매칭용 */
const SEOUL_METRO_HINTS = [
  '서울',
  '강남',
  '서초',
  '송파',
  '대치',
  '도곡',
  '역삼',
  '개포',
  '잠실',
];

/**
 * @param {string} regionHint
 * @returns {{ dong: string, complex: string, city: string }}
 */
export function parseStudyRoomRegion(regionHint) {
  const raw = String(regionHint || '').trim();
  if (raw.includes('·')) {
    const parts = raw.split('·').map((s) => s.trim()).filter(Boolean);
    return { dong: parts[0] || '', complex: parts[1] || '', city: '' };
  }
  const dongMatch = raw.match(/(\S+동)/);
  const cityMatch = raw.match(/(\S+시)/);
  return {
    dong: dongMatch ? dongMatch[1] : '',
    complex: '',
    city: cityMatch ? cityMatch[1] : '',
  };
}

function isCityScope(regionHint) {
  const t = String(regionHint || '').replace(/\s+/g, '');
  return /시$/.test(t) && !/동$/.test(t);
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
 * @param {string} regionHint — 시 단위 (예: 서울시). 구·동 단위는 받지 않는 정책과 맞춤.
 */
export function filterTutorsByRegion(items, regionHint) {
  const city = regionHint.trim();
  if (!city) return [];

  if (isCityScope(city)) {
    const cityToken = city.replace(/\s+/g, '').replace(/시$/, '');
    return items.filter((item) => {
      const loc = String(item.location_label || '');
      if (loc.includes(cityToken) || loc.includes(city)) return true;
      if (cityToken === '서울') {
        return SEOUL_METRO_HINTS.some((h) => loc.includes(h));
      }
      return false;
    });
  }

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
export function filterStudentsByRegion(items, regionHint) {
  const hint = String(regionHint || '').trim();
  if (!hint) return [];

  if (isCityScope(hint)) {
    const cityToken = hint.replace(/\s+/g, '').replace(/시$/, '');
    return items.filter((item) => {
      const loc = String(item.location_label || '');
      if (loc.includes(cityToken) || loc.includes(hint)) return true;
      if (cityToken === '서울') {
        return SEOUL_METRO_HINTS.some((h) => loc.includes(h));
      }
      return false;
    });
  }

  const { dong, complex } = parseStudyRoomRegion(hint);
  if (!dong) return [];

  return items.filter((item) => {
    const loc = String(item.location_label || '');
    if (!loc.includes(dong)) return false;
    if (!complex) return true;
    return loc.includes(complex);
  });
}

/**
 * 공부방/과외 검색 결과 하단 — 해당 지역 학생 수요 (블라인드)
 * @param {string} regionHint
 * @param {{ hopeType?: 'tutor'|'study_room'|null, limit?: number }} [opts]
 */
export function getStudentDemandForRegion(regionHint, opts = {}) {
  const limit = opts.limit ?? 6;
  let pool = filterStudentsByRegion(EXPOSURE_STUDENTS, regionHint);
  if (opts.hopeType === 'tutor' || opts.hopeType === 'study_room') {
    pool = pool.filter(
      (s) =>
        s.preferred_lesson_type === opts.hopeType || s.preferred_lesson_type === 'both',
    );
  }
  return pool
    .filter((s) => s.exposure_status === 'published')
    .slice(0, limit)
    .map((item) => ({ ...item, exposure_tier: 'basic' }));
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
 * @param {{ tutorRegionIndex?: number, role?: import('./state.js').ViewerRole, homeSelf?: boolean, hopeType?: 'tutor'|'study_room' }} [ctx]
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
  const hopeType = ctx.hopeType || 'tutor';
  let pool = filterStudentsByRegion(EXPOSURE_STUDENTS, regionLabel);
  pool = pool.filter(
    (s) => s.preferred_lesson_type === hopeType || s.preferred_lesson_type === 'both',
  );
  return {
    items: pool.slice(0, 8).map((item) => ({
      ...item,
      exposure_tier: 'basic',
    })),
    regionLabel,
  };
}
