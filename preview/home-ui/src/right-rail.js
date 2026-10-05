import { getRightRailSlot } from './right-rail-store.js';
import { getNavRole } from './state.js';
import { getAuthUser, isAdminUser, isEmailVerified, isLoggedIn } from './auth-session.js';
import { isConcernBoardKey } from './board-channel-store.js';
import { COMMUNITY_BOARD_DEFS, CONCERN_RAIL_COPY, getConcernBoardByKey } from './concern/copy.js';
import {
  ensureBestConcernPosts,
  ensureRailConcernPosts,
  getBestConcernBoards,
  getBestConcernStatus,
  getHotConcernSamples,
  getLatestConcernPostsForBoard,
  getRailConcernStatus,
  isBestConcernFresh,
  isBestConcernReady,
  isRailConcernFresh,
  isRailConcernReady,
  RAIL_LATEST_LIMIT,
  setConcernRailOwnerResolver,
} from './concern/store.js';
import { HOME_UI_BASE } from '../../shared/preview-links.js';
import {
  canShowBoardInRail,
  getChannelIntro,
  isRailSlotVisible,
  normalizeBoardKey,
} from './board-channel-acl.js';
import { bindInfoRailEvents, renderInfoRailBanners } from './library/info-rail.js';
import { bestPostsForBoard, bindConcernRailEvents } from './concern/rail-concern-popup.js';

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

/** 상세 레일(178-6, 이번 범위 밖)의 고민방만 새 탭. data-nav·data-util-href는 같은 탭으로 가로채이므로 붙이지 않는다. */
function railBlankAnchor(hrefOrPath, className, ctx, inner) {
  const path = railPath(hrefOrPath);
  const href = `${ctx.homeBase}/#${path}`;
  const cls = className ? ` class="${className}"` : '';
  return `<a href="${esc(href)}" target="_blank" rel="noopener"${cls}>${inner}</a>`;
}

function isGuidePeekRail(slotKey) {
  return isSearchOrRegisterRail(slotKey) || slotKey === 'detail_right_rail';
}

/** 상세 레일만 새 탭. 찾기·등록은 인페이지 팝업이라 여기 넣지 않는다. */
function isBlankConcernRail(slotKey) {
  return slotKey === 'detail_right_rail';
}

/**
 * 찾기·등록은 고민 읽기 팝업(인페이지). 홈은 hash, 상세는 새 탭.
 * @returns {'inpage'|'blank'|'hash'}
 */
function railLeaveMode(slotKey, ctx) {
  if (isSearchOrRegisterRail(slotKey)) return 'inpage';
  if (isBlankConcernRail(slotKey) || ctx.linkMode === 'absolute') return 'blank';
  return 'hash';
}

/** 찾기·등록 HOT·고민 링크 → 방 배너와 같은 읽기 팝업 버튼. 주소는 바꾸지 않는다. */
function concernInPageControl(hrefOrPath, className, ctx, inner) {
  const path = railPath(hrefOrPath);
  const posted = path.match(/^\/community\/(director|tutor|parent|solved)\/([^/]+)$/);
  let boardKey = '';
  let postId = '';
  if (posted) {
    boardKey = COMMUNITY_BOARD_DEFS.find((b) => b.slug === posted[1])?.boardKey || '';
    try {
      postId = decodeURIComponent(posted[2]);
    } catch {
      postId = posted[2];
    }
  } else {
    boardKey = COMMUNITY_BOARD_DEFS.find((b) => b.path === path)?.boardKey || '';
  }
  if (!boardKey) {
    boardKey =
      ctx.navRole === 'study_room' ? 'concern-director' : ctx.navRole === 'tutor' ? 'concern-tutor' : 'concern-parent';
  }
  const postAttr = postId ? ` data-concern-rail-post="${esc(postId)}"` : ' data-concern-rail-more';
  const cls = className ? ` class="${className}"` : '';
  return `<button type="button"${cls} data-concern-rail-open="${esc(boardKey)}"${postAttr} data-concern-rail-nav="${esc(
    ctx.navRole,
  )}" data-concern-rail-guest="${esc(ctx.guestFilter)}" data-concern-rail-home="${esc(
    ctx.homeBase,
  )}" data-concern-rail-leave="inpage">${inner}</button>`;
}

function railSlotAnchor(hrefOrPath, className, ctx, inner, slotKey) {
  if (isSearchOrRegisterRail(slotKey) && isConcernPath(hrefOrPath)) {
    return concernInPageControl(hrefOrPath, className, ctx, inner);
  }
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
/** @typedef {'hot'|'latest'|'best'} LiveMode */
/** @type {Map<string, { mode: LiveMode, build: (liveId: string) => string }>} */
const pendingLiveFields = new Map();
/** @type {Set<LiveMode>} */
const refreshingLiveModes = new Set();

/** @param {LiveMode} mode */
function liveStatus(mode) {
  return mode === 'best' ? getBestConcernStatus() : getRailConcernStatus(mode);
}

/** @param {LiveMode} mode */
function liveFresh(mode) {
  return mode === 'best' ? isBestConcernFresh() : isRailConcernFresh(mode);
}

/** @param {LiveMode} mode */
function liveReady(mode) {
  return mode === 'best' ? isBestConcernReady() : isRailConcernReady(mode);
}

/** @param {LiveMode} mode */
function liveEnsure(mode) {
  return mode === 'best' ? ensureBestConcernPosts() : ensureRailConcernPosts(mode);
}

/**
 * 받은 값이 없거나 오래됐거나 실패했으면 서버에서 다시 받고, 받은 뒤 표식 칸만 다시 그린다.
 * 칸은 받는 중·0건·실패에도 제목과 함께 그대로 둔다.
 * @param {LiveMode} mode
 * @param {(liveId: string) => string} build
 */
function renderLiveTracked(mode, build) {
  if (liveStatus(mode) === 'ready' && liveFresh(mode)) return build('');
  const id = `rlf${++liveFieldSeq}`;
  pendingLiveFields.set(id, { mode, build });
  scheduleLiveFieldRefresh(mode);
  return build(id);
}

/**
 * 베스트·방 배너가 여는 레일 읽기 팝업에 넘길 값.
 * 찾기·등록은 inpage(팝업 안에서 이어 보기). 상세·absolute는 새 탭. 홈은 hash.
 */
function concernRailAttrs(slotKey, ctx) {
  const leave = railLeaveMode(slotKey, ctx);
  return ` data-concern-rail-nav="${esc(ctx.navRole)}" data-concern-rail-guest="${esc(ctx.guestFilter)}" data-concern-rail-home="${esc(
    ctx.homeBase,
  )}" data-concern-rail-leave="${leave}"`;
}

/**
 * 「이달의 베스트」(맨 위) + 고민방 배너 블럭(방마다 하나, 서버 최신순) + 「지금 고민 HOT」.
 * 방 목록은 슬롯 sourceBoardKeys 중 그 역할 레일에 올릴 수 있는 고민방이다. 고민방이 없는 슬롯은 이 층이 없다.
 */
function renderLiveFieldSlot(slotKey, ctx) {
  ensureRailOwnerResolver();
  const boardKeys = resolveConcernBoardKeysForSlot(slotKey, ctx);
  if (!boardKeys.length) return '';
  if (typeof document !== 'undefined') bindConcernRailEvents();
  const attrs = concernRailAttrs(slotKey, ctx);
  const best = renderLiveTracked('best', (liveId) => renderBestSection(boardKeys, attrs, liveId));
  const rooms = boardKeys
    .map((boardKey) => renderLiveTracked('latest', (liveId) => renderRoomBlock(boardKey, attrs, liveId)))
    .join('');
  const hot = renderLiveTracked('hot', (liveId) => renderHotSection(slotKey, ctx, boardKeys, liveId));
  return `${best}${rooms}${hot}`;
}

/** @param {LiveMode} mode */
function scheduleLiveFieldRefresh(mode) {
  if (refreshingLiveModes.has(mode)) return;
  refreshingLiveModes.add(mode);
  liveEnsure(mode).then(() => {
    refreshingLiveModes.delete(mode);
    redrawLiveFields(mode);
  });
}

/** @param {LiveMode} mode */
function redrawLiveFields(mode) {
  const entries = [...pendingLiveFields].filter(([, entry]) => entry.mode === mode);
  if (!entries.length) return;
  if (!liveReady(mode)) {
    // 받는 사이 로그아웃·역할 변경으로 값이 버려졌다. 지금 세션으로 다시 받는다.
    scheduleLiveFieldRefresh(mode);
    return;
  }
  for (const [id, entry] of entries) {
    pendingLiveFields.delete(id);
    if (typeof document === 'undefined') continue;
    const el = document.querySelector(`[${LIVE_FIELD_ATTR}="${id}"]`);
    if (!el) continue;
    el.outerHTML = entry.build('');
  }
}

/**
 * 받는 중이면 빈 값(블럭·제목만), 실패·0건이면 문구, 글이 있으면 null.
 * @param {'loading'|'ready'|'failed'} status
 * @param {number} count
 * @param {string} emptyCopy
 */
function railStateBody(status, count, emptyCopy) {
  if (status === 'loading') return '';
  if (status === 'failed') {
    return `<p class="live-rail-empty live-rail-empty--failed" role="status">${esc(CONCERN_RAIL_COPY.loadFailed)}</p>`;
  }
  if (!count) return `<p class="live-rail-empty">${esc(emptyCopy)}</p>`;
  return null;
}

/** @param {'loading'|'ready'|'failed'} status @param {number} count */
function railStateName(status, count) {
  if (status !== 'ready') return status;
  return count ? 'posts' : 'empty';
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

function concernBoardLabel(boardKey) {
  return getConcernBoardByKey(boardKey)?.label || getChannelIntro(boardKey).title;
}

/** 방 배너 글 제목 한 줄. 누르면 레일 읽기 팝업(그 글 선택). 제목만 읽는다. */
function renderRoomPostLink(boardKey, post) {
  return `<li><button type="button" class="live-rail-room__link" data-concern-rail-open="${esc(boardKey)}" data-concern-rail-post="${esc(
    post.id,
  )}">${esc(post.title)}</button></li>`;
}

/**
 * 고민방 배너 블럭. 제목(방 이름)·「더보기」는 받는 중·0건·실패에도 항상 그린다.
 * @param {string} attrs 레일 읽기 팝업 값(concernRailAttrs)
 * @param {string} liveId 다시 그릴 표식. 빈 값이면 표식 없이 그린다.
 */
function renderRoomBlock(boardKey, attrs, liveId) {
  const title = concernBoardLabel(boardKey);
  const status = getRailConcernStatus('latest');
  const posts = status === 'ready' ? getLatestConcernPostsForBoard(boardKey, RAIL_LATEST_LIMIT) : [];
  const stateBody = railStateBody(status, posts.length, CONCERN_RAIL_COPY.roomEmpty);
  const body =
    stateBody ?? `<ul class="live-rail-room__list">${posts.map((post) => renderRoomPostLink(boardKey, post)).join('')}</ul>`;
  const liveAttr = liveId ? ` ${LIVE_FIELD_ATTR}="${esc(liveId)}"` : '';
  return `
    <section class="live-rail-slot live-rail-slot--room" data-rail-room="${esc(boardKey)}" data-rail-state="${railStateName(
      status,
      posts.length,
    )}"${attrs}${liveAttr}>
      <div class="live-rail-slot__band"><strong class="live-rail-slot__title">${esc(title)}</strong></div>
      ${body}
      <div class="live-rail-room__foot">
        <button type="button" class="live-rail-room__more" data-concern-rail-open="${esc(boardKey)}" data-concern-rail-more aria-label="${esc(
          `${title} ${CONCERN_RAIL_COPY.more}`,
        )}">${esc(CONCERN_RAIL_COPY.more)}</button>
      </div>
    </section>`;
}

/** 이달의 베스트 한 줄(방별 1위). 누르면 그 방 베스트 최대 3개를 담은 레일 읽기 팝업. */
function renderBestItem(boardKey, post) {
  return `<li><button type="button" class="live-rail-best__item" data-concern-best-open="${esc(boardKey)}" data-concern-best-post="${esc(
    post.id,
  )}">
      <span class="live-rail-best__board">${esc(concernBoardLabel(boardKey))}</span>
      <span class="live-rail-best__title">${esc(post.title)}</span>
      <span class="live-rail-best__meta">${esc(CONCERN_RAIL_COPY.reaction)} ${Number(post.reactionTotal) || 0}</span>
    </button></li>`;
}

/**
 * 「이달의 베스트」(레일 맨 위). 이 레일에 올라간 고민방마다 1개(최대 3개).
 * 서버 규칙 그대로(이번 달 · 방별 · 반응 합계 많은 순 · 합계 5 미만 제외). 제목은 받는 중·0건·실패에도 그린다.
 * @param {string[]} boardKeys 이 역할 레일에 올릴 수 있는 고민방(학생은 학생·학부모 방만)
 * @param {string} attrs
 * @param {string} liveId
 */
function renderBestSection(boardKeys, attrs, liveId) {
  const status = getBestConcernStatus();
  const boards = status === 'ready' ? getBestConcernBoards() : null;
  const items = boards
    ? boardKeys.map((key) => ({ key, post: bestPostsForBoard(boards, key)[0] })).filter((item) => item.post)
    : [];
  const stateBody = railStateBody(status, items.length, CONCERN_RAIL_COPY.bestEmpty);
  const body =
    stateBody ?? `<ul class="live-rail-best__list">${items.map((item) => renderBestItem(item.key, item.post)).join('')}</ul>`;
  const liveAttr = liveId ? ` ${LIVE_FIELD_ATTR}="${esc(liveId)}"` : '';
  return `
    <section class="live-rail-slot live-rail-slot--best" data-rail-best data-rail-state="${railStateName(
      status,
      items.length,
    )}"${attrs}${liveAttr}>
      <div class="live-rail-slot__band"><strong class="live-rail-slot__title">${esc(CONCERN_RAIL_COPY.bestTitle)}</strong></div>
      ${body}
    </section>`;
}

/**
 * 「지금 고민 HOT」. 구역과 제목은 받는 중·0건·실패에도 항상 그린다.
 * @param {string} liveId 다시 그릴 표식. 빈 값이면 표식 없이 그린다.
 */
function renderHotSection(slotKey, ctx, boardKeys, liveId) {
  const copy = liveFieldCopy(slotKey, ctx);
  const status = getRailConcernStatus('hot');
  const posts = status === 'ready' ? getHotConcernSamples({ limit: railCardLimit(ctx.navRole), boardKeys }) : [];
  const stateBody = railStateBody(status, posts.length, CONCERN_RAIL_COPY.hotEmpty);
  const body =
    stateBody ?? `<div class="live-rail-slot__items">${posts.map((post) => renderLivePostCard(post, ctx, slotKey)).join('')}</div>`;
  const liveAttr = liveId ? ` ${LIVE_FIELD_ATTR}="${esc(liveId)}"` : '';

  return `
    <section class="live-rail-slot live-rail-slot--field" data-rail-hot data-rail-state="${railStateName(
      status,
      posts.length,
    )}"${liveAttr}>
      <div class="live-rail-slot__head">
        ${copy.eyebrow ? `<span class="live-rail-slot__eyebrow">${esc(copy.eyebrow)}</span>` : ''}
      </div>
      <div class="live-rail-slot__band"><strong class="live-rail-slot__title">${esc(copy.title)}</strong></div>
      ${body}
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
    const guideLeave = isSearchOrRegisterRail(slotKey) ? 'inpage' : 'blank';
    return `<button type="button" class="${cls}" data-rail-guide-peek="${esc(item.peek)}" data-rail-guide-leave="${guideLeave}" data-rail-home-base="${esc(
      ctx.homeBase,
    )}">${inner}</button>`;
  }
  return railSlotAnchor(item.href, cls, ctx, inner, slotKey);
}

/** 정보 게시판 배너. 찾기·등록 팝업은 인페이지로 이어 보고, 상세·absolute만 새 탭. */
function renderMediaTeaserSlot(slotKey, ctx) {
  const leave = railLeaveMode(slotKey, ctx);
  return renderInfoRailBanners({
    navRole: ctx.navRole,
    homeBase: ctx.homeBase,
    leaveInNewTab: leave === 'blank',
    continueInPage: leave === 'inpage',
  });
}

const RAIL_GUIDE_PEEK_ID = 'rail-guide-peek-overlay';

/**
 * 문구는 이용안내 화면(guide/screens.js)에 있는 문장. 찾기·등록 「자세히」는 이 목록을 팝업 안에서 펼친다.
 * 상세 경로는 guide/router.js 의 현재 등록 경로(/guide/register).
 */
const RAIL_GUIDE_PEEK = {
  compare: {
    title: '조건 좁히는 법',
    lead: '찜과 비교로 후보를 먼저 줄여 보세요. 마음에 드는 곳은 찜해 두고, 첫 연락은 쪽지로 안전하게 시작합니다.',
    path: '/guide/compare',
    points: [
      '찜 → 비교 → 쪽지 순으로 한 번만 따라가 보세요.',
      '당장 연락하지 않아도 괜찮아요. 찜한 공부방·과외쌤에 모아 두면 나중에 다시 볼 수 있어요.',
      '찜해 둔 곳 중 2~3개를, 지역·과목·시간·비용 등 내가 중요하게 보는 기준으로 나란히 확인합니다.',
      '짧은 인사와 궁금한 점만 적어서 보내 보세요. 쪽지는 회원끼리 첫 연락을 하는 통로입니다.',
      '이름·연락처·결제 정보를 쪽지에 먼저 보내지 마세요',
    ],
  },
  safe: {
    title: '안전 가이드',
    lead: '연락 전과 개인정보를 주고받기 전에 확인할 점을 모았습니다. 공식 기준과 신고는 고객센터에서 확인할 수 있어요.',
    path: '/guide/safe',
    points: [
      '노출된 신뢰정보는 상대가 프로필에 보여 둔 소개·자료이며, 플랫폼이 확인·인증했다는 뜻이 아닙니다.',
      '첫 연락은 쪽지로 시작하고, 상대 프로필을 확인하세요',
      '수업 조건, 비용, 장소, 환불 기준은 먼저 충분히 확인해 두세요.',
      '선입금·외부 결제·개인 계좌 요구에 바로 응하지 마세요',
      '주민번호·통장·비밀번호 등 민감 정보를 쪽지로 보내지 마세요',
    ],
  },
  registration: {
    title: '작성 전 체크',
    lead: '등록 전에 노출되는 정보와 쪽지 설정을 확인하세요. 기본등록은 베이직카드로 가볍게 시작할 수 있습니다.',
    path: '/guide/register',
    points: [
      '가입 필수정보를 입력하면 기본 노출이 시작됩니다. 상세등록은 카드와 상세 페이지에 보여줄 추가 정보를 보완하는 단계입니다.',
      '노출을 위한 운영자 심사·승인 절차는 없습니다.',
      '상세등록은 카드와 상세 페이지에 보여줄 추가 정보를 보완하는 단계입니다. 기본 노출의 필수 조건은 아닙니다.',
      '저장을 눌러야 이어집니다. 창만 닫으면 저장되지 않아요.',
    ],
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

function openRailGuidePeek(kind, title, homeBase, leave) {
  const spec = RAIL_GUIDE_PEEK[kind];
  if (!spec) return;
  closeRailGuidePeek();
  const inPage = leave === 'inpage';
  const base = String(homeBase || HOME_UI_BASE).replace(/\/$/, '');
  const href = `${base}/#${spec.path}`;
  const points = (spec.points || []).map((line) => `<li>${esc(line)}</li>`).join('');
  const more = inPage ? `<div data-rail-guide-more hidden><ul class="guest-gate__list">${points}</ul></div>` : '';
  const secondary = inPage
    ? `<button type="button" class="btn btn--secondary" data-rail-guide-expand>이용안내에서 자세히</button>`
    : `<a class="btn btn--secondary" href="${esc(href)}" target="_blank" rel="noopener">이용안내에서 자세히</a>`;
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
      ${more}
      <div class="guest-gate__actions">
        <button type="button" class="btn btn--primary" data-rail-guide-peek-dismiss>닫기</button>
        ${secondary}
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelectorAll('[data-rail-guide-peek-dismiss]').forEach((el) => {
    el.addEventListener('click', closeRailGuidePeek);
  });
  overlay.querySelector('[data-rail-guide-expand]')?.addEventListener('click', () => {
    const box = overlay.querySelector('[data-rail-guide-more]');
    if (box) box.hidden = false;
    overlay.querySelector('.guest-gate--deep')?.classList.add('is-rail-guide-expanded');
    overlay.querySelector('[data-rail-guide-expand]')?.remove();
    overlay.querySelector('[data-rail-guide-peek-dismiss]')?.focus();
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
      openRailGuidePeek(
        kind,
        title,
        btn.getAttribute('data-rail-home-base') || '',
        btn.getAttribute('data-rail-guide-leave') || 'blank',
      );
    });
  });
}

export function bindRightRailEvents(root) {
  if (!root) return;
  bindInfoRailEvents();
  bindConcernRailEvents();
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

export function renderRightRailSidebar(slotKey = 'home_right_rail', opts = {}) {
  return renderPromoWithRightRail(slotKey, opts);
}

/** @param {string} slotKey — 상세 모달·검색 하단 등 인라인 보조 블록 */
export function renderRightRailBlock(slotKey = 'detail_right_rail', opts = {}) {
  return renderPromoWithRightRail(slotKey, { ...opts, variant: 'inline', tone: opts.tone || 'full' });
}

/** 공부방/과외쌤 등록 SPA — entry 밀도. 고민·안내·정보 이동은 인페이지(절대 주소로 나가지 않음). */
export function renderRegisterRightRail(opts = {}) {
  return renderPromoWithRightRail('register_right_rail', {
    tone: 'entry',
    ...opts,
    linkMode: 'hash',
  });
}
