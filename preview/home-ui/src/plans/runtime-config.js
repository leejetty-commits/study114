/**
 * 34장 — 유료상품 런타임 설정
 * 가격·기간·할인 정본은 서버 PaidCatalog (catalog-store).
 * 이 파일에 판매가를 독립 정본으로 두지 않는다.
 */

import {
  findCatalogProduct,
  findCatalogOption,
  isCatalogReady,
  getCatalogError,
  getCatalogState,
  hydratePaidCatalog,
} from './catalog-store.js';

export {
  hydratePaidCatalog,
  isCatalogReady,
  getCatalogError,
  getCatalogState,
  findCatalogProduct,
  findCatalogOption,
};

const TEST_MODE_KEY = 'study114-plans-test-mode';

/** @typedef {'position'|'access'} ProductFamily */

/**
 * @typedef {object} PriceOption
 * @property {string} optionId
 * @property {'day'|'month'} [durationType]
 * @property {number} [durationValue]
 * @property {number} [creditCount]
 * @property {number} priceKrw
 * @property {number} [listPriceKrw]
 * @property {number} [discountKrw]
 * @property {number} [discountRate]
 * @property {string} label
 * @property {string} apiVariant
 * @property {string} [marketingBadge]
 * @property {string} [discountLabel]
 * @property {string} [bundleNote]
 * @property {number} [memoBundle]
 * @property {string} [ticketKind]
 * @property {number|null} [expireDays]
 * @property {boolean} [balanceStored]
 */

/**
 * @typedef {object} CatalogProductConfig
 * @property {string} productCode
 * @property {ProductFamily|string} family
 * @property {'study_room'|'tutor'|'both'} providerType
 * @property {string} name
 * @property {string} tagline
 * @property {string[]} bullets
 * @property {string} [positionCode]
 * @property {boolean} [featured]
 * @property {boolean} [implemented]
 * @property {boolean} [periodInherited]
 * @property {PriceOption[]} [options]
 */

/** 슬롯·순환 등 비가격 런타임 (가격 SSOT 아님) */
export const PLAN_RUNTIME_DEFAULTS = {
  prime_slots: 3,
  region_scope_type: 'dong',
  demo_prime_filled: 1,
  demo_prime_tutor_pool: 12,
  pick_set_size: 5,
  pick_rotation_minutes: 15,
  pick_page_size: 5,
  basic_page_size: 20,
  pick_slots: 10,
  message_credit_pack: [1, 5, 10],
  credit_expire_days: 120,
  low_credit_threshold: 0.2,
  order_expire_minutes: 30,
  prime_expire_alert_days: [7, 3, 1],
  pick_expire_alert_days: [7, 1],
  recommended_first: true,
  default_landing_study_room: '/plans/positions',
  default_landing_tutor: '/plans',
  payment_methods: ['card', 'transfer', 'vbank'],
  prime_empty_title_study_room: '이 자리에 공부방을 홍보하세요',
  prime_empty_body_study_room: '우리 동네 상단 노출을 먼저 잡아보세요',
  prime_empty_title_tutor: '이 자리에 과외쌤을 홍보하세요',
  prime_empty_body_tutor: '지금 먼저 선점하세요 · 동네 상단 노출',
};

/** @deprecated 서버 카탈로그 memo_bundle 사용 */
export const TUTOR_POSITION_MEMO_BUNDLE = {
  pick: {},
  prime: {},
};

/** 카피용 메타 — 가격 없음 */
const PRODUCT_COPY = {
  prime: {
    tagline: '선택한 지역·과목의 대표 노출',
    bullets: ['기간형 단건 결제', '자동연장 없음', '만료 후 Basic 복귀'],
    featured: true,
    implemented: true,
    family: 'position',
    positionCode: 'home_*_prime_top',
  },
  pick: {
    tagline: '페이지 순환형 추천 노출',
    bullets: ['기간형 단건 결제', '자동연장 없음', '만료 후 Basic 복귀'],
    featured: true,
    implemented: true,
    family: 'position',
    positionCode: 'home_*_pick_grid',
  },
  memo_ticket: {
    tagline: '학생에게 먼저 보내는 첫 쪽지 횟수권',
    bullets: ['선제 쪽지만 차감', '묶음권 120일(서버 메타)', '답장·후속 무료'],
    featured: true,
    implemented: true,
    family: 'access',
  },
  hot: {
    tagline: '홍보 배지 · 노출상품 기간 상속',
    bullets: ['최대 1개', 'New·추천 판매 아님'],
    family: 'badge_addon',
    featured: false,
    implemented: true,
  },
  subject_track: {
    tagline: '공부방 단과 홍보 배지 · 기간 상속',
    bullets: ['공부방 전용', '노출상품 기간과 동일'],
    family: 'badge_addon',
    featured: false,
    implemented: true,
  },
  jjokjipge: {
    tagline: '과외쌤 쪽집게 홍보 배지 · 기간 상속',
    bullets: ['과외쌤 전용', '사실표시와 구분'],
    family: 'badge_addon',
    featured: false,
    implemented: true,
  },
  sky: {
    tagline: '과외쌤 SKY 홍보 배지 · 기간 상속',
    bullets: ['플랫폼 인증 아님', '노출상품 기간과 동일'],
    family: 'badge_addon',
    featured: false,
    implemented: true,
  },
};

function discountLabelFromRate(rate) {
  const pct = Math.round(Number(rate) * 100);
  return pct > 0 ? `${pct}% 할인` : '';
}

/**
 * @param {import('./catalog-store.js').CatalogProduct} serverProduct
 * @returns {CatalogProductConfig}
 */
function mapServerProduct(serverProduct) {
  const code = serverProduct.product_code;
  const copy = PRODUCT_COPY[code] || {
    tagline: '',
    bullets: [],
    family: serverProduct.family,
    featured: false,
    implemented: true,
  };
  const options = (serverProduct.options || []).map((o) => {
    const memo = Number(o.memo_bundle) || 0;
    const rate = Number(o.discount_rate) || 0;
    return {
      optionId: o.option_id,
      durationType: o.duration_type,
      durationValue: o.duration_value,
      creditCount: o.credit_count,
      priceKrw: Number(o.sale_price_krw),
      listPriceKrw: Number(o.list_price_krw),
      discountKrw: Number(o.discount_krw),
      discountRate: rate,
      label: o.label || o.period || o.api_variant,
      apiVariant: o.api_variant,
      discountLabel: discountLabelFromRate(rate),
      memoBundle: memo,
      bundleNote: memo > 0 ? `쪽지권 ${memo}회 포함` : undefined,
      ticketKind: o.ticket_kind,
      expireDays: o.expire_days ?? null,
      balanceStored: o.balance_stored,
    };
  });

  return {
    productCode: code,
    family: copy.family || serverProduct.family,
    providerType: /** @type {'study_room'|'tutor'|'both'} */ (serverProduct.provider_type),
    name: serverProduct.name,
    tagline: copy.tagline,
    bullets: copy.bullets,
    positionCode: copy.positionCode,
    featured: copy.featured,
    implemented: copy.implemented,
    periodInherited: Boolean(serverProduct.period_inherited),
    options,
  };
}

/** @returns {typeof PLAN_RUNTIME_DEFAULTS} */
export function getPlanRuntimeSettings() {
  const state = getCatalogState();
  const expire = state?.memo_pack_expire_days || PLAN_RUNTIME_DEFAULTS.credit_expire_days;
  return { ...PLAN_RUNTIME_DEFAULTS, credit_expire_days: expire };
}

/** @param {string} key */
export function getPlanSetting(key) {
  return getPlanRuntimeSettings()[key];
}

export function isPlansTestMode() {
  try {
    const v = sessionStorage.getItem(TEST_MODE_KEY);
    if (v === null) return false;
    return v === '1';
  } catch {
    return false;
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
 * @param {string} productCode
 * @param {'study_room'|'tutor'|string} [providerType]
 * @returns {CatalogProductConfig | null}
 */
export function getProductConfig(productCode, providerType) {
  if (!isCatalogReady()) return null;
  const server = findCatalogProduct(productCode, providerType);
  return server ? mapServerProduct(server) : null;
}

/**
 * @param {'position'|'access'|string} [family]
 * @param {'study_room'|'tutor'|string} [providerType]
 */
export function getCatalogByFamily(family, providerType) {
  if (!isCatalogReady()) return [];
  const state = getCatalogState();
  return (state?.products || [])
    .filter((p) => {
      if (family === 'position' && p.family !== 'position') return false;
      if (family === 'access' && p.family !== 'access') return false;
      if (family && family !== 'position' && family !== 'access' && p.family !== family) return false;
      if (!providerType) return true;
      return p.provider_type === 'both' || p.provider_type === providerType;
    })
    .map(mapServerProduct);
}

/**
 * @param {string} productCode
 * @param {string} optionId
 * @param {'study_room'|'tutor'|string} [providerType]
 */
export function getPriceOption(productCode, optionId, providerType) {
  const product = getProductConfig(productCode, providerType);
  return product?.options?.find((o) => o.optionId === optionId) || null;
}

/**
 * 표시·결제 금액 = 서버 판매가. 클라이언트 할인/테스트 10원 오버라이드 없음.
 * @param {number} priceKrw
 * @returns {{ displayKrw: number, chargeKrw: number, testMode: boolean }}
 */
export function resolveCheckoutAmount(priceKrw) {
  const n = Number(priceKrw) || 0;
  return {
    displayKrw: n,
    chargeKrw: n,
    testMode: isPlansTestMode(),
  };
}

/** @param {number} n */
export function formatKrw(n) {
  return `${Number(n).toLocaleString('ko-KR')}원`;
}

/**
 * 배지 가격 — 서버 카탈로그 기간 상속 옵션
 * @param {'study_room'|'tutor'|string} providerType
 * @param {number} [durationMonths] 1=1개월, 2=2개월… / 0.5≈2주 는 period로 조회 권장
 * @param {string} [badgeCode='hot']
 * @param {string} [period]
 */
export function badgePriceKrw(providerType, durationMonths = 1, badgeCode = 'hot', period) {
  if (!isCatalogReady()) {
    return null;
  }
  let periodLabel = period;
  if (!periodLabel) {
    const m = Number(durationMonths);
    if (m === 0.5 || m < 1) periodLabel = '2주';
    else if (m >= 6) periodLabel = '6개월';
    else if (m >= 3) periodLabel = '3개월';
    else if (m >= 2) periodLabel = '2개월';
    else periodLabel = '1개월';
  }
  const opt = findCatalogOption(badgeCode, periodLabel, providerType);
  if (!opt) return null;
  return Number(opt.sale_price_krw);
}

/**
 * @param {{ duration_type?: string, duration_value?: number, sku?: string } | null | undefined} position
 */
export function positionDurationMonths(position) {
  if (!position) return 1;
  if (String(position.duration_type || '') === 'month') {
    return Math.max(1, Number(position.duration_value) || 1);
  }
  return 1;
}

/** @deprecated 서버 카탈로그 hydrate 후 getCatalogByFamily 사용 */
export const PLAN_CATALOG_SEED = [];
