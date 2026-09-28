/**
 * 마이페이지 과외지역 — DB cities 마스터 (tutor-ui getCities와 동일 축)
 * getCityUnits([]) 정적 id(metro-11)는 저장 시 int 캐스팅되어 지역이 비워진다.
 */

import { getCityUnits } from '../../../shared/tutor-region-slots.js';

/** @type {Array<{id: string, label: string, sido_code?: string, sido_name?: string, kind?: string}>} */
let cities = [];
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
  if (!cities.length) return [];
  return getCityUnits(cities).filter((u) => /^\d+$/.test(String(u.id || '')));
}

/** 실패 뒤 「다시 불러오기」. 이전 빈 캐시를 지우고 다시 요청한다. */
export function retryTutorCityUnits() {
  cities = [];
  lastError = '';
  loadPromise = null;
  return ensureTutorCityUnits();
}

function applyCities(list) {
  if (!Array.isArray(list) || !list.length) return false;
  cities = list.map((c) => ({
    id: String(c.id),
    label: String(c.label || ''),
    sido_code: c.sido_code != null ? String(c.sido_code) : '',
    sido_name: String(c.sido_name || c.label || ''),
    kind: c.kind === 'metro' || c.kind === 'city' ? c.kind : undefined,
  }));
  if (!getTutorCityUnits().length) {
    cities = [];
    return false;
  }
  return true;
}

async function readCitiesPayload(res) {
  const text = await res.text();
  const body = text.trim();
  if (!body.startsWith('{')) return null;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

async function fetchCitiesOnce() {
  const calls = [
    () =>
      fetch('/api/auth/regions.php?action=cities', {
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'omit',
      }),
    () =>
      fetch('/api/auth/regions.php', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        credentials: 'omit',
        body: JSON.stringify({ action: 'cities' }),
      }),
    () =>
      fetch('/api/auth/regions.php', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        credentials: 'omit',
        body: JSON.stringify({ action: 'list' }),
      }),
  ];
  let last = new Error('과외지역 목록을 불러오지 못했습니다.');
  for (const call of calls) {
    try {
      const res = await call();
      const data = await readCitiesPayload(res);
      const list = Array.isArray(data?.cities) ? data.cities : [];
      if (data && data.ok !== false && applyCities(list)) {
        lastError = '';
        return;
      }
      last = new Error(data?.message || '과외지역 목록을 불러오지 못했습니다.');
    } catch (err) {
      last = err instanceof Error ? err : last;
    }
  }
  throw last;
}

/** @returns {Promise<boolean>} true면 이번에 새로 불러와 재렌더가 필요 */
export function ensureTutorCityUnits() {
  if (cities.length) return Promise.resolve(false);
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    let last = null;
    for (let i = 0; i < 3; i += 1) {
      try {
        await fetchCitiesOnce();
        return true;
      } catch (err) {
        last = err;
        await new Promise((r) => setTimeout(r, 350 * (i + 1)));
      }
    }
    lastError = last instanceof Error ? last.message : '과외지역 목록을 불러오지 못했습니다.';
    return false;
  })().finally(() => {
    loadPromise = null;
  });
  return loadPromise;
}
