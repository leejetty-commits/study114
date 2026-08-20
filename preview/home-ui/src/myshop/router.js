/**
 * 공개 마이샵 라우트 — `#/myshop/study-room/:id`
 * 원장 마이페이지 미리보기(`/mypage/registrations/study-rooms/:id`)와 분리.
 * 역할(학부모·공부방·과외쌤·게스트) 공통 열람. 복귀 문맥만 역할/진입 화면별로 다름.
 */

const PATH_RE = /^\/myshop\/study-room\/(\d+)$/;

/**
 * @param {string} [hashPath]
 * @returns {{ path: string, studyRoomId: number, from: string } | null}
 */
export function parseMyshopPath(hashPath) {
  const raw = String(hashPath || '');
  const withSlash = raw.startsWith('/') ? raw : `/${raw}`;
  const pathOnly = withSlash.split('?')[0];
  const m = pathOnly.match(PATH_RE);
  if (!m) return null;
  const studyRoomId = Number(m[1]);
  if (!Number.isFinite(studyRoomId) || studyRoomId <= 0) return null;
  const q = withSlash.includes('?') ? withSlash.slice(withSlash.indexOf('?') + 1) : '';
  const params = new URLSearchParams(q);
  return {
    path: pathOnly,
    studyRoomId,
    from: String(params.get('from') || '').trim(),
  };
}

/** @param {string} [hashPath] */
export function normalizeMyshopPath(hashPath) {
  const parsed = parseMyshopPath(hashPath);
  return parsed ? parsed.path : null;
}

/**
 * @param {number|string} studyRoomId
 * @param {{ from?: string }} [opts]
 */
export function myshopStudyRoomPath(studyRoomId, opts = {}) {
  const id = Number(studyRoomId);
  if (!Number.isFinite(id) || id <= 0) return '';
  const base = `/myshop/study-room/${id}`;
  const from = String(opts.from || '').trim();
  return from ? `${base}?from=${encodeURIComponent(from)}` : base;
}

export function isMyshopHashPath(hashPath) {
  return Boolean(normalizeMyshopPath(hashPath));
}
