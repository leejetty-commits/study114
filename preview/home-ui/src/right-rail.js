import { BOARD_ENGINE_LOCK, getBoardPolicy } from './board-engine-copy.js';
import { getRightRailSlot } from './right-rail-store.js';
import { listNoticePosts, listFaqPosts, listGuidePosts } from './operational-board-store.js';
import { listLibraryItems } from './library/library-store.js';
import { getNavRole } from './state.js';
import { SITE_PROMO_ITEMS, renderPromoCard } from '../../shared/promo-sidebar.js';

/**
 * 원본 프로모 3장(위) + 게시판 요약 슬롯(아래)
 * @param {string} [slotKey]
 */
export function renderPromoWithRightRail(slotKey = 'home_right_rail') {
  const rail = renderRightRailMarkup(slotKey, 'stacked');
  return `
    <aside class="home-sidebar home-sidebar--guest home-sidebar--promo" aria-label="프로모션 및 게시판 요약">
      ${renderPromoCard(SITE_PROMO_ITEMS.premium, 'tall')}
      ${renderPromoCard(SITE_PROMO_ITEMS.partner)}
      ${renderPromoCard(SITE_PROMO_ITEMS.public)}
      ${rail}
    </aside>`;
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function normalizeHref(target) {
  const t = String(target || '#/support');
  if (t.startsWith('#') || t.startsWith('http')) return t;
  return `#${t.startsWith('/') ? t : `/${t}`}`;
}

function navAttr(target) {
  const href = normalizeHref(target);
  return href.startsWith('#') ? ` data-nav="${esc(href.slice(1))}"` : '';
}

function boardRoute(boardKey) {
  const policy = getBoardPolicy(boardKey);
  return policy?.routeSlug || '#/support';
}

function noticeItems(limit) {
  return listNoticePosts()
    .slice(0, limit)
    .map((n) => ({
      boardKey: 'notice',
      title: n.title,
      summary: n.body?.[0] || n.date,
      href: '#/support/notice',
      kind: '공지',
    }));
}

function faqItems(limit) {
  return listFaqPosts().slice(0, limit).map((f) => ({
    boardKey: 'faq',
    title: f.q,
    summary: f.a.replace(/\*\*/g, ''),
    href: '#/support/faq',
    kind: '자주 묻는 질문',
  }));
}

function guideItems(limit) {
  return listGuidePosts().slice(0, limit).map((g) => ({
    boardKey: 'safe-guide',
    title: g.title,
    summary: g.audience || '안전과외 가이드',
    href: `#/support/safe/${g.slug}`,
    kind: '가이드',
  }));
}

function libraryItems(boardKey, limit) {
  const section =
    boardKey === 'library-template' ? 'templates' : boardKey === 'library-guide-pdf' ? 'guides' : 'library';
  return listLibraryItems(section, getNavRole())
    .filter((item) => item.boardKey === boardKey)
    .slice(0, limit)
    .map((item) => ({
      boardKey,
      title: item.title,
      summary: `${item.format} · ${item.summary}`,
      href: boardRoute(boardKey),
      kind: boardKey === 'library-template' ? '서식' : boardKey === 'library-guide-pdf' ? 'PDF' : '자료',
    }));
}

function submissionItems() {
  return [
    {
      boardKey: 'submission',
      title: '제출자료 안내',
      summary: '공급자용 제출함 · 회원이 등록한 정보이며 플랫폼 보증이 아닙니다.',
      href: '#/mypage/submission-board',
      kind: '제출',
    },
  ];
}

function staticFallbackItems(boardKey) {
  const policy = getBoardPolicy(boardKey);
  if (!policy) return [];
  return [
    {
      boardKey,
      title: policy.userFacingMenu || policy.label,
      summary: policy.boardType === 'curation' ? '2차 후보 채널입니다.' : BOARD_ENGINE_LOCK.topConcept,
      href: policy.routeSlug || '#/support',
      kind: policy.label,
    },
  ];
}

function itemsForBoard(boardKey, limit) {
  if (boardKey === 'notice') return noticeItems(limit);
  if (boardKey === 'faq') return faqItems(limit);
  if (boardKey === 'safe-guide') return guideItems(limit);
  if (boardKey === 'library' || boardKey === 'library-template' || boardKey === 'library-guide-pdf') {
    return libraryItems(boardKey, limit);
  }
  if (boardKey === 'submission') return submissionItems();
  return staticFallbackItems(boardKey).slice(0, limit);
}

function renderRailItem(item) {
  const href = normalizeHref(item.href);
  return `
    <a href="${esc(href)}" class="right-rail-card"${navAttr(item.href)}>
      <span class="right-rail-card__kind">${esc(item.kind)}</span>
      <strong class="right-rail-card__title">${esc(item.title)}</strong>
      <span class="right-rail-card__summary">${esc(item.summary)}</span>
    </a>`;
}

function renderFallbackPromo() {
  return `
    <div class="right-rail__fallback" aria-label="기본 안내">
      ${renderPromoCard(SITE_PROMO_ITEMS.public, 'compact')}
    </div>`;
}

/** @param {string} slotKey @param {{ guestFilter?: boolean }} [opts] */
function buildRailContent(slotKey, opts = {}) {
  const slot = getRightRailSlot(slotKey);
  if (!slot || !slot.enabled || slot.status !== 'active') {
    return { slot: null, itemsHtml: renderFallbackPromo() };
  }
  let boardKeys = slot.sourceBoardKeys?.length ? slot.sourceBoardKeys : [slot.sourceBoardKey].filter(Boolean);
  // 비로그인: 제출함(마이페이지) 등 로그인 전용 보드 제외
  if (opts.guestFilter) {
    boardKeys = boardKeys.filter((key) => key !== 'submission');
  }
  const perBoardLimit = Math.max(1, Math.ceil(Number(slot.itemLimit || 3) / Math.max(1, boardKeys.length)));
  const items = boardKeys.flatMap((key) => itemsForBoard(key, perBoardLimit)).slice(0, Number(slot.itemLimit || 3));
  const itemsHtml = items.length ? items.map(renderRailItem).join('') : renderFallbackPromo();
  return { slot, itemsHtml };
}

/** @param {string} slotKey @param {'sidebar'|'inline'|'stacked'} [variant] @param {{ guestFilter?: boolean }} [opts] */
function renderRightRailMarkup(slotKey, variant = 'sidebar', opts = {}) {
  const { slot, itemsHtml } = buildRailContent(slotKey, opts);
  if (!slot) {
    if (variant === 'inline' || variant === 'stacked') return '';
    return renderFallbackPromo();
  }
  const ctaHref = normalizeHref(slot.ctaTarget);
  const mobileClass = ` right-rail--mobile-${slot.mobileBehavior || 'stack'}`;
  const tag = variant === 'sidebar' ? 'aside' : variant === 'inline' ? 'section' : 'div';
  const shellClass =
    variant === 'inline'
      ? `right-rail right-rail--inline${mobileClass}`
      : variant === 'stacked'
        ? `right-rail right-rail--stacked${mobileClass}`
        : `home-sidebar home-sidebar--guest right-rail${mobileClass}`;

  return `
    <${tag} class="${shellClass}" data-right-rail-slot="${esc(slot.slotKey)}" aria-label="${esc(slot.sectionTitle)}">
      <div class="right-rail__head">
        <span class="right-rail__eyebrow">게시판 요약</span>
        <strong class="right-rail__title">${esc(slot.sectionTitle)}</strong>
      </div>
      <div class="right-rail__items">
        ${itemsHtml}
      </div>
      <a href="${esc(ctaHref)}" class="right-rail__cta"${navAttr(slot.ctaTarget)}>${esc(slot.ctaLabel)} →</a>
      <p class="right-rail__note">본문은 각 게시판에서 확인 · 이 영역은 요약/바로가기</p>
    </${tag}>`;
}

/** @param {string} slotKey */
export function renderRightRailSidebar(slotKey = 'home_right_rail') {
  return renderPromoWithRightRail(slotKey);
}

/** @param {string} slotKey — 상세 모달·검색 하단 등 인라인 보조 블록 @param {{ guestFilter?: boolean }} [opts] */
export function renderRightRailBlock(slotKey = 'detail_right_rail', opts = {}) {
  return renderRightRailMarkup(slotKey, 'inline', opts);
}
