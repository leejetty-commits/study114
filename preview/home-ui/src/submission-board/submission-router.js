/** 23장 — submission board 마이페이지 하위 라우트 */

export const SUBMISSION_BOARD_BASE = '/mypage/submission-board';

/** @typedef {'hub'|'new'|'detail'|'edit'} SubmissionBoardView */

/** @param {string} path */
export function isSubmissionBoardPath(path) {
  return path === SUBMISSION_BOARD_BASE || path.startsWith(`${SUBMISSION_BOARD_BASE}/`);
}

/** @param {string} hashPath */
export function normalizeSubmissionBoardPath(hashPath) {
  const p = hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
  if (p === SUBMISSION_BOARD_BASE || p === `${SUBMISSION_BOARD_BASE}/`) return SUBMISSION_BOARD_BASE;
  if (p === `${SUBMISSION_BOARD_BASE}/new`) return p;
  if (/^\/mypage\/submission-board\/[^/]+$/.test(p)) return p;
  if (/^\/mypage\/submission-board\/[^/]+\/edit$/.test(p)) return p;
  return null;
}

/**
 * @param {string} path
 * @returns {{ view: SubmissionBoardView, screenId: string, id?: string }}
 */
export function parseSubmissionBoardPath(path) {
  const normalized = normalizeSubmissionBoardPath(path);
  if (!normalized || normalized === SUBMISSION_BOARD_BASE) {
    return { view: 'hub', screenId: 'P23-04' };
  }
  if (normalized === `${SUBMISSION_BOARD_BASE}/new`) {
    return { view: 'new', screenId: 'P23-04a' };
  }
  const editMatch = normalized.match(/^\/mypage\/submission-board\/([^/]+)\/edit$/);
  if (editMatch) return { view: 'edit', screenId: 'P23-04a', id: editMatch[1] };
  const detailMatch = normalized.match(/^\/mypage\/submission-board\/([^/]+)$/);
  if (detailMatch) return { view: 'detail', screenId: 'P23-04b', id: detailMatch[1] };
  return { view: 'hub', screenId: 'P23-04' };
}

/** @param {string} screenId @param {string} [path] */
export function submissionBoardScreenTitle(screenId, path) {
  const parsed = path ? parseSubmissionBoardPath(path) : null;
  if (parsed?.view === 'new') return '새 자료 제출';
  if (parsed?.view === 'edit') return '제출 수정';
  if (parsed?.view === 'detail') return '제출 상세';
  return '제출함';
}
