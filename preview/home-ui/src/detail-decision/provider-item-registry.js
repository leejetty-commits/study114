/**
 * 찾기 화면이 이미 가진 카드와, 사용자가 연·담은 카드를 공통 조회가 보게 한다.
 * 홈 풀·REAL_DB_CAP 표본 뒤에만 쓴다. 표본 개수는 바꾸지 않는다.
 */

const STORAGE_KEY = 'study114:provider-item-registry';
const MAX_ITEMS = 40;

/** @type {Array<(kind: string, id: number) => object|null|undefined>} */
const lookups = [];

/** @param {(kind: string, id: number) => object|null|undefined} fn */
export function registerProviderItemLookup(fn) {
  if (typeof fn === 'function' && !lookups.includes(fn)) lookups.push(fn);
}

function readStored() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * @param {string} kind
 * @param {object|null|undefined} item
 */
export function rememberProviderItem(kind, item) {
  const id = Number(item?.id);
  if (!kind || !Number.isFinite(id) || id <= 0) return;
  try {
    const next = [
      { kind, id, item },
      ...readStored().filter((row) => !(row?.kind === kind && Number(row?.id) === id)),
    ].slice(0, MAX_ITEMS);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* private mode */
  }
}

/**
 * @param {string} kind
 * @param {number|string} id
 * @returns {object|null}
 */
export function lookupRegisteredProviderItem(kind, id) {
  const n = Number(id);
  if (!kind || !Number.isFinite(n) || n <= 0) return null;
  for (const fn of lookups) {
    try {
      const hit = fn(kind, n);
      if (hit && Number(hit.id) === n) {
        rememberProviderItem(kind, hit);
        return hit;
      }
    } catch {
      /* 다음 조회 */
    }
  }
  const stored = readStored().find((row) => row?.kind === kind && Number(row?.id) === n);
  return stored?.item || null;
}
