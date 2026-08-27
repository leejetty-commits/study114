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
 * @property {'day'|'month'} [durationType]
 * @property {number} [durationValue]
 * @property {number} [durationDays] deprecated — durationType=day 일 때 durationValue
 * @property {number} [creditCount]
 * @property {number} priceKrw
 * @property {string} label
 * @property {string} apiVariant — mock PG / PHP checkout 호환 라벨
 * @property {string} [marketingBadge]
 * @property {string} [discountLabel]
 * @property {string} [bundleNote]
 * @property {number} [memoBundle]
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
 * @property {Record<'study_room'|'tutor', PriceOption[]>} [optionsByRole]
 * @property {Record<'study_room'|'tutor', string>} [cardBadgeByRole]
 */

/** @type {Record<string, number|string|boolean|number[]|object>} */
export const PLAN_RUNTIME_DEFAULTS = {
  /** 지역(행정동/단지) 단위 대표 노출 자리 수 */
  prime_slots: 3,
  /** 지역 기준: 행정동 | 단지 */
  region_scope_type: 'dong',
  /** 데모: 공부방 대표 노출 유료 점유 시뮬레이션 수(빈 카드 표시용). 실제 구독 연동 시 무시 */
  demo_prime_filled: 1,
  /**
   * 데모: 과외쌤 대표 노출 후보 풀 크기(시 단위 · 3자리×페이지·15분 순환).
   * 공부방 대표 노출은 demo_prime_filled만 사용(고정 3자리).
   */
  demo_prime_tutor_pool: 12,
  /** 추천 노출 1세트 크기 */
  pick_set_size: 5,
  /** 추천 노출·과외쌤 대표 노출 공통 순환 간격(분) — 15 | 30 */
  pick_rotation_minutes: 15,
  /** 추천 노출 페이지 = 세트 크기와 동일 */
  pick_page_size: 5,
  /** 기본 노출 페이지 크기(위로 올리기 상품 없음) */
  basic_page_size: 20,
  /** 예전 호환 — 추천 노출 판매 상한 안내용(세트·페이지와 별개) */
  pick_slots: 10,
  message_credit_pack: [5, 10, 20],
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
 * 과외쌤 포지션 구매 시 쪽지권 실지급 수.
 * 서버 정본: src/Paid/TutorPositionMemoBundle.php
 * @type {Record<string, Record<string, number>>}
 */
export const TUTOR_POSITION_MEMO_BUNDLE = {
  pick: { '2주': 1, '1개월': 2, '2개월': 4 },
  prime: { '1개월': 5, '2개월': 10 },
};

/** 부가배지 월 단가 — 2개월 포지션이면 ×2. 추천(통계)·New(자동)는 판매 아님. */
export const BADGE_MONTHLY_KRW = {
  study_room: 5000,
  tutor: 10000,
};

/**
 * @param {'study_room'|'tutor'|string} providerType
 * @param {number} [durationMonths]
 */
export function badgePriceKrw(providerType, durationMonths = 1) {
  const monthly = providerType === 'tutor' ? BADGE_MONTHLY_KRW.tutor : BADGE_MONTHLY_KRW.study_room;
  const months = Math.max(1, Number(durationMonths) || 1);
  return monthly * months;
}

/**
 * 활성 포지션 → 배지 과금 개월. 2주(day)는 월 단가 1회.
 * @param {{ duration_type?: string, duration_value?: number, sku?: string } | null | undefined} position
 */
export function positionDurationMonths(position) {
  if (!position) return 1;
  if (String(position.duration_type || '') === 'month') {
    return Math.max(1, Number(position.duration_value) || 1);
  }
  return 1;
}

/**
 * 표시 가격 = 2026-08-28 노션 확정표. apiVariant는 PHP mock PG 호환.
 * 21일·3개월·Prime 2주는 판매 목록에서 제거.
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
    cardBadgeByRole: { study_room: 'BEST', tutor: 'BEST' },
    optionsByRole: {
      study_room: [
        {
          optionId: 'prime_1m',
          durationType: 'month',
          durationValue: 1,
          priceKrw: 50000,
          label: '1개월',
          apiVariant: '1개월',
          marketingBadge: 'BEST',
        },
        {
          optionId: 'prime_2m',
          durationType: 'month',
          durationValue: 2,
          priceKrw: 90000,
          label: '2개월',
          apiVariant: '2개월',
          marketingBadge: '강력추천',
          discountLabel: '10% 할인',
        },
      ],
      tutor: [
        {
          optionId: 'prime_1m',
          durationType: 'month',
          durationValue: 1,
          priceKrw: 30000,
          label: '1개월',
          apiVariant: '1개월',
          marketingBadge: 'BEST',
          memoBundle: 5,
          bundleNote: '쪽지권 5회 포함',
        },
        {
          optionId: 'prime_2m',
          durationType: 'month',
          durationValue: 2,
          priceKrw: 55000,
          label: '2개월',
          apiVariant: '2개월',
          marketingBadge: '대박할인',
          discountLabel: '8% 할인',
          memoBundle: 10,
          bundleNote: '쪽지권 10회 포함',
        },
      ],
    },
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
    cardBadgeByRole: { study_room: '기본', tutor: '인기' },
    optionsByRole: {
      study_room: [
        {
          optionId: 'pick_14',
          durationType: 'day',
          durationValue: 14,
          priceKrw: 15000,
          label: '2주',
          apiVariant: '2주',
          marketingBadge: '체험',
        },
        {
          optionId: 'pick_1m',
          durationType: 'month',
          durationValue: 1,
          priceKrw: 30000,
          label: '1개월',
          apiVariant: '1개월',
          marketingBadge: '기본',
        },
        {
          optionId: 'pick_2m',
          durationType: 'month',
          durationValue: 2,
          priceKrw: 55000,
          label: '2개월',
          apiVariant: '2개월',
          marketingBadge: '할인',
          discountLabel: '8% 할인',
        },
      ],
      tutor: [
        {
          optionId: 'pick_14',
          durationType: 'day',
          durationValue: 14,
          priceKrw: 10000,
          label: '2주',
          apiVariant: '2주',
          marketingBadge: '파격',
          memoBundle: 1,
          bundleNote: '쪽지권 1회 포함',
        },
        {
          optionId: 'pick_1m',
          durationType: 'month',
          durationValue: 1,
          priceKrw: 20000,
          label: '1개월',
          apiVariant: '1개월',
          marketingBadge: '인기',
          memoBundle: 2,
          bundleNote: '쪽지권 2회 포함',
        },
        {
          optionId: 'pick_2m',
          durationType: 'month',
          durationValue: 2,
          priceKrw: 35000,
          label: '2개월',
          apiVariant: '2개월',
          marketingBadge: '추천',
          discountLabel: '12.5% 할인',
          memoBundle: 4,
          bundleNote: '쪽지권 4회 포함',
        },
      ],
    },
  },
  // region_top / basic_boost — 판매 상품에서 제거(기본 노출 올리기 상품 없음)
  {
    productCode: 'memo_ticket',
    family: 'access',
    providerType: 'both',
    name: '쪽지권',
    tagline: '학생에게 먼저 보내는 쪽지 횟수권 · 먼저 산 이용권부터 차감',
    bullets: ['먼저 산 이용권부터 차감', '사용기한 180일', '학부모가 먼저 보낸 쪽지와 답장은 무료'],
    implemented: true,
    featured: true,
    options: [
      {
        optionId: 'memo_5',
        creditCount: 5,
        priceKrw: 9900,
        label: '5회',
        apiVariant: '5회권',
        marketingBadge: '입문',
      },
      {
        optionId: 'memo_10',
        creditCount: 10,
        priceKrw: 17900,
        label: '10회',
        apiVariant: '10회권',
        marketingBadge: 'BEST',
        discountLabel: '10% 할인',
      },
      {
        optionId: 'memo_20',
        creditCount: 20,
        priceKrw: 31900,
        label: '20회',
        apiVariant: '20회권',
        marketingBadge: '가성비',
        discountLabel: '20% 할인',
      },
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
 * @param {CatalogProductConfig} product
 * @param {'study_room'|'tutor'|string} [providerType]
 * @returns {CatalogProductConfig}
 */
export function hydrateProductForRole(product, providerType) {
  const role = providerType === 'tutor' || providerType === 'study_room' ? providerType : null;
  const options =
    (role && product.optionsByRole?.[role]) ||
    product.options ||
    product.optionsByRole?.study_room ||
    [];
  const cardBadge = (role && product.cardBadgeByRole?.[role]) || '';
  return { ...product, options, cardBadge };
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
  }).map((p) => hydrateProductForRole(p, providerType));
}

/** @param {string} productCode @param {'study_room'|'tutor'|string} [providerType] */
export function getProductConfig(productCode, providerType) {
  const raw = PLAN_CATALOG_SEED.find((p) => p.productCode === productCode);
  return raw ? hydrateProductForRole(raw, providerType) : null;
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
