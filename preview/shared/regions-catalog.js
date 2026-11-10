/**
 * 지역 마스터 목록 (regions.php action=list).
 * 사용자·세션과 무관한 공개 자료 — GET + HTTP/브라우저 캐시·sessionStorage 재사용.
 * 캐시 무효화: REGIONS_CATALOG_VERSION 을 올리고 배포 (worklog 343 A-4).
 */

/** @type {string} 지역 DB·스키마가 바뀌면 올린다. URL ?v= 와 sessionStorage 키에 사용. */
export const REGIONS_CATALOG_VERSION = '1';

const STORAGE_KEY = `study114:regions-catalog:v${REGIONS_CATALOG_VERSION}`;

/** @type {{ regions: Array, complexes: Array, tutorUnits: Array } | null} */
let memoryCache = null;
/** @type {Promise<{ regions: Array, complexes: Array, tutorUnits: Array }> | null} */
let inflight = null;

/**
 * @param {unknown} data
 * @returns {{ regions: Array, complexes: Array, tutorUnits: Array } | null}
 */
function normalizeCatalog(data) {
  if (!data || typeof data !== 'object') return null;
  const body = /** @type {Record<string, unknown>} */ (data);
  if (body.ok === false) return null;
  return {
    regions: Array.isArray(body.regions) ? body.regions : [],
    complexes: Array.isArray(body.complexes) ? body.complexes : [],
    tutorUnits: Array.isArray(body.tutor_units)
      ? body.tutor_units
      : Array.isArray(body.tutorUnits)
        ? body.tutorUnits
        : [],
  };
}

function readSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizeCatalog(JSON.parse(raw));
  } catch {
    return null;
  }
}

/**
 * @param {{ regions: Array, complexes: Array, tutorUnits: Array }} catalog
 */
function writeSession(catalog) {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ok: true,
        regions: catalog.regions,
        complexes: catalog.complexes,
        tutor_units: catalog.tutorUnits,
      }),
    );
  } catch {
    /* quota / private mode */
  }
}

/**
 * GET /api/auth/regions.php?action=list&v=… (POST 하위 호환은 서버에 유지, 화면은 GET만).
 * @returns {Promise<{ regions: Array, complexes: Array, tutorUnits: Array }>}
 */
export async function fetchRegionsCatalog() {
  if (memoryCache) return memoryCache;

  const fromSession = readSession();
  if (fromSession) {
    memoryCache = fromSession;
    return fromSession;
  }

  if (inflight) return inflight;

  inflight = (async () => {
    const url = `/api/auth/regions.php?action=list&v=${encodeURIComponent(REGIONS_CATALOG_VERSION)}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'omit',
    });
    const rawText = await res.text();
    let data = {};
    try {
      data = JSON.parse(rawText);
    } catch {
      const start = rawText.indexOf('{');
      const end = rawText.lastIndexOf('}');
      if (start >= 0 && end > start) {
        try {
          data = JSON.parse(rawText.slice(start, end + 1));
        } catch {
          data = {};
        }
      }
    }
    const catalog = normalizeCatalog(data);
    if (!res.ok || !catalog) {
      const err = new Error(
        (data && typeof data === 'object' && 'message' in data && data.message) ||
          `서버 오류 (${res.status})`,
      );
      throw err;
    }
    memoryCache = catalog;
    writeSession(catalog);
    return catalog;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}
