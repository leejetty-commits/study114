/**
 * 학생 찜 — 공급자 전용 (25§4-2 비교·공급자 찜과 분리)
 * handoff favorites API는 study_room/tutor만 — 학생은 프리뷰 sessionStorage
 */

const STORAGE_KEY = 'study114-preview-student-wishlist';

/** @returns {number[]} */
function loadIds() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(Number).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function saveIds(ids) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(ids)]));
}

/** @param {number|string} id */
export function isStudentWishlisted(id) {
  return loadIds().includes(Number(id));
}

/** @param {number|string} id @returns {boolean} added */
export function toggleStudentWishlist(id) {
  const numId = Number(id);
  const ids = loadIds();
  const has = ids.includes(numId);
  if (has) {
    saveIds(ids.filter((x) => x !== numId));
    return false;
  }
  saveIds([...ids, numId]);
  return true;
}

/** @returns {number[]} */
export function getStudentWishlistIds() {
  return loadIds();
}
