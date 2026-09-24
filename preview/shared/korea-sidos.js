/**
 * 과외지역 1차 = 도·광역시·특별시·세종.
 * 광역은 그 선택으로 끝. 도는 2차에서 시와 군을 고른다.
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
      '가평군',
      '양평군',
      '연천군',
    ],
  },
  {
    code: '51',
    label: '강원특별자치도',
    cities: [
      '춘천시',
      '원주시',
      '강릉시',
      '동해시',
      '태백시',
      '속초시',
      '삼척시',
      '홍천군',
      '횡성군',
      '영월군',
      '평창군',
      '정선군',
      '철원군',
      '화천군',
      '양구군',
      '인제군',
      '고성군',
      '양양군',
    ],
  },
  {
    code: '43',
    label: '충청북도',
    cities: ['청주시', '충주시', '제천시', '보은군', '옥천군', '영동군', '증평군', '진천군', '괴산군', '음성군', '단양군'],
  },
  {
    code: '44',
    label: '충청남도',
    cities: [
      '천안시',
      '공주시',
      '보령시',
      '아산시',
      '서산시',
      '논산시',
      '계룡시',
      '당진시',
      '금산군',
      '부여군',
      '서천군',
      '청양군',
      '홍성군',
      '예산군',
      '태안군',
    ],
  },
  {
    code: '52',
    label: '전북특별자치도',
    cities: [
      '전주시',
      '군산시',
      '익산시',
      '정읍시',
      '남원시',
      '김제시',
      '완주군',
      '진안군',
      '무주군',
      '장수군',
      '임실군',
      '순창군',
      '고창군',
      '부안군',
    ],
  },
  {
    code: '46',
    label: '전라남도',
    cities: [
      '목포시',
      '여수시',
      '순천시',
      '나주시',
      '광양시',
      '담양군',
      '곡성군',
      '구례군',
      '고흥군',
      '보성군',
      '화순군',
      '장흥군',
      '강진군',
      '해남군',
      '영암군',
      '무안군',
      '함평군',
      '영광군',
      '장성군',
      '완도군',
      '진도군',
      '신안군',
    ],
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
      '의성군',
      '청송군',
      '영양군',
      '영덕군',
      '청도군',
      '고령군',
      '성주군',
      '칠곡군',
      '예천군',
      '봉화군',
      '울진군',
      '울릉군',
    ],
  },
  {
    code: '48',
    label: '경상남도',
    cities: [
      '창원시',
      '진주시',
      '통영시',
      '사천시',
      '김해시',
      '밀양시',
      '거제시',
      '양산시',
      '의령군',
      '함안군',
      '창녕군',
      '고성군',
      '남해군',
      '하동군',
      '산청군',
      '함양군',
      '거창군',
      '합천군',
    ],
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

/** 시 단위 화면 라벨. 광역은 그 이름, 도는 「경기도 의정부시」 */
export function activityLabelForUnit(unit) {
  if (!unit) return '';
  return unit.kind === 'metro' ? unit.label : `${unit.sido_name} ${unit.label}`;
}

/** @deprecated use buildCityUnitOptions */
export function buildSidoCityOptions(apiCities = []) {
  return buildCityUnitOptions(apiCities).map((c) => ({
    id: c.id,
    label: activityLabelForUnit(c),
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
  if (!prov) return '<option value="">시·군 선택</option>';
  const list = prov.cities;
  return [
    '<option value="">시·군 선택</option>',
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
    return numericRegionId(hit?.id);
  }
  if (parent.startsWith('prov:')) {
    const code = parent.slice(5);
    const hit = (units || []).find(
      (u) => u.kind === 'city' && u.sido_code === code && u.label === cityLabel,
    );
    return numericRegionId(hit?.id);
  }
  return '';
}

/**
 * 화면 라벨(「경기도 의정부시」·광역시명) → 시 단위 region_id.
 * 행정동 라벨은 쓰지 않는다.
 * @param {string} activityLabel
 * @param {ReturnType<typeof buildCityUnitOptions>} units
 */
export function regionIdFromActivityLabel(activityLabel, units) {
  const text = String(activityLabel || '').trim();
  if (!text) return '';
  const list = units || [];
  const full = list.find((u) => activityLabelForUnit(u) === text);
  const fullId = numericRegionId(full?.id);
  if (fullId) return fullId;
  const bare = list.filter((u) => u.label === text && numericRegionId(u.id));
  return bare.length === 1 ? String(bare[0].id) : '';
}

/**
 * region_id → 화면 라벨(「경기도 의정부시」)
 * @param {string|number} regionId
 * @param {ReturnType<typeof buildCityUnitOptions>} units
 */
export function activityLabelFromRegionId(regionId, units) {
  const hit = (units || []).find((u) => String(u.id) === String(regionId));
  return activityLabelForUnit(hit);
}

/** 정적 프리뷰 id(city-41-2)는 저장용이 아니다 */
function numericRegionId(id) {
  const text = String(id ?? '').trim();
  return /^\d+$/.test(text) ? text : '';
}
