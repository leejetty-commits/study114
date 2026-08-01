/**
 * 홈 상단 마케팅 배너
 * 카피 후보 1·2·3안을 역할 홈 성격에 맞게 분배한다.
 */

import { AUTH_UI_BASE } from './data.js';
import { SEARCH_UI_URL, searchUiUrl } from './nav-config.js';

const SIGNUP_URL = `${AUTH_UI_BASE}/#/signup/terms`;

/** @typedef {'compare'|'trust'|'discover'} BannerCopyId */
/** @typedef {'cinema'|'split'|'compact'} BannerLayout */

/**
 * @type {Record<BannerCopyId, {
 *   id: BannerCopyId,
 *   eyebrow: string,
 *   headline: string,
 *   lines: string[],
 *   image: string,
 *   imageAlt: string,
 * }>}
 */
export const HOME_BANNER_COPY = {
  /** 1안 — 정석형 */
  compare: {
    id: 'compare',
    eyebrow: '지역 기반 · 비교·판단',
    headline: '우리동네 공부방·과외, 한눈에 비교하고 찾으세요',
    lines: [
      '지역별로 모아 보고, 수업방식·대상·강점까지 비교해',
      '우리 아이에게 맞는 공부방과 과외쌤을 더 쉽게 찾을 수 있어요',
    ],
    image: '/assets/banners/compare.jpg',
    imageAlt: '공부 자료를 비교해 보는 책상',
  },
  /** 2안 — 신뢰·차별화 */
  trust: {
    id: 'trust',
    eyebrow: '우동공과',
    headline: '광고만 보는 곳이 아니라, 비교하고 판단하는 동네 교육 플랫폼',
    lines: [
      '공부방과 과외쌤의 정보, 강점, 노출, 신뢰 포인트를 한곳에서 보고',
      '궁금한 점은 공식 쪽지로 안전하게 이어가세요',
    ],
    image: '/assets/banners/trust.jpg',
    imageAlt: '동네 공부방의 따뜻한 공간',
  },
  /** 3안 — 감성·탐색 시작 */
  discover: {
    id: 'discover',
    eyebrow: '우동공과 · 우리동네',
    headline: '우리동네에서, 더 잘 맞는 공부방과 과외를 찾는 가장 쉬운 방법',
    lines: [
      '지역 기준으로 모아 보고, 비교하고, 저장하고, 이어서 살펴보세요',
      '처음 찾는 분도 다시 찾는 분도 흐름이 끊기지 않게 설계했습니다',
    ],
    image: '/assets/banners/discover.jpg',
    imageAlt: '창가 빛 아래의 학습 공간',
  },
};

/**
 * 역할별 배너 매핑 — 카피·레이아웃·CTA를 페이지 성격에 맞춤
 * @type {Record<string, { copyId: BannerCopyId, layout: BannerLayout, primary: { label: string, href: string, external?: boolean, nav?: string }, secondary?: { label: string, href: string, external?: boolean, nav?: string } }>}
 */
const ROLE_BANNER = {
  guest: {
    copyId: 'discover',
    layout: 'cinema',
    primary: { label: '우리동네 찾기', href: SEARCH_UI_URL, external: true },
    secondary: { label: '회원가입', href: SIGNUP_URL, external: true },
  },
  parent: {
    copyId: 'compare',
    layout: 'split',
    primary: { label: '공부방 찾기', href: searchUiUrl('room', 'parent'), external: true },
    secondary: { label: '과외쌤 찾기', href: searchUiUrl('tutor', 'parent'), external: true },
  },
  study_room: {
    copyId: 'trust',
    layout: 'compact',
    primary: { label: '우리동네 학생 보기', href: searchUiUrl('student', 'study_room'), external: true },
    secondary: { label: '유료상품 알아보기', href: '#/plans', nav: '/plans' },
  },
  tutor: {
    copyId: 'trust',
    layout: 'compact',
    primary: { label: '학생 수요 보기', href: searchUiUrl('student', 'tutor'), external: true },
    secondary: { label: '유료상품 알아보기', href: '#/plans', nav: '/plans' },
  },
};

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

/**
 * @param {{ label: string, href: string, external?: boolean, nav?: string }} cta
 * @param {'primary'|'secondary'} kind
 */
function renderCta(cta, kind) {
  if (!cta) return '';
  const cls = kind === 'primary' ? 'btn btn--primary home-mkt__cta' : 'btn btn--secondary home-mkt__cta home-mkt__cta--ghost';
  if (cta.external) {
    return `<a class="${cls}" href="${esc(cta.href)}" data-util-href="${esc(cta.href)}">${esc(cta.label)}</a>`;
  }
  const nav = cta.nav || cta.href.replace(/^#/, '');
  return `<a class="${cls}" href="${esc(cta.href)}" data-nav="${esc(nav)}">${esc(cta.label)}</a>`;
}

/**
 * @param {'guest'|'parent'|'study_room'|'tutor'|string} role
 */
export function renderHomeMarketingBanner(role) {
  const cfg = ROLE_BANNER[role];
  if (!cfg) return '';
  const copy = HOME_BANNER_COPY[cfg.copyId];
  if (!copy) return '';

  const lines = copy.lines.map((line) => `<p class="home-mkt__line">${esc(line)}</p>`).join('');

  return `
    <section class="home-mkt home-mkt--${esc(cfg.layout)} home-mkt--${esc(copy.id)}" aria-label="소개 배너">
      <div class="home-mkt__media" aria-hidden="true">
        <img class="home-mkt__img" src="${esc(copy.image)}" alt="" width="1600" height="900" decoding="async" fetchpriority="high" />
        <div class="home-mkt__shade"></div>
      </div>
      <div class="home-mkt__inner">
        <p class="home-mkt__eyebrow">${esc(copy.eyebrow)}</p>
        <h2 class="home-mkt__title">${esc(copy.headline)}</h2>
        <div class="home-mkt__sub">${lines}</div>
        <div class="home-mkt__actions">
          ${renderCta(cfg.primary, 'primary')}
          ${cfg.secondary ? renderCta(cfg.secondary, 'secondary') : ''}
        </div>
      </div>
    </section>`;
}

/** 게스트 전용 별칭 — 기존 temp notice 훅 자리 */
export function renderGuestMarketingBanner() {
  return renderHomeMarketingBanner('guest');
}
