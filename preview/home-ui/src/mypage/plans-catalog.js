/** 18b placeholder — P15-09 · P16-04 CTA */

/** @typedef {'entitlement'|'scarce'|'consumable'|'ad'} CatalogKind */

/**
 * @typedef {object} CatalogItem
 * @property {string} id
 * @property {string} name
 * @property {string} tagline
 * @property {CatalogKind} kind
 * @property {string} priceLabel
 * @property {string} [pointsLabel]
 * @property {string[]} bullets
 * @property {boolean} [featured]
 */

export const PAID_CATALOG_PLACEHOLDER = [
  {
    id: 'boost_3d',
    name: 'Pick 부스트 3일',
    tagline: '우리 동네 3일 상단',
    kind: 'consumable',
    priceLabel: '30~50P',
    pointsLabel: '포인트',
    bullets: ['리스트 상단 노출', '첫 과금 추천 SKU (18§7)', '시즌 태그 부착 가능'],
    featured: true,
  },
  {
    id: 'boost_7d',
    name: 'Pick 부스트 7일',
    tagline: '7일 집중 노출',
    kind: 'consumable',
    priceLabel: '60~90P',
    pointsLabel: '포인트',
    bullets: ['중간고사·방학 캠페인 대상', 'Prime 슬롯과 별개'],
  },
  {
    id: 'cold_memo',
    name: '콜드 메모 1회',
    tagline: '학생에게 먼저 메모',
    kind: 'consumable',
    priceLabel: '5~15P',
    pointsLabel: '포인트',
    bullets: ['P16-04 게이트 해제', '학부모 선연락 답장은 free (16§1-2)', 'free 공급자 차단'],
    featured: true,
  },
  {
    id: 'request_view',
    name: '요청문 열람 1회',
    tagline: 'paid_only 요청문 열람',
    kind: 'consumable',
    priceLabel: '5~10P',
    pointsLabel: '포인트',
    bullets: ['13§8 · 학생 visibility=paid_only', '학부모 과금 없음'],
  },
  {
    id: 'hot_7d',
    name: 'Hot 배지 7일',
    tagline: '리스트 강조',
    kind: 'consumable',
    priceLabel: '20~40P',
    pointsLabel: '포인트',
    bullets: ['공부방·과외 프로필', 'Pick과 병행 가능'],
  },
  {
    id: 'paid_monthly',
    name: '유료 월정액 (entitlement)',
    tagline: 'Prime 신청 자격 · 월 포함분',
    kind: 'entitlement',
    priceLabel: '29,000~49,000원/월',
    bullets: ['자격형 — 포인트로 구매 ✕', '월 N포인트 + 콜드/열람 포함 (18b §3)', '2차 상품 (첫 과금=부스트)'],
  },
  {
    id: 'prime_slot',
    name: 'Prime 3칸',
    tagline: '메인 상단 희소 슬롯',
    kind: 'scarce',
    priceLabel: '운영 배정',
    bullets: ['paid 자격 필요', '포인트 구매 ✕', '11장 Prime 노출'],
  },
];

export const FREE_TIER_COPY = {
  title: '무료 공급자 (free)',
  items: [
    '가게 꾸미기 · Basic 노출 · ROI 3종 무료',
    '학부모→공급자 선연락·답장 free',
    '공급자→학생 콜드 메모 차단 (P16-04)',
    '요청문 paid_only 열람 차단',
  ],
};

export const PAID_TIER_COPY = {
  title: '유료 공급자 (paid)',
  items: [
    '콜드 메모 · 요청문 열람 (포인트/월 포함분)',
    'Prime 신청 자격',
    'Pick/Hot/점프 소비형 SKU',
  ],
};
