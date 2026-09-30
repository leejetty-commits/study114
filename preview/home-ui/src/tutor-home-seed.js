/**
 * 과외쌤 홈 멤버박스 조회.
 * 공부방과 같이 ROI lifetime_views. study_room_id 는 붙이지 않는다.
 */

import { fetchRoiSummary } from './paid-api.js';
import { getTutors } from './tutor-reg/store.js';
import { hydrateRegistrationsCache, isRegistrationsApiMode } from './registrations-backend.js';
import { ensureTutorCityUnits, getTutorCityUnits } from './tutor-reg/city-units.js';
import { activityLabelFromRegionId } from '../../shared/korea-sidos.js';

/** @type {number|null} */
let lifetimeViews = null;
let viewsLoaded = false;

/** @returns {number|null} 없거나 실패면 null */
export function readTutorLifetimeViews() {
  return lifetimeViews;
}

async function ensureLifetimeViews() {
  if (viewsLoaded && lifetimeViews != null) return;
  try {
    const data = await fetchRoiSummary(7);
    if (data?.lifetime_views == null || data.lifetime_views === '') {
      lifetimeViews = null;
    } else {
      const n = Number(data.lifetime_views);
      lifetimeViews = Number.isFinite(n) ? n : null;
    }
  } catch {
    lifetimeViews = null;
  }
  viewsLoaded = true;
}

/** @type {Array<{label: string, primary: boolean, regionId: string}>|null} */
let homeRegions = null;
let regionBoot = 0;

function blankTutorHomeRegions() {
  return [
    { label: '', primary: false, regionId: '' },
    { label: '', primary: false, regionId: '' },
    { label: '', primary: false, regionId: '' },
  ];
}

/** null이면 아직 조회 전. 조회 후엔 저장된 3칸(빈 칸 포함). MOCK 지역은 넣지 않는다. */
export function readTutorHomeRegions() {
  return homeRegions;
}

/** 대표 활동지역 표시. 저장된 대표가 없으면 비운다. */
export function tutorHomePrimaryLabel() {
  const slots = Array.isArray(homeRegions) ? homeRegions : [];
  const primary = slots.find((s) => s.primary && s.label) || null;
  return String(primary?.label || '').trim();
}

/** saved_regions[idx] 화면 라벨. 없거나 MOCK이면 빈 문자열. */
export function tutorHomeRegionLabel(index = 0) {
  const slots = Array.isArray(homeRegions) ? homeRegions : [];
  const idx = Number(index);
  if (!Number.isFinite(idx) || idx < 0 || idx >= slots.length) return '';
  return String(slots[idx]?.label || '').trim();
}

export function tutorHomeRegionsReady() {
  return homeRegions !== null;
}

async function ensureHomeRegions() {
  try {
    if (isRegistrationsApiMode()) await hydrateRegistrationsCache();
  } catch {
    /* 캐시가 있으면 그 값으로 칩을 그린다 */
  }
  try {
    await ensureTutorCityUnits();
  } catch {
    /* 라벨 해석이 안 되면 대표 라벨만 남긴다 */
  }
  if (!isRegistrationsApiMode()) {
    homeRegions = blankTutorHomeRegions();
    return;
  }
  const tutor = getTutors().find((row) => !row?.deleted_at) || null;
  const units = getTutorCityUnits();
  const saved = Array.isArray(tutor?.saved_regions) ? tutor.saved_regions : [];
  const primaryText = String(tutor?.primary_region_label || '').trim();
  homeRegions = [0, 1, 2].map((i) => {
    const slot = saved[i] || {};
    const id = String(slot.region_id || '').trim();
    const numeric = /^\d+$/.test(id);
    let label = numeric ? activityLabelFromRegionId(id, units) : '';
    const primary = slot.is_primary === true || slot.is_primary === 1 || slot.is_primary === '1';
    if (!label && primary && primaryText && primaryText !== '—') label = primaryText;
    return { label, primary: primary && !!label, regionId: numeric ? id : '' };
  });
  if (!homeRegions.some((s) => s.primary) && homeRegions[0].label) homeRegions[0].primary = true;
}

/**
 * @param {() => void} [rerender]
 */
export function bootTutorHome(rerender) {
  const gen = ++regionBoot;
  return (async () => {
    await ensureLifetimeViews();
    const prev = JSON.stringify(homeRegions);
    await ensureHomeRegions();
    if (gen !== regionBoot) return;
    if (JSON.stringify(homeRegions) !== prev && typeof rerender === 'function') rerender();
  })();
}
