/** 18장 2026-07-07 — P15-09 · P18-01 카탈로그 (18b 더미 단가) */

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

export const PERIOD_OPTIONS = ['2주', '3주', '1개월', '2개월', '3개월'];
export const COUNT_PACK_OPTIONS = ['1회', '5회권', '10회권'];
export const DUMMY_PRICE = '10원';

/** @type {Record<string, CatalogProduct>} */
const PRODUCTS = {
  prime: {
    id: 'prime',
    name: 'Prime',
    tagline: '최상위 희소 포지션 · 기간형',
    kind: 'position',
    bullets: ['희소 슬롯 · 운영 배정', '기간형 단건 결제', '2주~3개월'],
    featured: true,
  },
  pick: {
    id: 'pick',
    name: 'Pick',
    tagline: 'Prime 아래 포지션 · 기간형',
    kind: 'position',
    bullets: ['동네 노출 유지 (최소 2주)', '3일·7일 부스트 1차 제외', '시즌 예약은 후순위'],
    featured: true,
  },
  memo_ticket: {
    id: 'memo_ticket',
    name: '쪽지권',
    tagline: '선제 쪽지 1건 (콜드 아웃리치)',
    kind: 'count',
    bullets: ['학부모 선연락·답장·열린 대화 후속은 free', '5·10회권 · 사용기한 6개월', 'FIFO 차감'],
    featured: true,
  },
  request_view: {
    id: 'request_view',
    name: '요청문 열람권',
    tagline: '요청문·특이요청 1건 상세 열람',
    kind: 'count',
    bullets: ['paid_only 요청문 (13§8)', '5·10회권 · 사용기한 6개월', '학부모 과금 없음'],
  },
  hot: {
    id: 'hot',
    name: 'Hot',
    tagline: 'Pick/Prime 기간에 종속',
    kind: 'badge_addon',
    bullets: ['광고성 주목 배지', '플랫폼 인증처럼 보이지 않게', '단독 핵심상품 ✕'],
  },
  new: {
    id: 'new',
    name: 'New',
    tagline: 'Pick/Prime 기간에 종속',
    kind: 'badge_addon',
    bullets: ['광고성 주목 배지', '신뢰 배지·등록정보와 분리', '단독 핵심상품 ✕'],
  },
  recommend: {
    id: 'recommend',
    name: '추천',
    tagline: 'Pick/Prime 기간에 종속',
    kind: 'badge_addon',
    bullets: ['광고성 자기선언 배지', '지도성향 아이콘(무료)과 구분', '단독 핵심상품 ✕'],
  },
  picked: {
    id: 'picked',
    name: '쪽집게',
    tagline: 'Pick/Prime 기간에 종속',
    kind: 'badge_addon',
    bullets: ['광고성 자기선언 배지', 'SKY·학력 등 사실표시층과 구분', '단독 핵심상품 ✕'],
  },
};

/** 18§4-1 공부방 우선 순서 */
export const STUDY_ROOM_CATALOG_IDS = [
  'prime',
  'pick',
  'hot',
  'new',
  'recommend',
  'picked',
  'memo_ticket',
  'request_view',
];

/** 18§4-1 과외쌤 우선 순서 */
export const TUTOR_CATALOG_IDS = [
  'memo_ticket',
  'request_view',
  'pick',
  'prime',
  'hot',
  'new',
  'recommend',
  'picked',
];

/** @param {'study_room'|'tutor'|string} role */
export function getPaidCatalog(role) {
  const ids = role === 'study_room' ? STUDY_ROOM_CATALOG_IDS : TUTOR_CATALOG_IDS;
  return ids.map((id) => PRODUCTS[id]).filter(Boolean);
}

/** @param {CatalogProduct} item */
export function getCatalogVariants(item) {
  if (item.kind === 'position') return PERIOD_OPTIONS;
  if (item.kind === 'count') return COUNT_PACK_OPTIONS;
  return ['Pick/Prime 기간 종속'];
}

/** @param {CatalogProduct} item @param {string} variant */
export function formatCatalogPrice(item, variant) {
  return `${variant} · ${DUMMY_PRICE}`;
}

export const FREE_TIER_COPY = {
  title: 'Basic (무료 공급자)',
  items: [
    '가게 꾸미기 · 상세·비교 · Basic 노출 · ROI 3종',
    '지도성향/수업스타일 아이콘 무료 (성실·꼼꼼 등)',
    '학부모→공급자 선연락·답장 free',
    '공급자→학생 선제 쪽지 차단 — 쪽지권 필요 (P16-04)',
    '요청문 paid_only 열람 차단',
  ],
};

export const PAID_TIER_COPY = {
  title: '노출·접근 상품 이용 중',
  items: [
    'Prime/Pick 기간형 · 쪽지권/열람권 횟수권',
    'Hot·추천 등 광고배지는 포지션에 종속',
    '자동연장 OFF · 종료 시 Basic 복귀 (프로필 유지)',
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
  '1차 = Prime/Pick 기간형(2주~) + 쪽지권·열람권 횟수권 · 단건 결제 · 자동연장 OFF';

export const P18_USAGE_LEAD =
  '조회·찜·비교 담김은 무료 (18§6) · 노출 만료·횟수 소진은 운영 언어로 안내';

export const P18_RENEWAL_COPY = {
  title: '만료·갱신 원칙 (18§9-10)',
  items: [
    '구독 만료 톤 ✕ — 노출 흐름·시즌 준비·연결 기회',
    '같은 조건 연장 · 짧게/길게 · 다른 방식 · Basic으로 쉬기',
    '메일+문자 안내 (7일·3일·1일 전) — PG 연동 후순위',
  ],
};

export const P18_EXPOSURE_STATUS = {
  basic: 'Basic — 유료 노출 기간 없음',
  note: 'Prime/Pick 종료 시 Basic 복귀 · 프로필 유지 · 광고배지만 내려감',
};

/** @deprecated 역할별 getPaidCatalog 사용 */
export const PAID_CATALOG_PLACEHOLDER = getPaidCatalog('tutor');
