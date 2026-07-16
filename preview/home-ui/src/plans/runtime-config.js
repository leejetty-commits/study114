/**
 * 34장 — 유료상품 런타임 seed/default
 * 컴포넌트에 가격·슬롯을 박지 말고 여기서 읽는다.
 * 이후 관리자 설정 / API 응답으로 치환 가능.
 */

const TEST_MODE_KEY = 'study114-plans-test-mode';

/** @typedef {'position'|'access'|'placeholder'} ProductFamily */

/**
 * @typedef {object} PriceOption
 * @property {string} optionId
 * @property {number} [durationDays]
 * @property {number} [creditCount]
 * @property {number} priceKrw
 * @property {string} label
 * @property {string} apiVariant — mock PG / PHP checkout 호환 라벨
 */

/**
 * @typedef {object} CatalogProductConfig
 * @property {string} productCode
 * @property {ProductFamily} family
 * @property {'study_room'|'tutor'|'both'} providerType
 * @property {string} name
 * @property {string} tagline
 * @property {string[]} bullets
 * @property {string} [positionCode]
 * @property {boolean} [featured]
 * @property {boolean} [implemented]
 * @property {PriceOption[]} [options]
 */

/** @type {Record<string, number|string|boolean|number[]|object>} */
export const PLAN_RUNTIME_DEFAULTS = {
  prime_slots: 3,
  pick_slots: 10,
  basic_page_size: 20,
  message_credit_pack: [5, 10, 20],
  request_view_pack: [5, 10, 20],
  credit_expire_days: 180,
  low_credit_threshold: 0.2,
  order_expire_minutes: 30,
  prime_expire_alert_days: [7, 3, 1],
  pick_expire_alert_days: [7, 1],
  recommended_first: true,
  default_landing_study_room: '/plans/positions',
  default_landing_tutor: '/plans',
  payment_methods: ['card', 'transfer', 'vbank'],
  test_amount_krw: 10,
};

/**
 * 표시 가격 = 노션 초안가. apiVariant는 기존 PHP mock PG 호환.
 * @type {CatalogProductConfig[]}
 */
export const PLAN_CATALOG_SEED = [
  {
    productCode: 'prime',
    family: 'position',
    providerType: 'both',
    name: 'Prime',
    tagline: '최상위 희소 포지션 · 기간형',
    bullets: ['희소 슬롯 · 운영 배정', '기간형 단건 결제', '자동연장 OFF'],
    positionCode: 'home_*_prime_top',
    featured: true,
    implemented: true,
    options: [
      { optionId: 'prime_14', durationDays: 14, priceKrw: 39000, label: '14일', apiVariant: '2주' },
      { optionId: 'prime_30', durationDays: 30, priceKrw: 69000, label: '30일', apiVariant: '1개월' },
      { optionId: 'prime_60', durationDays: 60, priceKrw: 119000, label: '60일', apiVariant: '2개월' },
      { optionId: 'prime_90', durationDays: 90, priceKrw: 159000, label: '90일', apiVariant: '3개월' },
    ],
  },
  {
    productCode: 'pick',
    family: 'position',
    providerType: 'both',
    name: 'Pick',
    tagline: 'Prime 아래 포지션 · 기간형',
    bullets: ['동네 노출 유지', '시즌 예약은 후순위', '자동연장 OFF'],
    positionCode: 'home_*_pick_grid',
    featured: true,
    implemented: true,
    options: [
      { optionId: 'pick_14', durationDays: 14, priceKrw: 19000, label: '14일', apiVariant: '2주' },
      { optionId: 'pick_30', durationDays: 30, priceKrw: 33000, label: '30일', apiVariant: '1개월' },
      { optionId: 'pick_60', durationDays: 60, priceKrw: 55000, label: '60일', apiVariant: '2개월' },
    ],
  },
  {
    productCode: 'region_top',
    family: 'placeholder',
    providerType: 'both',
    name: '지역 상단 노출',
    tagline: '1차 placeholder · 다음 스프린트',
    bullets: ['구조만 확보', '실구매는 후순위'],
    implemented: false,
    options: [],
  },
  {
    productCode: 'basic_boost',
    family: 'placeholder',
    providerType: 'both',
    name: 'Basic Boost',
    tagline: '1차 placeholder · 다음 스프린트',
    bullets: ['구조만 확보', '실구매는 후순위'],
    implemented: false,
    options: [],
  },
  {
    productCode: 'memo_ticket',
    family: 'access',
    providerType: 'tutor',
    name: '쪽지권',
    tagline: '선제 쪽지 횟수권 · 1.5차',
    bullets: ['FIFO 차감', '사용기한 180일', '이번 스프린트 준비중'],
    implemented: false,
    options: [
      { optionId: 'memo_5', creditCount: 5, priceKrw: 9900, label: '5회', apiVariant: '5회권' },
      { optionId: 'memo_10', creditCount: 10, priceKrw: 17900, label: '10회', apiVariant: '10회권' },
      { optionId: 'memo_20', creditCount: 20, priceKrw: 31900, label: '20회', apiVariant: '10회권' },
    ],
  },
  {
    productCode: 'request_view',
    family: 'access',
    providerType: 'tutor',
    name: '요청문 열람권',
    tagline: '요청문 상세 열람 · 1.5차',
    bullets: ['FIFO 차감', '사용기한 180일', '이번 스프린트 준비중'],
    implemented: false,
    options: [
      { optionId: 'view_5', creditCount: 5, priceKrw: 7900, label: '5회', apiVariant: '5회권' },
      { optionId: 'view_10', creditCount: 10, priceKrw: 13900, label: '10회', apiVariant: '10회권' },
      { optionId: 'view_20', creditCount: 20, priceKrw: 24900, label: '20회', apiVariant: '10회권' },
    ],
  },
];

/** @returns {typeof PLAN_RUNTIME_DEFAULTS} */
export function getPlanRuntimeSettings() {
  return { ...PLAN_RUNTIME_DEFAULTS };
}

/** @param {string} key */
export function getPlanSetting(key) {
  return PLAN_RUNTIME_DEFAULTS[key];
}

export function isPlansTestMode() {
  try {
    const v = sessionStorage.getItem(TEST_MODE_KEY);
    if (v === null) return true;
    return v === '1';
  } catch {
    return true;
  }
}

/** @param {boolean} on */
export function setPlansTestMode(on) {
  try {
    sessionStorage.setItem(TEST_MODE_KEY, on ? '1' : '0');
  } catch {
    /* ignore */
  }
}

/**
 * @param {'position'|'access'|'placeholder'|string} [family]
 * @param {'study_room'|'tutor'|string} [providerType]
 */
export function getCatalogByFamily(family, providerType) {
  return PLAN_CATALOG_SEED.filter((p) => {
    if (family && p.family !== family) return false;
    if (!providerType) return true;
    return p.providerType === 'both' || p.providerType === providerType;
  });
}

/** @param {string} productCode */
export function getProductConfig(productCode) {
  return PLAN_CATALOG_SEED.find((p) => p.productCode === productCode) || null;
}

/** @param {string} productCode @param {string} optionId */
export function getPriceOption(productCode, optionId) {
  const product = getProductConfig(productCode);
  return product?.options?.find((o) => o.optionId === optionId) || null;
}

/**
 * @param {number} priceKrw
 * @returns {{ displayKrw: number, chargeKrw: number, testMode: boolean }}
 */
export function resolveCheckoutAmount(priceKrw) {
  const testMode = isPlansTestMode();
  const testAmount = Number(PLAN_RUNTIME_DEFAULTS.test_amount_krw) || 10;
  return {
    displayKrw: priceKrw,
    chargeKrw: testMode ? testAmount : priceKrw,
    testMode,
  };
}

/** @param {number} n */
export function formatKrw(n) {
  return `${Number(n).toLocaleString('ko-KR')}원`;
}
