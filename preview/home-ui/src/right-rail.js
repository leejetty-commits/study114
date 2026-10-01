import { getBoardPolicy } from './board-engine-copy.js';
import { getRightRailSlot } from './right-rail-store.js';
import { getNavRole } from './state.js';
import { getAuthUser, isAdminUser, isEmailVerified, isLoggedIn } from './auth-session.js';
import { getBoardChannel, isConcernBoardKey } from './board-channel-store.js';
import { getConcernBoardByKey } from './concern/copy.js';
import {
  ensureBestConcernPosts,
  ensureRailConcernPosts,
  getBestConcernBoards,
  getHotConcernSamples,
  getLatestConcernSamples,
  isBestConcernFresh,
  isBestConcernReady,
  isRailConcernFresh,
  isRailConcernReady,
  setConcernRailOwnerResolver,
} from './concern/store.js';
import { HOME_UI_BASE } from '../../shared/preview-links.js';
import {
  canShowBoardInRail,
  canShowBoardPostsInRail,
  getChannelIntro,
  isRailSlotVisible,
  normalizeBoardKey,
} from './board-channel-acl.js';

let railOwnerResolverSet = false;

/** 레일·베스트 캐시를 세션 주인별로 나누도록 store에 알려 준다. 모듈 순환을 피하려고 그릴 때 건다. */
function ensureRailOwnerResolver() {
  if (railOwnerResolverSet) return;
  railOwnerResolverSet = true;
  setConcernRailOwnerResolver(() => {
    const user = getAuthUser();
    if (!user) return 'guest';
    return `${user.user_id ?? ''}:${user.role_type || ''}:${user.admin_level || ''}`;
  });
}

/** 공부방·과외쌤 최신정보 박스. href가 비어 있으면 박스를 렌더링하지 않는다. */
const RAIL_PROVIDER_INFO = {
  eyebrow: '쏙쏙 최신정보',
  title: '공부방 과외쌤을 위한 쏙쏙 최신정보',
  desc: '창업 준비부터 교육청 신고, 운영 팁까지 꼭 필요한 소식만 쏙쏙 모았어요',
  href: '',
  cta: '바로가기',
};


/**
 * @typedef {{
 *   navRole: string,
 *   guestFilter: string,
 *   linkMode: 'hash' | 'absolute',
 *   homeBase: string,
 * }} RailCtx
 */

function resolveNavRole(opts = {}) {
  const role = opts.navRole;
  if (role === 'study_room' || role === 'tutor' || role === 'parent' || role === 'guest') return role;
  // 이메일 미인증 세션은 게스트 레일. 역할을 명시한 호출과 관리자 세션은 그대로 둔다.
  if (!opts.navRole && isLoggedIn() && !isEmailVerified() && !isAdminUser()) return 'guest';
  return getNavRole();
}

function createRailCtx(slotKey, opts = {}) {
  const slot = getRightRailSlot(slotKey);
  const navRole = resolveNavRole(opts);
  return {
    navRole,
    guestFilter: opts.guestFilter || slot?.guestFilter || 'allow',
    linkMode: opts.linkMode === 'absolute' ? 'absolute' : 'hash',
    homeBase: String(opts.homeBase || HOME_UI_BASE).replace(/\/$/, ''),
  };
}

function railPath(hrefOrPath) {
  const raw = String(hrefOrPath || '').trim();
  if (!raw) return '/support';
  return raw.replace(/^#/, '').startsWith('/') ? raw.replace(/^#/, '') : `/${raw.replace(/^#/, '')}`;
}

function railAnchor(hrefOrPath, className, ctx, inner) {
  const path = railPath(hrefOrPath);
  const cls = className ? ` class="${className}"` : '';
  if (ctx.linkMode === 'absolute') {
    const href = `${ctx.homeBase}/#${path}`;
    return `<a href="${esc(href)}" data-util-href="${esc(href)}"${cls}>${inner}</a>`;
  }
  return `<a href="#${esc(path)}" data-nav="${esc(path)}"${cls}>${inner}</a>`;
}

function isSearchOrRegisterRail(slotKey) {
  return slotKey === 'search_right_rail' || slotKey === 'register_right_rail';
}

function isConcernPath(hrefOrPath) {
  return railPath(hrefOrPath).startsWith('/community');
}

/** 찾기·등록·상세 레일의 고민방만 새 탭. data-nav·data-util-href는 같은 탭으로 가로채이므로 붙이지 않는다. */
function railBlankAnchor(hrefOrPath, className, ctx, inner) {
  const path = railPath(hrefOrPath);
  const href = `${ctx.homeBase}/#${path}`;
  const cls = className ? ` class="${className}"` : '';
  return `<a href="${esc(href)}" target="_blank" rel="noopener"${cls}>${inner}</a>`;
}

function isGuidePeekRail(slotKey) {
  return isSearchOrRegisterRail(slotKey) || slotKey === 'detail_right_rail';
}

function isBlankConcernRail(slotKey) {
  return isSearchOrRegisterRail(slotKey) || slotKey === 'detail_right_rail';
}

function railSlotAnchor(hrefOrPath, className, ctx, inner, slotKey) {
  if (isBlankConcernRail(slotKey) && isConcernPath(hrefOrPath)) {
    return railBlankAnchor(hrefOrPath, className, ctx, inner);
  }
  return railAnchor(hrefOrPath, className, ctx, inner);
}

/**
 * 노션 잠금안: 3층 슬롯(현장·안내·영상). Quiet Rails.
 * channel ACL: visibilityRule · roleTarget · guestFilter · sourceBoardKeys 런타임 적용
 * @param {string} [slotKey]
 * @param {{ guestFilter?: string, tone?: 'full'|'quiet'|'entry', variant?: 'sidebar'|'inline', navRole?: string, linkMode?: 'hash'|'absolute', homeBase?: string }} [opts]
 */
export function renderPromoWithRightRail(slotKey = 'home_right_rail', opts = {}) {
  const ctx = createRailCtx(slotKey, opts);
  const slot = getRightRailSlot(slotKey);
  const collapse = String(slot?.mobileBehavior || '') === 'collapse';
  const visible = Boolean(slot && isRailSlotVisible(slot, ctx.navRole));
  const tone = opts.tone || defaultRailTone(slotKey);
  const variant = opts.variant || 'sidebar';
  const inner = renderRailLayers(slotKey, { ...ctx, tone, visible });
  const title = esc(slot?.sectionTitle || '안내');
  const body =
    collapse && variant !== 'inline'
      ? `<details class="plans-rail-fold">
        <summary class="plans-rail-fold__summary">
          <strong>${title}</strong>
        </summary>
        <div class="plans-rail-fold__panel">${inner}</div>
      </details>`
      : inner;
  const tag = variant === 'inline' ? 'section' : 'aside';
  const shellClass =
    variant === 'inline'
      ? 'right-rail right-rail--inline right-rail--live-inline'
      : `home-sidebar home-sidebar--guest home-sidebar--live-rail right-rail${
          collapse ? ' right-rail--mobile-collapse' : ' right-rail--mobile-stack'
        }`;
  return `
    <${tag} class="${shellClass} live-rail--${esc(tone)}" data-right-rail-slot="${esc(slotKey)}" data-rail-tone="${esc(
      tone,
    )}" aria-label="${visible ? '현장 고민과 안내' : '안내'}">
      ${body}
    </${tag}>`;
}

function defaultRailTone(slotKey) {
  if (slotKey === 'support_right_rail') return 'quiet';
  if (slotKey === 'register_right_rail') return 'entry';
  return 'full';
}

function renderRailLayers(slotKey, ctx) {
  const { tone, visible } = ctx;
  if (tone === 'entry') {
    return `${renderActionGuideSlot(slotKey, { ...ctx, featuredOnly: true })}${renderMediaTeaserSlot(slotKey, ctx)}`;
  }
  if (tone === 'quiet') {
    return `${renderActionGuideSlot(slotKey, { ...ctx, featuredOnly: true })}`;
  }
  const field = visible ? renderLiveFieldSlot(slotKey, ctx) : '';
  return `${field}${renderActionGuideSlot(slotKey, ctx)}${renderMediaTeaserSlot(slotKey, ctx)}`;
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
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

function orderBoardKeysForRole(keys, role) {
  const prefer =
    role === 'study_room' ? 'concern-director' : role === 'tutor' ? 'concern-tutor' : 'concern-parent';
  const head = keys.filter((key) => key === prefer);
  const rest = keys.filter((key) => key !== prefer);
  return [...head, ...rest];
}

function resolveConcernBoardKeysForSlot(slotKey, ctx) {
  const slot = getRightRailSlot(slotKey);
  const configured = [];
  if (slot?.sourceBoardKey) configured.push(slot.sourceBoardKey);
  if (Array.isArray(slot?.sourceBoardKeys)) configured.push(...slot.sourceBoardKeys);
  const unique = [...new Set(configured.map(normalizeBoardKey).filter(Boolean))];
  const guestFilter = ctx.guestFilter || slot?.guestFilter || 'allow';
  const visible = unique.filter(
    (key) => isConcernBoardKey(key) && canShowBoardInRail(key, ctx.navRole, { guestFilter }),
  );
  return orderBoardKeysForRole(visible, ctx.navRole);
}

function communityHubForRole(role) {
  if (role === 'study_room') return { href: '#/community/director', label: '원장 고민방 더 보기' };
  if (role === 'tutor') return { href: '#/community/tutor', label: '과외쌤 고민방 더 보기' };
  return { href: '#/community', label: '커뮤니티 더 보기' };
}

function liveFieldCopy(slotKey, ctx) {
  const hub = communityHubForRole(ctx.navRole);
  if (slotKey === 'search_right_rail') {
    return {
      eyebrow: '탐색 도움',
      title: '많이 보는 고민',
      ctaLabel: hub.label,
      ctaHref: hub.href,
    };
  }
  if (slotKey === 'detail_right_rail') {
    return {
      eyebrow: '',
      title: '비슷한 고민·사례',
      ctaLabel: hub.label,
      ctaHref: hub.href,
    };
  }
  if (slotKey === 'register_right_rail' || slotKey === 'plans_right_rail') {
    return {
      eyebrow: '운영 현장',
      title: '지금 현장 고민',
      ctaLabel: hub.label,
      ctaHref: hub.href,
    };
  }
  return {
    eyebrow: '오늘의 현장',
    title: '지금 고민 HOT',
    ctaLabel: hub.label,
    ctaHref: hub.href,
  };
}

function railCardLimit(navRole) {
  if (navRole === 'study_room' || navRole === 'tutor') return 3;
  if (navRole === 'parent') return 1;
  return 3;
}

/** 레일 현장 칸 표식. 응답이 오면 이 표식이 붙은 칸만 바꾼다. */
const LIVE_FIELD_ATTR = 'data-rail-live-field';
let liveFieldSeq = 0;
/** @type {Map<string, { slotKey: string, ctx: any, mode: 'hot'|'latest' }>} */
const pendingLiveFields = new Map();
/** @type {Set<'hot'|'latest'>} */
const refreshingLiveModes = new Set();

/** @returns {'hot'|'latest'} */
function liveFieldMode(slotKey) {
  return slotKey === 'detail_right_rail' ? 'latest' : 'hot';
}

/**
 * 받은 값이 없거나 오래됐으면 서버에서 받고, 받은 뒤 표식 칸만 다시 그린다.
 * 받은 값이 없을 때는 보이지 않는 표식만 두고, 실패·0건이면 표식을 지운다.
 */
function renderLiveFieldSlot(slotKey, ctx) {
  ensureRailOwnerResolver();
  const boardKeys = resolveConcernBoardKeysForSlot(slotKey, ctx);
  if (!boardKeys.length) return '';
  const mode = liveFieldMode(slotKey);
  const ready = isRailConcernReady(mode);
  if (ready && isRailConcernFresh(mode)) return renderLiveFieldSection(slotKey, ctx, boardKeys, mode, '');

  const id = `rlf${++liveFieldSeq}`;
  pendingLiveFields.set(id, { slotKey, ctx, mode });
  scheduleLiveFieldRefresh(mode);
  const current = ready ? renderLiveFieldSection(slotKey, ctx, boardKeys, mode, id) : '';
  return current || `<div class="live-rail-slot-pending" ${LIVE_FIELD_ATTR}="${id}" hidden></div>`;
}

/** @param {'hot'|'latest'} mode */
function scheduleLiveFieldRefresh(mode) {
  if (refreshingLiveModes.has(mode)) return;
  refreshingLiveModes.add(mode);
  ensureRailConcernPosts(mode).then(() => {
    refreshingLiveModes.delete(mode);
    redrawLiveFields(mode);
  });
}

/** @param {'hot'|'latest'} mode */
function redrawLiveFields(mode) {
  const entries = [...pendingLiveFields].filter(([, entry]) => entry.mode === mode);
  if (!entries.length) return;
  if (!isRailConcernReady(mode)) {
    // 받는 사이 로그아웃·역할 변경으로 값이 버려졌다. 지금 세션으로 다시 받는다.
    scheduleLiveFieldRefresh(mode);
    return;
  }
  for (const [id, entry] of entries) {
    pendingLiveFields.delete(id);
    if (typeof document === 'undefined') continue;
    const el = document.querySelector(`[${LIVE_FIELD_ATTR}="${id}"]`);
    if (!el) continue;
    const boardKeys = resolveConcernBoardKeysForSlot(entry.slotKey, entry.ctx);
    const html = boardKeys.length ? renderLiveFieldSection(entry.slotKey, entry.ctx, boardKeys, mode, '') : '';
    if (html) el.outerHTML = html;
    else el.remove();
  }
}

/** @param {'hot'|'latest'} mode */
function liveFieldSamples(mode, limit, boardKeys) {
  return mode === 'latest'
    ? getLatestConcernSamples({ limit, boardKeys })
    : getHotConcernSamples({ limit, boardKeys });
}

/** 서버 글 항목 카드. 제목·방·댓글 수·반응 합계만 읽는다(본문·작성자는 읽지 않는다). */
function renderLivePostCard(post, ctx, slotKey) {
  const board = getConcernBoardByKey(post.boardKey);
  const href = `${board?.path || '/community'}/${encodeURIComponent(post.id)}`;
  return railSlotAnchor(
    href,
    'live-rail-card',
    ctx,
    `<span class="live-rail-card__board">${esc(board?.label || post.boardLabel || '커뮤니티')}</span>
          <strong class="live-rail-card__title">${esc(post.title)}</strong>
          <span class="live-rail-card__meta">댓글 ${Number(post.commentCount) || 0} · 반응 ${Number(post.reactionTotal) || 0}</span>`,
    slotKey,
  );
}

/**
 * @param {'hot'|'latest'} mode
 * @param {string} liveId 다시 그릴 표식. 빈 값이면 표식 없이 그린다.
 */
function renderLiveFieldSection(slotKey, ctx, boardKeys, mode, liveId) {
  const copy = liveFieldCopy(slotKey, ctx);
  const navRole = ctx.navRole;
  const limit = railCardLimit(navRole);
  const postCards = liveFieldSamples(mode, limit, boardKeys);
  if (!postCards.length) return '';

  const servedBoards = new Set(liveFieldSamples(mode, Number.MAX_SAFE_INTEGER, boardKeys).map((post) => post.boardKey));
  const postHtml = postCards.map((post) => renderLivePostCard(post, ctx, slotKey)).join('');

  const introHtml = boardKeys
    .filter(
      (key) => !servedBoards.has(key) && !canShowBoardPostsInRail(key, navRole) && canShowBoardInRail(key, navRole, ctx),
    )
    .slice(0, Math.max(0, limit - postCards.length))
    .map((key) => {
      const intro = getChannelIntro(key);
      const board = getConcernBoardByKey(key);
      const href = board?.path || boardRoute(key).replace(/^#/, '');
      return railSlotAnchor(
        href,
        'live-rail-card',
        ctx,
        `<span class="live-rail-card__board">${esc(board?.label || intro.title)}</span>
          <strong class="live-rail-card__title">${esc(intro.body)}</strong>
          <span class="live-rail-card__meta">이 공간의 소개만 볼 수 있어요</span>`,
        slotKey,
      );
    })
    .join('');

  const items = `${postHtml}${introHtml}`;
  const liveAttr = liveId ? ` ${LIVE_FIELD_ATTR}="${esc(liveId)}"` : '';

  return `
    <section class="live-rail-slot live-rail-slot--field"${liveAttr}>
      <div class="live-rail-slot__head">
        ${copy.eyebrow ? `<span class="live-rail-slot__eyebrow">${esc(copy.eyebrow)}</span>` : ''}
      </div>
      <div class="live-rail-slot__band"><strong class="live-rail-slot__title">${esc(copy.title)}</strong></div>
      <div class="live-rail-slot__items">${items}</div>
      ${railSlotAnchor(copy.ctaHref, 'live-rail-slot__cta', ctx, esc(copy.ctaLabel), slotKey)}
    </section>`;
}

/** 홈 레일 「이번 시즌 추천 행동」. 카드는 이 배열에만 추가한다. */
const HOME_SEASON_ACTION_CARDS = [
  { title: '찜·비교·쪽지', desc: '첫 연락은 쪽지로 안전하게', href: '#/guide/saved-contact', cta: '이용 흐름' },
];

function actionCtasForContext(slotKey, ctx) {
  const role = ctx.navRole;
  if (slotKey === 'detail_right_rail') {
    return [
      {
        title: '첫 연락 전 체크',
        desc: '노출 정보·가격·위치를 다시 확인하고, 첫 연락은 쪽지로 시작하세요',
        href: '#/guide/compare',
        cta: '쪽지 이용 알아보기',
        peek: 'compare',
      },
      {
        title: '안전이용',
        desc: '개인정보·선입금 전 확인할 내용을 안내해요',
        href: '#/guide/safe',
        cta: '안전이용 보기',
        peek: 'safe',
      },
    ];
  }
  if (slotKey === 'search_right_rail') {
    return [
      { title: '조건 좁히는 법', desc: '찜·비교로 후보를 줄여보세요', href: '#/guide/compare', cta: '찜·비교·쪽지', peek: 'compare' },
      { title: '안전 가이드', desc: '문의 전 꼭 볼 체크', href: '#/guide/safe', cta: '안전 안내', peek: 'safe' },
    ];
  }
  if (slotKey === 'register_right_rail') {
    if (role === 'tutor') {
      return [
        { title: '프로필 보완', desc: '문의 전환을 높이는 소개 흐름', href: '#/guide/register', cta: '등록방법', peek: 'registration' },
        { title: '학생 접근 흐름', desc: '요청문·쪽지 전 확인', href: '#/community/tutor', cta: '과외쌤 고민방' },
      ];
    }
    return [
      { title: '작성 전 체크', desc: '노출 정보와 쪽지 설정을 확인하세요', href: '#/guide/register', cta: '등록방법', peek: 'registration' },
      { title: '시즌 모집 준비', desc: '소개문·사진 보완 포인트', href: '#/community/director', cta: '공부방 고민방' },
    ];
  }
  if (role === 'study_room') {
    const paid = slotKey === 'plans_right_rail';
    return [
      paid
        ? { title: '유료 노출 안내', desc: '상세등록 이후 프라임/픽', href: '#/plans', cta: '유료상품', tone: 'paid' }
        : { title: '3분 등록부터', desc: '기본등록으로 가볍게 시작', href: '#/guide/registration', cta: '등록방법' },
      { title: '시즌 모집 준비', desc: '소개문·사진 보완 포인트', href: '#/community/director', cta: '공부방 고민방' },
    ];
  }
  if (role === 'tutor') {
    return [
      { title: '프로필 보완', desc: '문의 전환을 높이는 소개 흐름', href: '#/guide/registration', cta: '등록방법' },
      { title: '학생 접근 흐름', desc: '요청문·쪽지 전 확인', href: '#/community/tutor', cta: '과외쌤 고민방' },
    ];
  }
  if (role === 'parent') {
    return [
      { title: '찜·비교·쪽지', desc: '첫 연락은 쪽지로 안전하게', href: '#/guide/saved-contact', cta: '이용 흐름' },
      { title: '안전과외 가이드', desc: '개인정보 공유 전 행동 요령', href: '#/guide/safety', cta: '가이드 보기' },
    ];
  }
  if (slotKey === 'home_right_rail') return HOME_SEASON_ACTION_CARDS;
  return [
    { title: '찜·비교·쪽지', desc: '첫 연락은 쪽지로 안전하게', href: '#/guide/saved-contact', cta: '이용 흐름' },
    { title: '안전과외 가이드', desc: '개인정보 공유 전 행동 요령', href: '#/guide/safety', cta: '가이드 보기' },
  ];
}

function actionGuideCopy(slotKey) {
  if (slotKey === 'detail_right_rail') return { eyebrow: '사용 팁', title: '지금 필요한 안내' };
  if (slotKey === 'search_right_rail') return { eyebrow: '초보 가이드', title: '처음 찾는 분께' };
  if (slotKey === 'plans_right_rail') return { eyebrow: '상품 안내', title: '지금 필요한 안내' };
  if (slotKey === 'register_right_rail') return { eyebrow: '작성 도움', title: '지금 필요한 안내' };
  return { eyebrow: '지금 필요한 안내', title: '이번 시즌 추천 행동' };
}

function renderActionGuideSlot(slotKey, ctx) {
  const copy = actionGuideCopy(slotKey);
  const ctas = actionCtasForContext(slotKey, ctx);
  const featured = ctas[0];
  const rest = ctx.featuredOnly ? [] : ctas.slice(1, 2);
  if (!featured) return '';
  return `
    <section class="live-rail-slot live-rail-slot--action">
      <div class="live-rail-slot__head">
        ${copy.eyebrow ? `<span class="live-rail-slot__eyebrow">${esc(copy.eyebrow)}</span>` : ''}
      </div>
      <div class="live-rail-slot__band"><strong class="live-rail-slot__title">${esc(copy.title)}</strong></div>
      <div class="live-rail-slot__items">
        ${renderActionItem(featured, true, ctx, slotKey)}
        ${rest.map((item) => renderActionItem(item, false, ctx, slotKey)).join('')}
      </div>
    </section>`;
}

function renderActionItem(item, featured, ctx, slotKey) {
  const tone = item.tone === 'paid' ? ' paid' : '';
  const cls = featured ? `live-rail-action live-rail-action--signal${tone}` : 'live-rail-action live-rail-action--quiet';
  const inner = `<strong>${esc(item.title)}</strong>
      <span>${esc(item.desc)}</span>
      <em>${esc(item.cta)}</em>`;
  if (item.peek && isGuidePeekRail(slotKey)) {
    return `<button type="button" class="${cls}" data-rail-guide-peek="${esc(item.peek)}" data-rail-home-base="${esc(ctx.homeBase)}">${inner}</button>`;
  }
  return railSlotAnchor(item.href, cls, ctx, inner, slotKey);
}

function renderMediaTeaserSlot(_slotKey, _ctx) {
  const info = RAIL_PROVIDER_INFO;
  const href = String(info.href || '').trim();
  if (!href) return '';
  return `
    <section class="live-rail-slot live-rail-slot--media">
      <div class="live-rail-slot__head">
        <span class="live-rail-slot__eyebrow">${esc(info.eyebrow)}</span>
      </div>
      <div class="live-rail-slot__band"><strong class="live-rail-slot__title">${esc(info.title)}</strong></div>
      <p class="live-rail-media__caption live-rail-media__caption--idle">${esc(info.desc)}</p>
      <a href="${esc(href)}" class="live-rail-slot__cta" target="_blank" rel="noopener">${esc(info.cta)}</a>
    </section>`;
}

const RAIL_GUIDE_PEEK_ID = 'rail-guide-peek-overlay';

/** 문구 고정. 상세 경로는 guide/router.js 의 현재 등록 경로(/guide/register). */
const RAIL_GUIDE_PEEK = {
  compare: {
    title: '조건 좁히는 법',
    lead: '찜과 비교로 후보를 먼저 줄여 보세요. 마음에 드는 곳은 찜해 두고, 첫 연락은 쪽지로 안전하게 시작합니다.',
    path: '/guide/compare',
  },
  safe: {
    title: '안전 가이드',
    lead: '연락 전과 개인정보를 주고받기 전에 확인할 점을 모았습니다. 공식 기준과 신고는 고객센터에서 확인할 수 있어요.',
    path: '/guide/safe',
  },
  registration: {
    title: '작성 전 체크',
    lead: '등록 전에 노출되는 정보와 쪽지 설정을 확인하세요. 기본등록은 베이직카드로 가볍게 시작할 수 있습니다.',
    path: '/guide/register',
  },
};

/** @type {((e: KeyboardEvent) => void) | null} */
let railGuidePeekOnKey = null;

function closeRailGuidePeek() {
  document.getElementById(RAIL_GUIDE_PEEK_ID)?.remove();
  if (railGuidePeekOnKey) {
    document.removeEventListener('keydown', railGuidePeekOnKey, true);
    railGuidePeekOnKey = null;
  }
}

function openRailGuidePeek(kind, title, homeBase) {
  const spec = RAIL_GUIDE_PEEK[kind];
  if (!spec) return;
  closeRailGuidePeek();
  const base = String(homeBase || HOME_UI_BASE).replace(/\/$/, '');
  const href = `${base}/#${spec.path}`;
  const overlay = document.createElement('div');
  overlay.id = RAIL_GUIDE_PEEK_ID;
  overlay.className = 'guest-deep-gate-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'rail-guide-peek-title');
  overlay.innerHTML = `
    <div class="guest-deep-gate-overlay__backdrop" data-rail-guide-peek-dismiss></div>
    <div class="guest-gate guest-gate--deep">
      <h2 id="rail-guide-peek-title" class="guest-gate__title">${esc(title || spec.title)}</h2>
      <p class="guest-gate__lead">${esc(spec.lead)}</p>
      <div class="guest-gate__actions">
        <button type="button" class="btn btn--primary" data-rail-guide-peek-dismiss>닫기</button>
        <a class="btn btn--secondary" href="${esc(href)}" target="_blank" rel="noopener">이용안내에서 자세히</a>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelectorAll('[data-rail-guide-peek-dismiss]').forEach((el) => {
    el.addEventListener('click', closeRailGuidePeek);
  });
  railGuidePeekOnKey = (e) => {
    if (e.key !== 'Escape') return;
    if (!document.getElementById(RAIL_GUIDE_PEEK_ID)) return;
    e.stopPropagation();
    e.preventDefault();
    closeRailGuidePeek();
  };
  document.addEventListener('keydown', railGuidePeekOnKey, true);
}

function bindRailGuidePeekEvents(root) {
  root.querySelectorAll('[data-rail-guide-peek]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const kind = btn.getAttribute('data-rail-guide-peek') || '';
      const title = btn.querySelector('strong')?.textContent?.trim() || '';
      openRailGuidePeek(kind, title, btn.getAttribute('data-rail-home-base') || '');
    });
  });
}

export function bindRightRailEvents(root) {
  if (!root) return;
  bindRailGuidePeekEvents(root);
  const dialog = root.querySelector('.live-rail-media-dialog');
  const openers = root.querySelectorAll('[data-rail-media-open]');
  if (!dialog || !openers.length) return;

  const close = () => {
    dialog.hidden = true;
    const frame = dialog.querySelector('[data-rail-media-frame]');
    if (frame) frame.innerHTML = '';
    document.body.classList.remove('is-rail-media-open');
  };

  openers.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const src = String(btn.getAttribute('data-rail-media-src') || '').trim();
      const frame = dialog.querySelector('[data-rail-media-frame]');
      if (!src || !frame) return;
      const id = src.match(/[?&]v=([^&]+)/)?.[1] || src.split('/').pop();
      frame.innerHTML = `<iframe src="https://www.youtube.com/embed/${esc(id)}?rel=0" title="${esc(
        btn.getAttribute('data-rail-media-title') || '소개 영상',
      )}" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
      dialog.hidden = false;
      document.body.classList.add('is-rail-media-open');
    });
  });

  dialog.querySelectorAll('[data-rail-media-close]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      close();
    });
  });
}

/* ── 홈 「이달의 베스트 고민」 띠 ── */

/** 띠에 놓는 방 순서. 응답에 있는 다른 방은 뒤에 붙는다. */
const BEST_STRIP_BOARD_ORDER = ['concern-director', 'concern-tutor', 'concern-parent', 'concern-solved'];
const BEST_STRIP_PER_BOARD = 3;
const BEST_STRIP_MIN_REACTIONS = 5;
const BEST_STRIP_ATTR = 'data-concern-best-strip';
let bestStripRefreshing = false;

/** @param {Record<string, any[]>|null} boards */
function collectBestStripItems(boards) {
  if (!boards) return [];
  const keys = [
    ...BEST_STRIP_BOARD_ORDER.filter((key) => boards[key]),
    ...Object.keys(boards).filter((key) => !BEST_STRIP_BOARD_ORDER.includes(key)),
  ];
  return keys.flatMap((key) =>
    (boards[key] || [])
      .filter((post) => post?.id && post.title && (Number(post.reactionTotal) || 0) >= BEST_STRIP_MIN_REACTIONS)
      .slice(0, BEST_STRIP_PER_BOARD),
  );
}

/** 카드는 제목·방·반응 합계·댓글 수만 읽는다(본문·작성자는 읽지 않는다). */
function renderBestStripCard(post) {
  const board = getConcernBoardByKey(post.boardKey);
  const path = `${board?.path || '/community'}/${encodeURIComponent(post.id)}`;
  return `<a class="concern-best-card" href="#${esc(path)}" data-nav="${esc(path)}">
      <span class="concern-best-card__board">${esc(board?.label || post.boardLabel || '커뮤니티')}</span>
      <strong class="concern-best-card__title">${esc(post.title)}</strong>
      <span class="concern-best-card__meta">반응 ${Number(post.reactionTotal) || 0} · 댓글 ${Number(post.commentCount) || 0}</span>
    </a>`;
}

/** @param {Record<string, any[]>|null} boards */
function buildBestStripHtml(boards) {
  const items = collectBestStripItems(boards);
  if (!items.length) return '';
  return `
    <section class="concern-best-strip" ${BEST_STRIP_ATTR} aria-label="이달의 베스트 고민">
      <div class="concern-best-strip__head">
        <strong class="concern-best-strip__title">이달의 베스트 고민</strong>
        <a class="concern-best-strip__more" href="#/community" data-nav="/community">커뮤니티 더 보기</a>
      </div>
      <div class="concern-best-strip__track">${items.map(renderBestStripCard).join('')}</div>
    </section>`;
}

function scheduleBestStripRefresh() {
  if (bestStripRefreshing) return;
  bestStripRefreshing = true;
  ensureBestConcernPosts().then(() => {
    bestStripRefreshing = false;
    if (typeof document === 'undefined') return;
    const targets = document.querySelectorAll(`[${BEST_STRIP_ATTR}]`);
    if (!targets.length) return;
    if (!isBestConcernReady()) {
      // 받는 사이 로그아웃·역할 변경으로 값이 버려졌다. 지금 세션으로 다시 받는다.
      scheduleBestStripRefresh();
      return;
    }
    const html = buildBestStripHtml(getBestConcernBoards());
    targets.forEach((el) => {
      if (html) el.outerHTML = html;
      else el.remove();
    });
  });
}

/**
 * 홈 「이달의 베스트 고민」 가로 띠. 0건이면 아무것도 만들지 않는다.
 * 받은 값이 없을 때는 보이지 않는 표식만 두고, 응답이 오면 그 자리만 바꾼다.
 */
export function renderConcernBestStrip() {
  ensureRailOwnerResolver();
  const ready = isBestConcernReady();
  if (!ready || !isBestConcernFresh()) scheduleBestStripRefresh();
  const html = ready ? buildBestStripHtml(getBestConcernBoards()) : '';
  if (html) return html;
  return bestStripRefreshing ? `<div class="concern-best-strip-pending" ${BEST_STRIP_ATTR} hidden></div>` : '';
}

export function renderRightRailSidebar(slotKey = 'home_right_rail', opts = {}) {
  return renderPromoWithRightRail(slotKey, opts);
}

/** @param {string} slotKey — 상세 모달·검색 하단 등 인라인 보조 블록 */
export function renderRightRailBlock(slotKey = 'detail_right_rail', opts = {}) {
  return renderPromoWithRightRail(slotKey, { ...opts, variant: 'inline', tone: opts.tone || 'full' });
}

/** 공부방/과외쌤 등록 SPA — entry 밀도, home-ui 절대 링크 */
export function renderRegisterRightRail(opts = {}) {
  return renderPromoWithRightRail('register_right_rail', {
    tone: 'entry',
    linkMode: 'absolute',
    ...opts,
  });
}
