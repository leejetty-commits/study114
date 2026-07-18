/**
 * 학생찾기 — 희망 유형(공부방/과외쌤) 첫 진입·기억
 * A: 첫 진입 선택 → B: localStorage 우선 → C: 없으면 과외쌤 + 서울시
 */

const STORAGE_KEY = 'study114.studentFind.lastHopeType';

/** @typedef {'tutor' | 'study_room'} StudentHopeType */

/** @returns {StudentHopeType | null} */
export function readStoredHopeType() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'tutor' || v === 'study_room') return v;
  } catch {
    /* private mode */
  }
  return null;
}

/** @param {StudentHopeType} hopeType */
export function writeStoredHopeType(hopeType) {
  try {
    localStorage.setItem(STORAGE_KEY, hopeType);
  } catch {
    /* ignore */
  }
}

/**
 * URL ?hope=tutor|study_room → 저장값 → null(선택 UI 필요)
 * @param {Record<string, string>} [query]
 * @returns {StudentHopeType | null}
 */
export function resolveHopeTypeFromQuery(query = {}) {
  const raw = String(query.hope || query.preferred_lesson_type || '').trim();
  if (raw === 'tutor' || raw === 'study_room') return raw;
  return readStoredHopeType();
}

/** 저장값 없을 때 폴백 — 과외쌤 맥락 */
export const DEFAULT_STUDENT_HOPE_TYPE = /** @type {StudentHopeType} */ ('tutor');

/**
 * @param {(hope: StudentHopeType) => void} onPick
 */
export function renderHopeTypeGate() {
  return `
    <section class="search-hope-gate" aria-label="희망 유형 선택">
      <h2 class="search-hope-gate__title">어떤 학생 의뢰를 볼까요?</h2>
      <p class="search-hope-gate__desc">시장 비교용 블라인드 리스트입니다. 실명·연락처·쪽지는 제공되지 않습니다.</p>
      <div class="search-hope-gate__actions">
        <button type="button" class="btn btn--primary" data-action="pick-hope-type" data-hope="tutor">과외 희망 학생</button>
        <button type="button" class="btn btn--secondary" data-action="pick-hope-type" data-hope="study_room">공부방 희망 학생</button>
      </div>
    </section>`;
}
