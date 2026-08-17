/**
 * 마이페이지 과외지역 — DB cities 마스터 (tutor-ui getCities와 동일 축)
 * getCityUnits([]) 정적 id(metro-11)는 저장 시 int 캐스팅되어 지역이 비워진다.
 */

import { getCityUnits } from '../../../shared/tutor-region-slots.js';

/** @type {Array<{id: string, label: string, sido_code?: string, sido_name?: string, kind?: string}>} */
let cities = [];
let loaded = false;
/** @type {Promise<void>|null} */
let loadPromise = null;

export function tutorCityUnitsReady() {
  return loaded && cities.length > 0;
}

export function getTutorCityUnits() {
  if (!cities.length) return [];
  return getCityUnits(cities);
}

/** @returns {Promise<boolean>} true면 이번에 새로 불러와 재렌더가 필요 */
export function ensureTutorCityUnits() {
  if (loaded) return Promise.resolve(false);
  if (loadPromise) return loadPromise.then(() => true);
  loadPromise = (async () => {
    try {
      const res = await fetch('/api/auth/regions.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list' }),
        credentials: 'omit',
      });
      const data = await res.json().catch(() => ({}));
      const list = Array.isArray(data.cities) ? data.cities : [];
      if (list.length) {
        cities = list.map((c) => ({
          id: String(c.id),
          label: String(c.label || ''),
          sido_code: c.sido_code != null ? String(c.sido_code) : '',
          sido_name: String(c.sido_name || c.label || ''),
          kind: c.kind === 'metro' || c.kind === 'city' ? c.kind : undefined,
        }));
      }
    } catch {
      /* getCityUnits([]) 정적 폴백 */
    } finally {
      loaded = true;
    }
  })();
  return loadPromise.then(() => cities.length > 0);
}
