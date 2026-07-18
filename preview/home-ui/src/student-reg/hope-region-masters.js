/**
 * 학생 희망지역 마스터 (프리뷰)
 * API 가능 시 /api/auth/regions.php · 실패 시 seed
 */

/** @type {Array<{id:string,label:string}>} */
const FALLBACK_REGIONS = [
  { id: '1', label: '서울특별시 강남구 대치동' },
  { id: '2', label: '서울특별시 강남구 역삼동' },
  { id: '3', label: '서울특별시 서초구 서초동' },
  { id: '4', label: '서울특별시 송파구 잠실동' },
  { id: '5', label: '부산광역시 해운대구 우동' },
  { id: '6', label: '부산광역시 해운대구 좌동' },
  { id: '7', label: '인천광역시 연수구 송도동' },
  { id: '8', label: '경기도 성남시 분당구 정자동' },
];

/** @type {Array<{id:string,region_id:string,label:string}>} */
const FALLBACK_COMPLEXES = [
  { id: 'c1', region_id: '1', label: '은마아파트' },
  { id: 'c2', region_id: '1', label: '대치래미안' },
  { id: 'c3', region_id: '4', label: '잠실주공' },
  { id: 'c4', region_id: '5', label: '해운대아이파크' },
];

/** @type {Array<{id:string,label:string}>|null} */
let cachedRegions = null;
/** @type {Array<{id:string,region_id:string,label:string}>|null} */
let cachedComplexes = null;
/** @type {Promise<void>|null} */
let loadPromise = null;

export function getHopeRegionMasters() {
  return {
    regions: cachedRegions || FALLBACK_REGIONS,
    complexes: cachedComplexes || FALLBACK_COMPLEXES,
  };
}

/** @returns {Promise<void>} */
export function ensureHopeRegionMasters() {
  if (cachedRegions) return Promise.resolve();
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    try {
      const res = await fetch('/api/auth/regions.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list' }),
        credentials: 'omit',
      });
      if (res.ok) {
        const data = await res.json();
        const list =
          data?.ok && Array.isArray(data.regions)
            ? data.regions
            : Array.isArray(data?.regions)
              ? data.regions
              : Array.isArray(data?.items)
                ? data.items
                : [];
        if (list.length) {
          cachedRegions = list.map((r) => ({
            id: String(r.id),
            label: String(r.label || r.name || ''),
          }));
        }
      }
    } catch {
      /* fallback */
    }
    if (!cachedRegions) cachedRegions = FALLBACK_REGIONS;
    if (!cachedComplexes) cachedComplexes = FALLBACK_COMPLEXES;
  })();
  return loadPromise;
}

/** @returns {Array<{id:string,label:string}>} */
export function listCityOptions() {
  const { regions } = getHopeRegionMasters();
  const seen = new Map();
  regions.forEach((r) => {
    const sido = String(r.label || '')
      .trim()
      .split(/\s+/)[0];
    if (!sido || seen.has(sido)) return;
    seen.set(sido, { id: String(r.id), label: sido });
  });
  if (!seen.size) {
    seen.set('서울특별시', { id: '1', label: '서울특별시' });
  }
  return [...seen.values()];
}

/** @param {string} regionId */
export function complexesForRegion(regionId) {
  const { complexes } = getHopeRegionMasters();
  return complexes.filter((c) => String(c.region_id) === String(regionId));
}

/** @param {string} regionId */
export function labelForRegionId(regionId) {
  const { regions } = getHopeRegionMasters();
  return regions.find((r) => String(r.id) === String(regionId))?.label || '';
}

/** @param {string} complexId */
export function labelForComplexId(complexId) {
  const { complexes } = getHopeRegionMasters();
  return complexes.find((c) => String(c.id) === String(complexId))?.label || '';
}
