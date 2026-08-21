/** 18장 2026-07-07 — P15-09 · P18-01 카탈로그
 * 가격·기간 표시는 plans/runtime-config.js seed를 우선한다.
 */

import {
  getCatalogByFamily,
  getProductConfig,
  formatKrw,
  resolveCheckoutAmount,
  isPlansTestMode,
} from '../plans/runtime-config.js';

/** @typedef {'position'|'count'|'badge_addon'} CatalogKind */

/**
 * @typedef {object} CatalogProduct
 * @property {string} id
 * @property {string} name
 * @property {string} tagline
 * @property {CatalogKind} kind
 * @property {string[]} bullets
 * @property {boolean} [featured]
 */

/** @deprecated seed는 runtime-config — 호환용 라벨 */
export const PERIOD_OPTIONS = ['14일', '21일', '1개월', '2개월', '3개월'];
export const COUNT_PACK_OPTIONS = ['5회', '10회', '20회'];
export const DUMMY_PRICE = '10원';

function familyToKind(family) {
  if (family === 'position') return 'position';
  if (family === 'access') return 'count';
  return 'badge_addon';
}

/** @param {import('../plans/runtime-config.js').CatalogProductConfig} p */
function toCatalogProduct(p) {
  return {
    id: p.productCode,
    name: p.name,
    tagline: p.tagline,
    kind: /** @type {CatalogKind} */ (familyToKind(p.family)),
    bullets: p.bullets,
    featured: p.featured,
  };
}

/** @type {Record<string, CatalogProduct>} */
const PRODUCTS = {
  prime: toCatalogProduct(getProductConfig('prime')),
  pick: toCatalogProduct(getProductConfig('pick')),
  memo_ticket: toCatalogProduct(getProductConfig('memo_ticket')),
  request_view: toCatalogProduct(getProductConfig('request_view')),
  hot: {
    id: 'hot',
    name: 'Hot',
    tagline: '추천·대표 노출 이용 기간에 함께 적용',
    kind: 'badge_addon',
    bullets: ['광고성 주목 배지', '플랫폼 인증처럼 보이지 않게', '단독 핵심상품 ✕'],
  },
  subject_track: {
    id: 'subject_track',
    name: '단과',
    tagline: '공부방 전용 · 추천·대표 노출 이용 기간에 함께 적용',
    kind: 'badge_addon',
    bullets: ['공부방 유료 아이콘', '「전문」아이콘 금지 — 단과로 표기', '단독 핵심상품 ✕'],
  },
  jjokjipge: {
    id: 'jjokjipge',
    name: '쪽집게',
    tagline: '과외쌤 · 추천·대표 노출 이용 기간에 함께 적용',
    kind: 'badge_addon',
    bullets: ['광고성 자기선언 배지', 'API 코드 jjokjipge (구 picked alias)', 'SKY·학력 등 사실표시와 구분', '단독 핵심상품 ✕'],
  },
  sky: {
    id: 'sky',
    name: 'SKY',
    tagline: '과외쌤 유료 광고축 · 추천·대표 노출 이용 기간에 함께 적용',
    kind: 'badge_addon',
    bullets: ['과외쌤 유료 주목 배지', '대학명 자동추론 배지 아님', '단독 핵심상품 ✕'],
  },
};

/** 2026-08-21 잠금 — New·추천 통계는 판매 배지 아님 */
export const STUDY_ROOM_CATALOG_IDS = [
  'prime',
  'pick',
  'hot',
  'subject_track',
  'memo_ticket',
  'request_view',
];

/** 2026-08-21 잠금 — Hot / 쪽집게(jjokjipge) / SKY */
export const TUTOR_CATALOG_IDS = [
  'memo_ticket',
  'request_view',
  'pick',
  'prime',
  'hot',
  'jjokjipge',
  'sky',
];

/** @param {'study_room'|'tutor'|string} role */
export function getPaidCatalog(role) {
  const ids = role === 'study_room' ? STUDY_ROOM_CATALOG_IDS : TUTOR_CATALOG_IDS;
  return ids.map((id) => PRODUCTS[id]).filter(Boolean);
}

/** @param {CatalogProduct} item */
export function getCatalogVariants(item) {
  const cfg = getProductConfig(item.id);
  if (cfg?.options?.length) {
    return cfg.options.map((o) => o.label);
  }
  if (item.kind === 'position') return PERIOD_OPTIONS;
  if (item.kind === 'count') return COUNT_PACK_OPTIONS;
  return ['추천·대표 노출 이용 기간에 함께 적용'];
}

/** @param {CatalogProduct} item @param {string} variant */
export function formatCatalogPrice(item, variant) {
  const cfg = getProductConfig(item.id);
  const opt = cfg?.options?.find((o) => o.label === variant);
  if (opt) {
    const amt = resolveCheckoutAmount(opt.priceKrw);
    if (amt.testMode) {
      return `${variant} · ${formatKrw(opt.priceKrw)} (테스트 ${formatKrw(amt.chargeKrw)})`;
    }
    return `${variant} · ${formatKrw(opt.priceKrw)}`;
  }
  return `${variant} · ${isPlansTestMode() ? DUMMY_PRICE : ''}`;
}

export const FREE_TIER_COPY = {
  title: '기본 노출',
  items: [
    '가게 꾸미기 · 상세·비교 · 기본 목록 · 반응 지표 3종',
    '상위로 올리는 별도 상품 없음 — 대표·추천 노출로 전환',
    '지도성향/수업스타일 아이콘 무료',
    '학부모가 먼저 보내는 쪽지와 답장은 무료',
    '공급자→학생 선제 쪽지·요청문 열람은 접근권 필요',
  ],
};

export const PAID_TIER_COPY = {
  title: '노출·접근 상품 이용 중',
  items: [
    '대표·추천 노출 기간형 · 쪽지권/열람권 횟수권',
    '주목·추천 등 광고배지는 노출 상품에 함께 적용',
    '자동으로 연장되지 않으며 종료 시 기본 노출로 복귀 (프로필 유지)',
  ],
};

/** P18-02 ROI 무료 3종 — 18§6 · API 미연동 시 fallback (0) */
export const ROI_FREE_METRICS = [
  { id: 'views', label: '조회', value: 0, period: '최근 7일', hint: '상세·검색 카드 열람' },
  { id: 'wishlist', label: '찜', value: 0, period: '누적', hint: '학부모 찜 목록' },
  { id: 'compare', label: '비교 담김', value: 0, period: '누적', hint: '비교 후보함 (≤3)' },
];

export const P18_HEADLINE = '가게 품질 무료 · 홍보·획득 유료';

export const P18_GUIDE_LEAD =
  '대표·추천 노출 기간형 + 쪽지권·열람권 횟수권 · 한 번씩 결제 · 자동연장 없음';

export const P18_USAGE_LEAD =
  '조회·찜·비교 담기는 무료입니다. 노출 만료나 횟수 소진은 안내 문구로 알려 드립니다.';

export const P18_RENEWAL_COPY = {
  title: '만료·갱신 안내',
  items: [
    '구독 만료처럼 급하게 재촉하지 않습니다. 노출 흐름·시즌 준비·연결 기회로 안내합니다.',
    '같은 조건으로 연장하거나, 짧게/길게 바꾸거나, 기본 노출로 쉴 수 있습니다.',
    '만료 7일·3일·1일 전에 메일·문자로 안내합니다. (전자결제 연동 후 적용)',
  ],
};

export const P18_EXPOSURE_STATUS = {
  basic: '기본 노출 — 유료 노출 이용 안 함',
  note: '대표·추천 노출 종료 시 기본 노출로 복귀 · 프로필 유지 · 광고배지만 내려감',
};

/** @deprecated 역할별 getPaidCatalog 사용 */
export const PAID_CATALOG_PLACEHOLDER = getPaidCatalog('tutor');

export { getCatalogByFamily };
