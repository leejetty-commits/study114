/**
 * 34장 — 유료상품 런타임 seed/default
 * 컴포넌트에 가격·슬롯을 박지 말고 여기서 읽는다.
 * 이후 관리자 설정 / API 응답으로 치환 가능.
 */

const TEST_MODE_KEY = 'study114-plans-test-mode';

/** @typedef {'position'|'access'} ProductFamily */

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
  /** 지역(행정동/단지) 단위 Prime 슬롯 수 */
  prime_slots: 3,
  /** 지역 기준: dong | complex */
  region_scope_type: 'dong',
  /** 데모: 공부방 Prime 유료 점유 시뮬레이션 수 (빈 카드 노출용). 실구독 API 연동 시 무시 */
  demo_prime_filled: 1,
  /**
   * 데모: 과외쌤 Prime 후보 풀 크기 (시 단위 · 3슬롯×페이지·15분 순환용).
   * 공부방 Prime은 demo_prime_filled만 사용(고정 3슬롯).
   */
  demo_prime_tutor_pool: 12,
  /** Pick 1세트 크기 */
  pick_set_size: 5,
  /** Pick·과외쌤 Prime 공통 시간 순환 간격(분) — 15 | 30 */
  pick_rotation_minutes: 15,
  /** Pick 페이지 = 세트 크기와 동일 */
  pick_page_size: 5,
  /** Basic 페이지 크기 (부스트 상품 없음) */
  basic_page_size: 20,
  /** 레거시 호환 — Pick 판매 상한 안내용 (세트·페이지와 별개) */
  pick_slots: 10,
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
  prime_empty_title_study_room: '이 자리에 공부방을 홍보하세요',
  prime_empty_body_study_room: '우리 동네 상단 노출을 먼저 잡아보세요',
  prime_empty_title_tutor: '이 자리에 과외쌤을 홍보하세요',
  prime_empty_body_tutor: '지금 먼저 선점하세요 · 동네 상단 노출',
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
    name: '대표 노출',
    tagline: '행정동·단지 단위 선착순 한정 · 빈 슬롯은 홍보카드로 유지',
    bullets: ['지역 단위 한정 슬롯', '빈 자리 자동대체 없음', '빈 카드로 선점 유도', '기간형 단건 결제'],
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
    name: '추천 노출',
    tagline: '5개 1세트 · 페이지 · 시간대 순환',
    bullets: ['세트 크기 5', '최신 입점 1번 우선', '15·30분 순환 설정 가능', '기간형 단건 결제'],
    positionCode: 'home_*_pick_grid',
    featured: true,
    implemented: true,
    options: [
      { optionId: 'pick_14', durationDays: 14, priceKrw: 19000, label: '14일', apiVariant: '2주' },
      { optionId: 'pick_30', durationDays: 30, priceKrw: 33000, label: '30일', apiVariant: '1개월' },
      { optionId: 'pick_60', durationDays: 60, priceKrw: 55000, label: '60일', apiVariant: '2개월' },
    ],
  },
  // region_top / basic_boost — 판매 상품에서 제거 (Basic Boost 금지)
  {
    productCode: 'memo_ticket',
    family: 'access',
    providerType: 'tutor',
    name: '쪽지권',
    tagline: '학생에게 먼저 보내는 쪽지 횟수권 · 먼저 산 이용권부터 차감',
    bullets: ['먼저 산 이용권부터 차감', '사용기한 180일', '학부모가 먼저 보낸 연락과 답장은 무료'],
    implemented: true,
    featured: true,
    options: [
      { optionId: 'memo_5', creditCount: 5, priceKrw: 9900, label: '5회', apiVariant: '5회권' },
      { optionId: 'memo_10', creditCount: 10, priceKrw: 17900, label: '10회', apiVariant: '10회권' },
      { optionId: 'memo_20', creditCount: 20, priceKrw: 31900, label: '20회', apiVariant: '20회권' },
    ],
  },
  {
    productCode: 'request_view',
    family: 'access',
    providerType: 'tutor',
    name: '요청문 열람권',
    tagline: '요청문 상세 열람 · 먼저 산 이용권부터 차감',
    bullets: ['먼저 산 이용권부터 차감', '사용기한 180일', '학부모 과금 없음'],
    implemented: true,
    featured: true,
    options: [
      { optionId: 'view_5', creditCount: 5, priceKrw: 7900, label: '5회', apiVariant: '5회권' },
      { optionId: 'view_10', creditCount: 10, priceKrw: 13900, label: '10회', apiVariant: '10회권' },
      { optionId: 'view_20', creditCount: 20, priceKrw: 24900, label: '20회', apiVariant: '20회권' },
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
 * @param {'position'|'access'|string} [family]
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
