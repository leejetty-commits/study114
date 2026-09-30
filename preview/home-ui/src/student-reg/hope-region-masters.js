/**
 * 학생 희망지역 마스터 (프리뷰)
 * API 가능 시 /api/auth/regions.php · complexes.address 포함
 */

/** @type {Array<{id:string,label:string}>} */
const FALLBACK_REGIONS = [];

/** @type {Array<{id:string,region_id:string,label:string,address:string}>} */
const FALLBACK_COMPLEXES = [];

/** @type {Array<{id:string,label:string}>|null} */
let cachedRegions = null;
/** @type {Array<{id:string,region_id:string,label:string,address:string}>|null} */
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
  if (cachedRegions && cachedComplexes) return Promise.resolve();
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
        const complexes = Array.isArray(data?.complexes) ? data.complexes : [];
        if (complexes.length) {
          cachedComplexes = complexes.map((c) => ({
            id: String(c.id),
            region_id: String(c.region_id),
            label: String(c.label || c.name || ''),
            address: String(c.address || ''),
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
  if (!seen.size) return [];
  return [...seen.values()];
}

/** @param {string} [regionId] */
export function complexesForRegion(regionId) {
  const { complexes } = getHopeRegionMasters();
  if (!regionId) return complexes;
  return complexes.filter((c) => String(c.region_id) === String(regionId));
}

/** 전체 단지 (단지 기준 선선택 시) */
export function listAllComplexes() {
  return getHopeRegionMasters().complexes;
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

/** @param {string} complexId */
export function addressForComplexId(complexId) {
  const { complexes } = getHopeRegionMasters();
  return complexes.find((c) => String(c.id) === String(complexId))?.address || '';
}
