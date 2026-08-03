/**
 * 과외지역 기본 단위 = 「시」
 * - 광역시·특별시·세종: 그 자체로 1단위
 * - 도: 도 선택 후 「시」까지 선택
 */

/** @typedef {{ code: string, label: string }} MetroUnit */
/** @typedef {{ code: string, label: string, cities: string[] }} ProvinceUnit */

/** @type {MetroUnit[]} */
export const KOREA_METROS = [
  { code: '11', label: '서울특별시' },
  { code: '26', label: '부산광역시' },
  { code: '27', label: '대구광역시' },
  { code: '28', label: '인천광역시' },
  { code: '29', label: '광주광역시' },
  { code: '30', label: '대전광역시' },
  { code: '31', label: '울산광역시' },
  { code: '36', label: '세종특별자치시' },
];

/** @type {ProvinceUnit[]} */
export const KOREA_PROVINCES = [
  {
    code: '41',
    label: '경기도',
    cities: [
      '수원시',
      '성남시',
      '의정부시',
      '안양시',
      '부천시',
      '광명시',
      '평택시',
      '동두천시',
      '안산시',
      '고양시',
      '과천시',
      '구리시',
      '남양주시',
      '오산시',
      '시흥시',
      '군포시',
      '의왕시',
      '하남시',
      '용인시',
      '파주시',
      '이천시',
      '안성시',
      '김포시',
      '화성시',
      '광주시',
      '양주시',
      '포천시',
      '여주시',
    ],
  },
  {
    code: '51',
    label: '강원특별자치도',
    cities: ['춘천시', '원주시', '강릉시', '동해시', '태백시', '속초시', '삼척시'],
  },
  {
    code: '43',
    label: '충청북도',
    cities: ['청주시', '충주시', '제천시'],
  },
  {
    code: '44',
    label: '충청남도',
    cities: ['천안시', '공주시', '보령시', '아산시', '서산시', '논산시', '계룡시', '당진시'],
  },
  {
    code: '52',
    label: '전북특별자치도',
    cities: ['전주시', '군산시', '익산시', '정읍시', '남원시', '김제시'],
  },
  {
    code: '46',
    label: '전라남도',
    cities: ['목포시', '여수시', '순천시', '나주시', '광양시'],
  },
  {
    code: '47',
    label: '경상북도',
    cities: [
      '포항시',
      '경주시',
      '김천시',
      '안동시',
      '구미시',
      '영주시',
      '영천시',
      '상주시',
      '문경시',
      '경산시',
    ],
  },
  {
    code: '48',
    label: '경상남도',
    cities: ['창원시', '진주시', '통영시', '사천시', '김해시', '밀양시', '거제시', '양산시'],
  },
  {
    code: '50',
    label: '제주특별자치도',
    cities: ['제주시', '서귀포시'],
  },
];

/** 하위 호환 — 광역시+도 라벨 목록 (시드용) */
export const KOREA_SIDOS = [
  ...KOREA_METROS.map((m) => ({ code: m.code, label: m.label })),
  ...KOREA_PROVINCES.map((p) => ({ code: p.code, label: p.label })),
];

/**
 * API cities가 없을 때(프리뷰) — 라벨을 id로 쓰는 시 단위 목록
 * @returns {ReturnType<typeof buildCityUnitOptions>}
 */
export function buildStaticCityUnitOptions() {
  /** @type {ReturnType<typeof buildCityUnitOptions>} */
  const out = [];
  KOREA_METROS.forEach((m) => {
    out.push({
      id: `metro-${m.code}`,
      label: m.label,
      sido_code: m.code,
      sido_name: m.label,
      kind: 'metro',
    });
  });
  KOREA_PROVINCES.forEach((p) => {
    p.cities.forEach((city, i) => {
      out.push({
        id: `city-${p.code}-${i}`,
        label: city,
        sido_code: p.code,
        sido_name: p.label,
        kind: 'city',
      });
    });
  });
  return out;
}

/**
 * API cities + 정적 목록으로 시 단위 옵션을 만든다.
 * @param {Array<{id: number|string, label: string, sido_code?: string, sido_name?: string, kind?: string}>} [apiCities]
 * @returns {Array<{id: string, label: string, sido_code: string, sido_name: string, kind: 'metro'|'city'}>}
 */
export function buildCityUnitOptions(apiCities = []) {
  /** @type {Map<string, string>} label|sido+label → id */
  const byKey = new Map();
  (apiCities || []).forEach((c) => {
    const label = String(c.label || '').trim();
    if (!label) return;
    const id = String(c.id);
    byKey.set(label, id);
    const sido = String(c.sido_name || '').trim();
    if (sido) byKey.set(`${sido}|${label}`, id);
    if (c.kind === 'metro' || KOREA_METROS.some((m) => m.label === label)) {
      byKey.set(label, id);
    }
  });

  /** @type {Array<{id: string, label: string, sido_code: string, sido_name: string, kind: 'metro'|'city'}>} */
  const out = [];

  KOREA_METROS.forEach((m) => {
    const id = byKey.get(m.label) || '';
    if (!id) return;
    out.push({
      id,
      label: m.label,
      sido_code: m.code,
      sido_name: m.label,
      kind: 'metro',
    });
  });

  KOREA_PROVINCES.forEach((p) => {
    p.cities.forEach((city) => {
      const id = byKey.get(`${p.label}|${city}`) || byKey.get(city) || '';
      if (!id) return;
      out.push({
        id,
        label: city,
        sido_code: p.code,
        sido_name: p.label,
        kind: 'city',
      });
    });
  });

  return out.length ? out : buildStaticCityUnitOptions();
}

/** @deprecated use buildCityUnitOptions */
export function buildSidoCityOptions(apiCities = []) {
  return buildCityUnitOptions(apiCities).map((c) => ({
    id: c.id,
    label: c.kind === 'metro' ? c.label : `${c.sido_name} ${c.label}`,
    code: c.sido_code,
  }));
}

/**
 * @param {Array<{id: number|string, label: string}>} regions
 */
export function cityOptionsFromRegionLabels(regions = []) {
  return buildCityUnitOptions(
    (regions || []).map((r) => {
      const parts = String(r.label || '')
        .trim()
        .split(/\s+/);
      if (parts.length >= 2) {
        return { id: r.id, label: parts[1], sido_name: parts[0] };
      }
      return { id: r.id, label: parts[0] || '' };
    }),
  );
}

/**
 * region_id → 부모 선택값(metro code or province code) + 시 라벨
 * @param {string|number} regionId
 * @param {ReturnType<typeof buildCityUnitOptions>} units
 */
export function resolveCitySelection(regionId, units) {
  const hit = (units || []).find((u) => String(u.id) === String(regionId));
  if (!hit) return { parent: '', cityLabel: '', unit: null };
  if (hit.kind === 'metro') {
    return { parent: `metro:${hit.sido_code}`, cityLabel: hit.label, unit: hit };
  }
  return { parent: `prov:${hit.sido_code}`, cityLabel: hit.label, unit: hit };
}

/**
 * 상위(광역시/도) 옵션 HTML
 * @param {string} selectedParent metro:XX | prov:XX
 */
export function renderRegionParentOptions(selectedParent = '') {
  const groups = [
    ['광역시·특별시', KOREA_METROS.map((m) => ({ value: `metro:${m.code}`, label: m.label }))],
    ['도', KOREA_PROVINCES.map((p) => ({ value: `prov:${p.code}`, label: p.label }))],
  ];
  return [
    '<option value="">광역시 또는 도 선택</option>',
    ...groups.flatMap(([group, opts]) => [
      `<optgroup label="${group}">`,
      ...opts.map(
        (o) =>
          `<option value="${o.value}" ${o.value === selectedParent ? 'selected' : ''}>${o.label}</option>`,
      ),
      '</optgroup>',
    ]),
  ].join('');
}

/**
 * 도 하위 시 옵션 HTML
 * @param {string} provinceCode
 * @param {string} selectedCity
 * @param {ReturnType<typeof buildCityUnitOptions>} units
 */
export function renderProvinceCityOptions(provinceCode, selectedCity, units) {
  const prov = KOREA_PROVINCES.find((p) => p.code === provinceCode);
  if (!prov) return '<option value="">시 선택</option>';
  const available = new Set(
    (units || [])
      .filter((u) => u.kind === 'city' && u.sido_code === provinceCode)
      .map((u) => u.label),
  );
  const list = available.size ? prov.cities.filter((c) => available.has(c)) : prov.cities;
  return [
    '<option value="">시 선택</option>',
    ...list.map(
      (c) => `<option value="${c}" ${c === selectedCity ? 'selected' : ''}>${c}</option>`,
    ),
  ].join('');
}

/**
 * parent + cityLabel → region_id
 * @param {string} parent
 * @param {string} cityLabel
 * @param {ReturnType<typeof buildCityUnitOptions>} units
 */
export function regionIdFromSelection(parent, cityLabel, units) {
  if (!parent) return '';
  if (parent.startsWith('metro:')) {
    const code = parent.slice(6);
    const hit = (units || []).find((u) => u.kind === 'metro' && u.sido_code === code);
    return hit?.id || '';
  }
  if (parent.startsWith('prov:')) {
    const code = parent.slice(5);
    const hit = (units || []).find(
      (u) => u.kind === 'city' && u.sido_code === code && u.label === cityLabel,
    );
    return hit?.id || '';
  }
  return '';
}
