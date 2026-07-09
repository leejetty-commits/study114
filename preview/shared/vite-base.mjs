/**
 * Vite base path — 로컬 dev는 `/`, 스테이징 빌드는 VITE_BASE_PATH 주입
 * @param {string} [fallback='/']
 */
export function resolveViteBase(fallback = '/') {
  const raw = process.env.VITE_BASE_PATH;
  if (typeof raw === 'string' && raw.trim()) {
    const base = raw.trim();
    return base.endsWith('/') ? base : `${base}/`;
  }
  return fallback;
}
