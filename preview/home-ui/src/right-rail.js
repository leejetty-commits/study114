import { BOARD_ENGINE_LOCK, getBoardPolicy } from './board-engine-copy.js';
import { getRightRailSlot } from './right-rail-store.js';
import { listNoticePosts, listFaqPosts, listGuidePosts } from './operational-board-store.js';
import { listLibraryItems } from './library/library-store.js';
import { getNavRole } from './state.js';
import { SITE_PROMO_ITEMS, renderPromoCard } from '../../shared/promo-sidebar.js';
import { getBoardChannel, isConcernBoardKey } from './board-channel-store.js';
import { getConcernBoardByKey } from './concern/copy.js';
import { getHotConcernSamples, getLatestConcernSamples, listConcernPosts, reactionTotal } from './concern/store.js';
import { renderPromoRailCard } from './promo/screens.js';
import {
  canShowBoardInRail,
  canShowBoardPostsInRail,
  getChannelIntro,
  isRailSlotVisible,
  normalizeBoardKey,
} from './board-channel-acl.js';

/**
 * 노션 잠금안: 고정 광고 3장 → 3층 슬롯(현장·안내·영상).
 * 영상(S3)은 후순위 — 이번 구현에서는 S1+S2만 노출.
 * channel ACL: visibilityRule · roleTarget · guestFilter · sourceBoardKeys 런타임 적용
 * @param {string} [slotKey]
 */
export function renderPromoWithRightRail(slotKey = 'home_right_rail') {
  const navRole = getNavRole();
  const slot = getRightRailSlot(slotKey);
  if (slot && !isRailSlotVisible(slot, navRole)) {
    return `
      <aside class="home-sidebar home-sidebar--guest home-sidebar--live-rail" aria-label="안내">
        ${renderNoticeTopBanner()}
        ${renderPromoRailCard()}
        ${renderActionGuideSlot(slotKey)}
      </aside>`;
  }
  const guestFilter = slot?.guestFilter || 'allow';
  return `
    <aside class="home-sidebar home-sidebar--guest home-sidebar--live-rail" aria-label="현장 고민과 안내">
      ${renderNoticeTopBanner()}
      ${renderPromoRailCard()}
      ${renderLiveFieldSlot(slotKey, { guestFilter })}
      ${renderActionGuideSlot(slotKey)}
    </aside>`;
}

function renderNoticeTopBanner() {
  const notice = listNoticePosts()[0];
  if (!notice) return '';
  return `
    <a class="live-rail-notice-top" href="#/support/notice" data-nav="/support/notice">
      <span class="live-rail-notice-top__label">공지사항</span>
      <span class="live-rail-notice-top__title">${esc(notice.title)}</span>
    </a>`;
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
  const channel = getBoardChannel(boardKey);
  if (channel?.routeSlug) return channel.routeSlug;
  const policy = getBoardPolicy(boardKey);
  if (policy?.routeSlug) return policy.routeSlug;
  const community = getConcernBoardByKey(boardKey);
  if (community) return `#${community.path}`;
  return '#/support';
}

function concernItems(boardKey, limit) {
  const board = getConcernBoardByKey(boardKey);
  return listConcernPosts(boardKey, { sort: 'hot' })
    .slice(0, limit)
    .map((post) => ({
      boardKey,
      title: post.title,
      summary: `댓글 ${post.comments?.length || 0} · 반응 ${reactionTotal(post)}`,
      href: `#${board?.path || '/community'}/${post.id}`,
      kind: board?.label || '커뮤니티',
    }));
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
    href: '#/guide/safety',
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

function introRailItem(boardKey) {
  const intro = getChannelIntro(boardKey);
  return {
    boardKey,
    title: intro.title,
    summary: intro.body,
    href: boardRoute(boardKey),
    kind: '공간 소개',
    introOnly: true,
  };
}

function itemsForBoard(boardKey, limit) {
  const navRole = getNavRole();
  if (!canShowBoardPostsInRail(boardKey, navRole)) {
    return canShowBoardInRail(boardKey, navRole) ? [introRailItem(boardKey)] : [];
  }
  if (boardKey === 'notice') return noticeItems(limit);
  if (boardKey === 'faq') return faqItems(limit);
  if (boardKey === 'safe-guide') return guideItems(limit);
  if (boardKey === 'library' || boardKey === 'library-template' || boardKey === 'library-guide-pdf') {
    return libraryItems(boardKey, limit);
  }
  if (boardKey === 'submission') return submissionItems();
  if (isConcernBoardKey(boardKey)) return concernItems(boardKey, limit);
  return staticFallbackItems(boardKey).slice(0, limit);
}

/**
 * 배너↔커뮤니티 — sourceBoardKeys 중 concern만, ACL 통과분만 (전체 보드 fallback 금지)
 */
function resolveConcernBoardKeysForSlot(slotKey, opts = {}) {
  const navRole = getNavRole();
  const slot = getRightRailSlot(slotKey);
  const configured = [];
  if (slot?.sourceBoardKey) configured.push(slot.sourceBoardKey);
  if (Array.isArray(slot?.sourceBoardKeys)) configured.push(...slot.sourceBoardKeys);
  const unique = [...new Set(configured.map(normalizeBoardKey).filter(Boolean))];
  const guestFilter = opts.guestFilter || slot?.guestFilter || 'allow';
  return unique.filter(
    (key) => isConcernBoardKey(key) && canShowBoardInRail(key, navRole, { guestFilter }),
  );
}

function renderRailItem(item) {
  const href = normalizeHref(item.href);
  const meta = item.introOnly ? '이 공간의 소개만 볼 수 있어요' : item.summary;
  return `
    <a href="${esc(href)}" class="right-rail-card"${navAttr(item.href)}>
      <span class="right-rail-card__kind">${esc(item.kind)}</span>
      <strong class="right-rail-card__title">${esc(item.title)}</strong>
      <span class="right-rail-card__summary">${esc(meta)}</span>
    </a>`;
}

function renderFallbackPromo() {
  return `
    <div class="right-rail__fallback" aria-label="기본 안내">
      ${renderPromoCard(SITE_PROMO_ITEMS.public, 'compact')}
    </div>`;
}

/** 역할·페이지 맥락에 맞춘 현장 슬롯 제목 */
function liveFieldCopy(slotKey) {
  if (slotKey === 'search_right_rail') {
    return {
      eyebrow: '탐색 도움',
      title: '많이 보는 고민',
      ctaLabel: '커뮤니티 더 보기',
      ctaHref: '#/community/director',
    };
  }
  if (slotKey === 'detail_right_rail') {
    return {
      eyebrow: '',
      title: '비슷한 고민 / 사례',
      ctaLabel: '커뮤니티 열기',
      ctaHref: '#/community/director',
    };
  }
  if (slotKey === 'register_right_rail' || slotKey === 'plans_right_rail') {
    return {
      eyebrow: '운영 현장',
      title: '지금 현장 고민',
      ctaLabel: '공부방·쌤 고민 보기',
      ctaHref: '#/community/director',
    };
  }
  return {
    eyebrow: '오늘의 현장',
    title: '지금 현장 고민 HOT',
    ctaLabel: '커뮤니티 더 보기',
    ctaHref: '#/community/director',
  };
}

/** @param {string} slotKey @param {{ guestFilter?: boolean }} [opts] */
function renderLiveFieldSlot(slotKey, opts = {}) {
  const copy = liveFieldCopy(slotKey);
  const navRole = getNavRole();
  const boardKeys = resolveConcernBoardKeysForSlot(slotKey, opts);
  const latestMode = slotKey === 'detail_right_rail';
  const postCards = (
    latestMode
      ? getLatestConcernSamples({ limit: 3, boardKeys: boardKeys.filter((key) => canShowBoardPostsInRail(key, navRole)) })
      : getHotConcernSamples({ limit: 3, boardKeys: boardKeys.filter((key) => canShowBoardPostsInRail(key, navRole)) })
  ).filter((post) => canShowBoardPostsInRail(post.boardKey, navRole));

  const postHtml = postCards
    .map((post) => {
      const board = getConcernBoardByKey(post.boardKey);
      const href = `${board?.path || '/community'}/${post.id}`;
      return `
        <a href="#${esc(href)}" class="live-rail-card" data-nav="${esc(href)}">
          <span class="live-rail-card__board">${esc(board?.label || '커뮤니티')}</span>
          <strong class="live-rail-card__title">${esc(post.title)}</strong>
          <span class="live-rail-card__meta">댓글 ${post.comments?.length || 0} · 반응 ${reactionTotal(post)}</span>
        </a>`;
    })
    .join('');

  const introHtml = boardKeys
    .filter((key) => !canShowBoardPostsInRail(key, navRole) && canShowBoardInRail(key, navRole, opts))
    .map((key) => {
      const intro = getChannelIntro(key);
      const board = getConcernBoardByKey(key);
      const href = board?.path || boardRoute(key).replace(/^#/, '');
      return `
        <a href="#${esc(href)}" class="live-rail-card" data-nav="${esc(href)}">
          <span class="live-rail-card__board">${esc(intro.title)}</span>
          <strong class="live-rail-card__title">${esc(intro.title)}</strong>
          <span class="live-rail-card__meta">이 공간의 소개만 볼 수 있어요</span>
        </a>`;
    })
    .join('');

  const items = `${postHtml}${introHtml}`;

  return `
    <section class="live-rail-slot live-rail-slot--field">
      <div class="live-rail-slot__head">
        ${copy.eyebrow ? `<span class="live-rail-slot__eyebrow">${esc(copy.eyebrow)}</span>` : ''}
        <strong class="live-rail-slot__title">${esc(copy.title)}</strong>
      </div>
      <div class="live-rail-slot__items">${items || '<p class="live-rail-empty">아직 올라온 고민이 없습니다.</p>'}</div>
      <a href="${esc(copy.ctaHref)}" class="live-rail-slot__cta" data-nav="${esc(copy.ctaHref.slice(1))}">${esc(copy.ctaLabel)} →</a>
    </section>`;
}

/** 역할별 CTA — 노션 슬롯 B */
function actionCtasForContext(slotKey) {
  const role = getNavRole();
  if (slotKey === 'detail_right_rail') {
    return [
      { title: '첫 연락 전 체크', desc: '공개 정보·가격·위치를 다시 확인하세요', href: '#/guide/saved-contact', cta: '쪽지 안내' },
      { title: '안전과외 가이드', desc: '개인정보 공유 전 행동 요령', href: '#/guide/safety', cta: '가이드 보기' },
      { title: '신고/도움', desc: '이상 신호가 있으면 먼저 확인', href: '#/policy/reporting', cta: '신고 안내' },
    ];
  }
  if (slotKey === 'search_right_rail') {
    return [
      { title: '조건 좁히는 법', desc: '찜·비교로 후보를 줄여보세요', href: '#/guide/saved-contact', cta: '찜·비교·쪽지' },
      { title: '안전 가이드', desc: '문의 전 꼭 볼 체크', href: '#/guide/safety', cta: '안전 안내' },
      { title: '이용안내', desc: '처음 이용 전체 흐름', href: '#/guide/getting-started', cta: '처음 이용' },
    ];
  }
  if (role === 'study_room') {
    return [
      { title: '3분 등록부터', desc: '기본등록으로 가볍게 시작', href: '#/guide/registration', cta: '등록방법' },
      { title: '시즌 모집 준비', desc: '소개문·사진 보완 포인트', href: '#/community/director', cta: '공부방 고민방' },
      { title: '유료 노출 안내', desc: '상세등록 이후 Prime/Pick', href: '#/plans', cta: '유료상품' },
    ];
  }
  if (role === 'tutor') {
    return [
      { title: '프로필 보완', desc: '문의 전환을 높이는 소개 흐름', href: '#/guide/registration', cta: '등록방법' },
      { title: '학생 접근 흐름', desc: '요청문·쪽지 전 확인', href: '#/community/tutor', cta: '과외쌤 고민방' },
      { title: '신뢰 보강', desc: '제출자료·소개 점검', href: '#/mypage/submission-board', cta: '제출함' },
    ];
  }
  // guest / parent / default
  return [
    { title: '찜·비교·쪽지', desc: '첫 연락은 쪽지로 안전하게', href: '#/guide/saved-contact', cta: '이용 흐름' },
    { title: '안전과외 가이드', desc: '개인정보 공유 전 행동 요령', href: '#/guide/safety', cta: '가이드 보기' },
    { title: '학생/학부모 고민', desc: '선택·루틴·성적 고민 나누기', href: '#/community/parent', cta: '커뮤니티 열기' },
  ];
}

function actionGuideCopy(slotKey) {
  if (slotKey === 'detail_right_rail') return { eyebrow: '', title: '사용팁' };
  if (slotKey === 'search_right_rail') return { eyebrow: '초보 가이드', title: '처음 찾는 분께' };
  if (slotKey === 'plans_right_rail') return { eyebrow: '상품 안내', title: '지금 필요한 안내' };
  return { eyebrow: '지금 필요한 안내', title: '이번 시즌 추천 행동' };
}

function renderActionGuideSlot(slotKey) {
  const copy = actionGuideCopy(slotKey);
  const ctas = actionCtasForContext(slotKey);
  return `
    <section class="live-rail-slot live-rail-slot--action">
      <div class="live-rail-slot__head">
        ${copy.eyebrow ? `<span class="live-rail-slot__eyebrow">${esc(copy.eyebrow)}</span>` : ''}
        <strong class="live-rail-slot__title">${esc(copy.title)}</strong>
      </div>
      <div class="live-rail-slot__items">
        ${ctas
          .map((item) => {
            const path = item.href.startsWith('#') ? item.href.slice(1) : item.href;
            return `
              <a href="${esc(item.href)}" class="live-rail-action" data-nav="${esc(path)}">
                <strong>${esc(item.title)}</strong>
                <span>${esc(item.desc)}</span>
                <em>${esc(item.cta)} →</em>
              </a>`;
          })
          .join('')}
      </div>
    </section>`;
}

/** @param {string} slotKey @param {{ guestFilter?: string }} [opts] */
function buildRailContent(slotKey, opts = {}) {
  const navRole = getNavRole();
  const slot = getRightRailSlot(slotKey);
  if (!isRailSlotVisible(slot, navRole)) {
    return { slot: null, itemsHtml: renderFallbackPromo() };
  }
  const guestFilter = opts.guestFilter || slot.guestFilter || 'allow';
  let boardKeys = slot.sourceBoardKeys?.length ? slot.sourceBoardKeys : [slot.sourceBoardKey].filter(Boolean);
  boardKeys = boardKeys
    .map(normalizeBoardKey)
    .filter((key) => canShowBoardInRail(key, navRole, { guestFilter }));
  const perBoardLimit = Math.max(1, Math.ceil(Number(slot.itemLimit || 3) / Math.max(1, boardKeys.length || 1)));
  const items = boardKeys.flatMap((key) => itemsForBoard(key, perBoardLimit)).slice(0, Number(slot.itemLimit || 3));
  const itemsHtml = items.length ? items.map(renderRailItem).join('') : renderFallbackPromo();
  return { slot, itemsHtml };
}

/** @param {string} slotKey @param {'sidebar'|'inline'|'stacked'} [variant] @param {{ guestFilter?: string }} [opts] */
function renderRightRailMarkup(slotKey, variant = 'sidebar', opts = {}) {
  const navRole = getNavRole();
  const slot = getRightRailSlot(slotKey);
  const guestFilter = opts.guestFilter || slot?.guestFilter || 'allow';
  if (variant === 'inline') {
    if (slot && !isRailSlotVisible(slot, navRole)) {
      return `
        <section class="right-rail right-rail--inline right-rail--live-inline" data-right-rail-slot="${esc(slotKey)}" aria-label="안내">
          ${renderActionGuideSlot(slotKey)}
        </section>`;
    }
    return `
      <section class="right-rail right-rail--inline right-rail--live-inline" data-right-rail-slot="${esc(slotKey)}" aria-label="현장 고민과 안내">
        ${renderLiveFieldSlot(slotKey, { guestFilter })}
        ${renderActionGuideSlot(slotKey)}
      </section>`;
  }

  const { slot: activeSlot, itemsHtml } = buildRailContent(slotKey, { guestFilter });
  if (!activeSlot) {
    if (variant === 'stacked') return '';
    return renderFallbackPromo();
  }
  const ctaHref = normalizeHref(activeSlot.ctaTarget);
  const mobileClass = ` right-rail--mobile-${activeSlot.mobileBehavior || 'stack'}`;
  const tag = variant === 'sidebar' ? 'aside' : 'div';
  const shellClass =
    variant === 'stacked'
      ? `right-rail right-rail--stacked${mobileClass}`
      : `home-sidebar home-sidebar--guest right-rail${mobileClass}`;

  return `
    <${tag} class="${shellClass}" data-right-rail-slot="${esc(activeSlot.slotKey)}" aria-label="${esc(activeSlot.sectionTitle)}">
      <div class="right-rail__head">
        <span class="right-rail__eyebrow">게시판 요약</span>
        <strong class="right-rail__title">${esc(activeSlot.sectionTitle)}</strong>
      </div>
      <div class="right-rail__items">
        ${itemsHtml}
      </div>
      <a href="${esc(ctaHref)}" class="right-rail__cta"${navAttr(activeSlot.ctaTarget)}>${esc(activeSlot.ctaLabel)} →</a>
      <p class="right-rail__note">글 목록 권한이 있는 채널만 게시글이 보입니다. 그 외에는 공간 소개만 표시합니다.</p>
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
