/**
 * 홈·메인메뉴 상단 마케팅 배너
 * 카피·레이아웃·CTA를 surface(페이지) 단위로 분배한다.
 */

import { AUTH_UI_BASE } from './data.js';
import { searchUiUrl, HOME_UI_BASE } from './nav-config.js';

const SIGNUP_URL = `${AUTH_UI_BASE}/#/signup/terms`;
const HOME_GUEST = `${HOME_UI_BASE}/#/guest`;
const HOME_MESSAGES = `${HOME_UI_BASE}/#/mypage/messages`;
const HOME_PLANS = `${HOME_UI_BASE}/#/plans`;

/** @typedef {'compare'|'trust'|'discover'|'tutor_find'|'student_find'|'plans'|'support'} BannerCopyId */
/** @typedef {'cinema'} BannerLayout */

/**
 * @typedef {object} BannerCopy
 * @property {BannerCopyId} id
 * @property {string} eyebrow
 * @property {string} [headline]
 * @property {string[]} [headlineLines]
 * @property {string[]} lines
 * @property {string} image
 * @property {string} imageAlt
 */

/**
 * @typedef {object} BannerCta
 * @property {string} label
 * @property {string} href
 * @property {boolean} [external]
 * @property {string} [nav]
 * @property {'primary'|'secondary'} [kind]
 */

/** @type {Record<BannerCopyId, BannerCopy>} */
export const HOME_BANNER_COPY = {
  /** 1안 — 정석·비교 (학부모·공부방찾기) */
  compare: {
    id: 'compare',
    eyebrow: '우동공과 · 우리동네 공부방 과외쌤',
    headline: '우리동네 공부방·과외, 한눈에 비교하고 찾으세요',
    lines: [
      '지역별로 모아 보고, 수업방식·대상·강점까지 비교해',
      '우리 아이에게 맞는 공부방과 과외쌤을 더 쉽게 찾을 수 있어요',
    ],
    image: '/assets/banners/compare.jpg',
    imageAlt: '공부 자료를 비교해 보는 책상',
  },
  /** 2안 — 신뢰·플랫폼 (공급자 홈·유료상품) */
  trust: {
    id: 'trust',
    eyebrow: '우동공과 · 비교하고 판단하는 동네 교육',
    headline: '광고만 보는 곳이 아니라, 비교하고 판단하는 동네 교육 플랫폼',
    lines: [
      '공부방과 과외쌤의 정보, 강점, 노출, 신뢰 포인트를 한곳에서 보고',
      '궁금한 점은 공식 쪽지로 안전하게 이어가세요',
    ],
    image: '/assets/banners/trust.jpg',
    imageAlt: '동네 공부방의 따뜻한 공간',
  },
  /** 3안 — 감성·탐색 (게스트 홈) */
  discover: {
    id: 'discover',
    eyebrow: '우동공과 · 우리동네 공부방 과외쌤',
    headlineLines: [
      '우리동네에서, 더 잘 맞는 공부방과',
      '과외쌤을 찾는 가장 쉬운 방법',
    ],
    lines: [
      '지역 기준으로 모아 보고, 비교하고, 저장하고, 이어서 살펴보세요',
      '처음 찾는 분도 다시 찾는 분도 흐름이 끊기지 않게 설계했습니다',
    ],
    image: '/assets/banners/discover.jpg',
    imageAlt: '창가 빛 아래의 학습 공간',
  },
  /** 과외쌤찾기 */
  tutor_find: {
    id: 'tutor_find',
    eyebrow: '우동공과 · 우리동네 과외쌤',
    headlineLines: ['우리동네 과외쌤,', '수업 방식과 강점까지 비교해 보세요'],
    lines: [
      '활동 지역·과목·스타일을 모아 보고 찜·비교로 후보를 좁혀 보세요',
      '궁금한 점은 공식 쪽지로 이어갈 수 있어요',
    ],
    image: '/assets/banners/discover.jpg',
    imageAlt: '학습 공간',
  },
  /** 학생찾기 */
  student_find: {
    id: 'student_find',
    eyebrow: '우동공과 · 우리동네 학생 수요',
    headlineLines: ['우리동네 학생 수요를', '요약으로 보고 이어서 살펴보세요'],
    lines: [
      '요청 요약 중심으로 확인하고, 필요하면 쪽지·관심 저장으로 이어가세요',
      '학부모 과금 없이, 공급자 접근권은 필요할 때만 이용합니다',
    ],
    image: '/assets/banners/compare.jpg',
    imageAlt: '비교·판단 분위기',
  },
  /** 유료상품 */
  plans: {
    id: 'plans',
    eyebrow: '우동공과 · 노출·접근 상품',
    headlineLines: ['가게 품질은 무료로,', '홍보와 연결은 필요할 때만'],
    lines: [
      '대표·추천 노출은 기간형, 쪽지권·열람권은 횟수권으로 단건 결제합니다',
      '자동연장 없이, 만료되면 기본 노출로 자연스럽게 돌아갑니다',
    ],
    image: '/assets/banners/trust.jpg',
    imageAlt: '신뢰·플랫폼 분위기',
  },
  /** 고객센터 */
  support: {
    id: 'support',
    eyebrow: '우동공과 · 이용 안내',
    headlineLines: ['등록부터 비교·쪽지까지,', '막히는 지점을 안내로 풀어 드립니다'],
    lines: [
      '자주 묻는 질문과 안전과외 가이드에서 흐름을 먼저 확인해 보세요',
      '운영 문의가 필요하면 고객센터에서 이어서 남길 수 있어요',
    ],
    image: '/assets/banners/discover.jpg',
    imageAlt: '안내·탐색 분위기',
  },
};

/**
 * @type {Record<string, { copyId: BannerCopyId, layout: BannerLayout, ctas: BannerCta[] }>}
 */
const SURFACE_BANNER = {
  guest: {
    copyId: 'discover',
    layout: 'cinema',
    ctas: [
      { label: '우리동네 공부방 찾기', href: searchUiUrl('room'), external: true, kind: 'primary' },
      { label: '우리동네 과외쌤 찾기', href: searchUiUrl('tutor'), external: true, kind: 'secondary' },
      { label: '회원가입', href: SIGNUP_URL, external: true, kind: 'secondary' },
    ],
  },
  parent: {
    copyId: 'compare',
    layout: 'cinema',
    ctas: [
      { label: '우리동네 공부방 찾기', href: searchUiUrl('room', 'parent'), external: true, kind: 'primary' },
      { label: '우리동네 과외쌤 찾기', href: searchUiUrl('tutor', 'parent'), external: true, kind: 'secondary' },
    ],
  },
  study_room: {
    copyId: 'trust',
    layout: 'cinema',
    ctas: [
      { label: '우리동네 학생 보기', href: searchUiUrl('student', 'study_room'), external: true, kind: 'primary' },
      { label: '유료상품 알아보기', href: '#/plans', nav: '/plans', kind: 'secondary' },
    ],
  },
  tutor: {
    copyId: 'trust',
    layout: 'cinema',
    ctas: [
      { label: '학생 수요 보기', href: searchUiUrl('student', 'tutor'), external: true, kind: 'primary' },
      { label: '유료상품 알아보기', href: '#/plans', nav: '/plans', kind: 'secondary' },
    ],
  },
  search_room: {
    copyId: 'compare',
    layout: 'cinema',
    ctas: [
      { label: '우리동네 과외쌤 찾기', href: searchUiUrl('tutor'), external: true, kind: 'primary' },
      { label: '홈으로', href: HOME_GUEST, external: true, kind: 'secondary' },
    ],
  },
  search_tutor: {
    copyId: 'tutor_find',
    layout: 'cinema',
    ctas: [
      { label: '우리동네 공부방 찾기', href: searchUiUrl('room'), external: true, kind: 'primary' },
      { label: '홈으로', href: HOME_GUEST, external: true, kind: 'secondary' },
    ],
  },
  search_student: {
    copyId: 'student_find',
    layout: 'cinema',
    ctas: [
      { label: '쪽지함으로', href: HOME_MESSAGES, external: true, kind: 'primary' },
      { label: '유료상품 알아보기', href: HOME_PLANS, external: true, kind: 'secondary' },
    ],
  },
  plans: {
    copyId: 'plans',
    layout: 'cinema',
    ctas: [
      { label: '노출상품 보기', href: '#/plans/positions', nav: '/plans/positions', kind: 'primary' },
      { label: '접근권 보기', href: '#/plans/access', nav: '/plans/access', kind: 'secondary' },
    ],
  },
  support: {
    copyId: 'support',
    layout: 'cinema',
    ctas: [
      { label: '자주 묻는 질문', href: '#/support/faq', nav: '/support/faq', kind: 'primary' },
      { label: '안전과외 가이드', href: '#/support/safe', nav: '/support/safe', kind: 'secondary' },
    ],
  },
};

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

/** @param {BannerCta} cta */
function renderCta(cta) {
  if (!cta) return '';
  const kind = cta.kind || 'secondary';
  const cls =
    kind === 'primary' ? 'btn btn--primary home-mkt__cta' : 'btn btn--secondary home-mkt__cta home-mkt__cta--ghost';
  if (cta.external) {
    return `<a class="${cls}" href="${esc(cta.href)}" data-util-href="${esc(cta.href)}">${esc(cta.label)}</a>`;
  }
  if (cta.href.startsWith('#')) {
    const hash = cta.href.slice(1);
    if (hash && !hash.startsWith('/') && !cta.nav) {
      return `<a class="${cls}" href="${esc(cta.href)}">${esc(cta.label)}</a>`;
    }
    const nav = cta.nav || cta.href.replace(/^#/, '');
    return `<a class="${cls}" href="${esc(cta.href.startsWith('#/') ? cta.href : `#${nav}`)}" data-nav="${esc(nav)}">${esc(cta.label)}</a>`;
  }
  const nav = cta.nav || cta.href.replace(/^#/, '');
  return `<a class="${cls}" href="#${esc(nav)}" data-nav="${esc(nav)}">${esc(cta.label)}</a>`;
}

/**
 * @param {string} surface guest|parent|study_room|tutor|search_room|search_tutor|search_student|plans|support
 */
export function renderHomeMarketingBanner(surface) {
  const cfg = SURFACE_BANNER[surface];
  if (!cfg) return '';
  const copy = HOME_BANNER_COPY[cfg.copyId];
  if (!copy) return '';

  const titleHtml = copy.headlineLines?.length
    ? copy.headlineLines.map((line) => esc(line)).join('<br />')
    : esc(copy.headline || '');
  const lines = (copy.lines || []).map((line) => `<p class="home-mkt__line">${esc(line)}</p>`).join('');
  const actions = (cfg.ctas || []).map((c) => renderCta(c)).join('');

  return `
    <section class="home-mkt home-mkt--${esc(cfg.layout)} home-mkt--${esc(copy.id)}" aria-label="소개 배너">
      <div class="home-mkt__media" aria-hidden="true">
        <img class="home-mkt__img" src="${esc(copy.image)}" alt="" width="1600" height="900" decoding="async" fetchpriority="high" />
        <div class="home-mkt__shade"></div>
      </div>
      <div class="home-mkt__inner">
        <p class="home-mkt__eyebrow">${esc(copy.eyebrow)}</p>
        <h2 class="home-mkt__title">${titleHtml}</h2>
        <div class="home-mkt__sub">${lines}</div>
        <div class="home-mkt__actions">${actions}</div>
      </div>
    </section>`;
}

/** @param {'room'|'tutor'|'student'|string} tab */
export function renderSearchMarketingBanner(tab) {
  if (tab === 'tutor') return renderHomeMarketingBanner('search_tutor');
  if (tab === 'student') return renderHomeMarketingBanner('search_student');
  return renderHomeMarketingBanner('search_room');
}

export function renderGuestMarketingBanner() {
  return renderHomeMarketingBanner('guest');
}
