/**
 * Prime / Pick / Basic 노출 규칙 (설정 주입 가능)
 * — Prime: 지역 단위 한정 슬롯, 빈 칸은 EMPTY 홍보카드
 * — Pick: 5개 세트 + 페이지 + 시간 순환, 최신 입점 우선
 * — Basic: 부스트 없음, 페이지 리스트만
 */

import { getPlanRuntimeSettings, getPlanSetting } from './plans/runtime-config.js';

/**
 * @param {object[]} items
 * @param {string} [dateKey]
 */
export function sortByNewestFirst(items, dateKey = 'registered_at') {
  return [...items].sort((a, b) => {
    const da = String(a[dateKey] || a.published_at || a.starts_at || '');
    const db = String(b[dateKey] || b.published_at || b.starts_at || '');
    if (da !== db) return db.localeCompare(da);
    return Number(b.id || 0) - Number(a.id || 0);
  });
}

function isPublished(item) {
  return !item.profile_status || item.profile_status === 'published';
}

/**
 * 유료 Prime 점유자 (명시 tier 우선). 없으면 demo_prime_filled 만큼만 점유로 시뮬레이션
 * → 빈 슬롯 홍보카드가 보이도록 함.
 * @param {object[]} pool
 * @param {number} [capacity]
 */
export function getPrimeOccupied(pool, capacity) {
  const cap = capacity ?? (Number(getPlanSetting('prime_slots')) || 3);
  const published = pool.filter(isPublished);
  const explicit = published.filter(
    (i) => i.exposure_tier === 'prime' || i.position_sku === 'prime' || i.sku === 'prime',
  );
  if (explicit.length) return explicit.slice(0, cap);

  const demoFilled = Number(getPlanSetting('demo_prime_filled'));
  const fill = Number.isFinite(demoFilled) ? Math.max(0, Math.min(cap, demoFilled)) : 1;
  return published.slice(0, fill);
}

/**
 * @param {object[]} occupied
 * @param {number} [capacity]
 * @returns {Array<object|null>}
 */
export function buildPrimeSlotArray(occupied, capacity) {
  const cap = capacity ?? (Number(getPlanSetting('prime_slots')) || 3);
  /** @type {Array<object|null>} */
  const slots = [];
  for (let i = 0; i < cap; i++) {
    slots.push(occupied[i] || null);
  }
  return slots;
}

/**
 * Pick 후보: Prime 점유 제외 후 최신순
 * @param {object[]} pool
 * @param {object[]} primeOccupied
 */
export function getPickPool(pool, primeOccupied) {
  const primeIds = new Set(primeOccupied.map((i) => i.id));
  const rest = pool.filter((i) => isPublished(i) && !primeIds.has(i.id));
  const explicitPick = rest.filter(
    (i) => i.exposure_tier === 'pick' || i.position_sku === 'pick' || i.sku === 'pick',
  );
  const base = explicitPick.length ? explicitPick : rest;
  return sortByNewestFirst(base);
}

/**
 * 시간대 세트 순환 — 최근 입점 우선 리스트를 set 단위로 로테이션
 * @param {object[]} newestFirst
 * @param {number} [nowMs]
 */
export function rotatePickPool(newestFirst, nowMs = Date.now()) {
  const setSize = Number(getPlanSetting('pick_set_size')) || 5;
  const minutes = Number(getPlanSetting('pick_rotation_minutes')) || 15;
  if (!newestFirst.length || setSize <= 0) return newestFirst;

  const setCount = Math.max(1, Math.ceil(newestFirst.length / setSize));
  const windowMs = Math.max(1, minutes) * 60 * 1000;
  const setIndex = Math.floor(nowMs / windowMs) % setCount;
  const offset = setIndex * setSize;
  return [...newestFirst.slice(offset), ...newestFirst.slice(0, offset)];
}

/**
 * Basic 후보: Prime 점유 제외 (Pick과 중복 가능 — Basic은 기본 리스트)
 * 규칙: Basic은 부스트 없이 기본 노출. Prime만 제외하고 최신순 페이지.
 * @param {object[]} pool
 * @param {object[]} primeOccupied
 */
export function getBasicPool(pool, primeOccupied) {
  const primeIds = new Set(primeOccupied.map((i) => i.id));
  return sortByNewestFirst(pool.filter((i) => isPublished(i) && !primeIds.has(i.id)));
}

/** @param {'study_room'|'tutor'} kind */
export function getPrimeEmptyCopy(kind) {
  const s = getPlanRuntimeSettings();
  if (kind === 'tutor') {
    return {
      title: String(s.prime_empty_title_tutor || '이 자리에 과외쌤을 홍보하세요'),
      body: String(s.prime_empty_body_tutor || '지금 먼저 선점하세요 · 우리 동네 상단 노출'),
      cta: '유료상품 보기',
    };
  }
  return {
    title: String(s.prime_empty_title_study_room || '이 자리에 공부방을 홍보하세요'),
    body: String(s.prime_empty_body_study_room || '우리 동네 상단 노출을 먼저 잡아보세요'),
    cta: '유료상품 보기',
  };
}

export function getExposurePageSizes() {
  const s = getPlanRuntimeSettings();
  return {
    primeSlots: Number(s.prime_slots) || 3,
    pickSetSize: Number(s.pick_set_size) || 5,
    pickRotationMinutes: Number(s.pick_rotation_minutes) || 15,
    basicPageSize: Number(s.basic_page_size) || 20,
    regionScopeType: String(s.region_scope_type || 'dong'),
  };
}
