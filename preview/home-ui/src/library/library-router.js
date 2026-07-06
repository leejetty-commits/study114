/** 23장 — 자료실 hash 라우트 (boardKey: library · library-template · library-guide-pdf) */

const LIBRARY_SECTIONS = ['', 'templates', 'guides'];

/** @param {string} hashPath */
export function normalizeLibraryPath(hashPath) {
  const p = hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
  if (p === '/library' || p === '/library/') return '/library';
  const parts = p.split('/').filter(Boolean);
  if (parts[0] !== 'library') return null;
  if (parts.length === 1) return '/library';
  if (parts.length === 2 && LIBRARY_SECTIONS.includes(parts[1])) return `/library/${parts[1]}`;
  return null;
}

export function getDefaultLibraryPath() {
  return '/library';
}

/** @param {string} path */
export function getLibrarySection(path) {
  const normalized = normalizeLibraryPath(path);
  if (!normalized || normalized === '/library') return 'library';
  return normalized.split('/')[2];
}

/** @typedef {'library'|'templates'|'guides'} LibrarySection */

/** @param {string} path @returns {{ screenId: string, section: LibrarySection }} */
export function parseLibraryPath(path) {
  const section = getLibrarySection(path);
  const map = {
    library: 'P23-01',
    templates: 'P23-02',
    guides: 'P23-03',
  };
  return { screenId: map[section], section };
}
