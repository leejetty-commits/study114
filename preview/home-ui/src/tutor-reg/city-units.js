/**
 * 마이페이지 과외지역·학생 과외 희망지역 — /api/auth/regions.php?action=tutor_units
 * 과외 단위(광역시 / 도의 시·군). 실패·빈 목록이면 정적 목록으로 대체하지 않는다.
 */

import { TUTOR_UNIT_LIST_ERROR } from '../../../shared/tutor-unit-cascade.js';
import { getCityUnits } from '../../../shared/tutor-region-slots.js';

/** @type {Array<Record<string, unknown>>} */
let units = [];
/** @type {Promise<boolean>|null} */
let loadPromise = null;
let lastError = '';

export function tutorCityUnitsReady() {
  return getTutorCityUnits().length > 0;
}

export function tutorCityUnitsError() {
  return lastError;
}

export function getTutorCityUnits() {
  if (!units.length) return [];
  return getCityUnits(units);
}

/** 실패 뒤 「다시 불러오기」. 이전 빈 캐시를 지우고 다시 요청한다. */
export function retryTutorCityUnits() {
  units = [];
  lastError = '';
  loadPromise = null;
  return ensureTutorCityUnits();
}

function applyUnits(list) {
  if (!Array.isArray(list) || !getCityUnits(list).length) {
    units = [];
    return false;
  }
  units = list;
  return true;
}

async function readUnitsPayload(res) {
  const text = await res.text();
  const body = text.trim();
  if (!body.startsWith('{')) return null;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

async function fetchUnitsOnce() {
  const calls = [
    () =>
      fetch('/api/auth/regions.php?action=tutor_units', {
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'omit',
      }),
    () =>
      fetch('/api/auth/regions.php', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        credentials: 'omit',
        body: JSON.stringify({ action: 'tutor_units' }),
      }),
    () =>
      fetch('/api/auth/regions.php', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        credentials: 'omit',
        body: JSON.stringify({ action: 'list' }),
      }),
  ];
  let last = new Error(TUTOR_UNIT_LIST_ERROR);
  for (const call of calls) {
    try {
      const res = await call();
      const data = await readUnitsPayload(res);
      const list = Array.isArray(data?.tutor_units) ? data.tutor_units : [];
      if (data && data.ok !== false && applyUnits(list)) {
        lastError = '';
        return;
      }
      last = new Error(data?.message || TUTOR_UNIT_LIST_ERROR);
    } catch (err) {
      last = err instanceof Error ? err : last;
    }
  }
  throw last;
}

/** @returns {Promise<boolean>} true면 이번에 새로 불러와 재렌더가 필요 */
export function ensureTutorCityUnits() {
  if (units.length) return Promise.resolve(false);
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    let last = null;
    for (let i = 0; i < 3; i += 1) {
      try {
        await fetchUnitsOnce();
        return true;
      } catch (err) {
        last = err;
        await new Promise((r) => setTimeout(r, 350 * (i + 1)));
      }
    }
    lastError = last instanceof Error ? last.message : TUTOR_UNIT_LIST_ERROR;
    return false;
  })().finally(() => {
    loadPromise = null;
  });
  return loadPromise;
}
