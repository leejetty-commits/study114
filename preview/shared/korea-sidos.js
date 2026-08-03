/**
 * 전국 시·도(광역시·특별시·도) — 과외지역 선택용
 * region_id는 API cities 매핑으로 채움 (없으면 코드 기준 폴백)
 */

/** @typedef {{ code: string, label: string }} SidoOption */

/** @type {SidoOption[]} */
export const KOREA_SIDOS = [
  { code: '11', label: '서울특별시' },
  { code: '26', label: '부산광역시' },
  { code: '27', label: '대구광역시' },
  { code: '28', label: '인천광역시' },
  { code: '29', label: '광주광역시' },
  { code: '30', label: '대전광역시' },
  { code: '31', label: '울산광역시' },
  { code: '36', label: '세종특별자치시' },
  { code: '41', label: '경기도' },
  { code: '51', label: '강원특별자치도' },
  { code: '43', label: '충청북도' },
  { code: '44', label: '충청남도' },
  { code: '52', label: '전북특별자치도' },
  { code: '46', label: '전라남도' },
  { code: '47', label: '경상북도' },
  { code: '48', label: '경상남도' },
  { code: '50', label: '제주특별자치도' },
];

/**
 * API cities(id,label) + 전국 시·도 목록을 합쳐 select 옵션용으로 만든다.
 * @param {Array<{id: number|string, label: string}>} [apiCities]
 * @returns {Array<{id: string, label: string}>}
 */
export function buildSidoCityOptions(apiCities = []) {
  const byLabel = new Map();
  (apiCities || []).forEach((c) => {
    const label = String(c.label || '').trim();
    if (!label) return;
    if (!byLabel.has(label)) byLabel.set(label, String(c.id));
  });

  return KOREA_SIDOS.map((s) => ({
    id: byLabel.get(s.label) || '',
    label: s.label,
    code: s.code,
  })).filter((c) => c.id);
}

/**
 * regions 라벨에서 시·도만 뽑아 옵션화 (API cities가 없을 때)
 * @param {Array<{id: number|string, label: string}>} regions
 */
export function cityOptionsFromRegionLabels(regions = []) {
  const seen = new Map();
  regions.forEach((r) => {
    const sido = String(r.label || '')
      .trim()
      .split(/\s+/)[0];
    if (!sido || seen.has(sido)) return;
    seen.set(sido, { id: String(r.id), label: sido });
  });
  return [...seen.values()];
}
