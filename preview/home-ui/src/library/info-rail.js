/**
 * 우측 레일 정보 게시판 배너(LIBRARY_BOARDS 순서, 게시판마다 서버 최신 3개)와 레일 읽기 팝업 연결.
 * 보이는 역할은 board-channel-acl.js canDiscoverBoard 로만 정한다. 학생·member 에게는 학생 팁 게시판(info-student) 배너만 있고
 * 공급자 게시판 배너 DOM 은 없다.
 * 배너·팝업 데이터는 info-board-store.js 로만 서버에서 받는다(메모리 캐시, 세션 주인이 바뀌면 버림).
 * 문구는 library-copy.js INFO_RAIL_COPY, 배너 제목은 LIBRARY_BOARDS label.
 */

import { LIBRARY_BOARDS, INFO_RAIL_COPY as COPY } from './library-copy.js';
import {
  INFO_POPUP_PAGE_SIZE,
  currentInfoViewer,
  getInfoRailList,
  isInfoRailFresh,
  loadInfoPage,
  loadInfoPost,
  loadInfoRailList,
  resetInfoBoardData,
} from './info-board-store.js';
import { getAuthUser, isAdminUser, isEmailVerified } from '../auth-session.js';
import { boardLoginHref, canDiscoverBoard, resolveBoardRole } from '../board-channel-acl.js';
import { openRailPopup, syncRailPopupSession } from '../rail-popup.js';

/**
 * @typedef {{ navRole: string, homeBase: string, leaveInNewTab: boolean }} InfoRailCtx
 * leaveInNewTab: 찾기·상세·등록 레일과 다른 번들(absolute)에서는 팝업의 게시판 이동 링크를 홈 주소 새 탭으로 연다.
 */

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  ['auth:login', 'auth:logout', 'auth:role-change'].forEach((name) => {
    window.addEventListener(name, () => resetInfoBoardData());
  });
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function fmtDate(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}.${m[2]}.${m[3]}` : '';
}

function categoryLabel(board, key) {
  return board?.categories.find((c) => c.key === key)?.label || '';
}

/**
 * 배너·팝업 열람자. 세션이 있으면 세션 역할(미인증·역할 미정은 게스트, 관리자는 관리자 — resolveNavRole 과 같은 규칙),
 * 세션이 없으면 레일 역할. 화면 역할(예: 홈 주소)만 보면 로그인한 학생에게 배너가 새어 나갈 수 있어 세션을 먼저 본다.
 * @param {string} navRole
 */
function railViewer(navRole) {
  const user = getAuthUser();
  if (!user) return { boardRole: resolveBoardRole(navRole || 'guest'), ownerKey: 'guest' };
  const session = currentInfoViewer();
  if (isAdminUser()) return { boardRole: 'admin', ownerKey: session.ownerKey };
  if (!isEmailVerified() || user.oauth_role_pending === true) return { boardRole: 'guest', ownerKey: 'guest' };
  return session;
}

/* ── 배너 ── */

const LIVE_ATTR = 'data-rail-info-live';
let liveSeq = 0;
/** @type {Map<string, { boardKey: string, navRole: string, build: (liveId: string) => string }>} */
const pendingBanners = new Map();

function bannerBody(entry) {
  if (!entry) return { state: 'loading', html: `<p class="live-rail-empty live-rail-info__loading" role="status">${esc(COPY.loading)}</p>` };
  if (entry.status === 'failed') {
    return { state: 'failed', html: `<p class="live-rail-empty live-rail-empty--failed" role="status">${esc(COPY.loadFailed)}</p>` };
  }
  if (!entry.posts.length) return { state: 'empty', html: `<p class="live-rail-empty">${esc(COPY.empty)}</p>` };
  return { state: 'posts', html: '' };
}

/**
 * 게시판 배너 하나. 제목(게시판 이름)과 「더보기」는 받는 중·0건·실패에도 항상 그린다.
 * @param {{ boardKey: string, label: string }} board @param {InfoRailCtx} ctx @param {string} liveId
 */
function renderBanner(board, ctx, liveId) {
  const viewer = railViewer(ctx.navRole);
  const entry = getInfoRailList(viewer, board.boardKey);
  const { state, html } = bannerBody(entry);
  const key = esc(board.boardKey);
  const list =
    state === 'posts'
      ? `<ul class="live-rail-room__list live-rail-info__list">${entry.posts
          .map(
            (post) => `<li>
            <button type="button" class="live-rail-info__link" data-info-rail-open="${key}" data-info-rail-post="${esc(post.id)}">
              <span class="live-rail-info__title">${esc(post.title)}</span>
              <span class="live-rail-info__date">${esc(fmtDate(post.createdAt))}</span>
            </button>
          </li>`,
          )
          .join('')}</ul>`
      : html;
  const liveAttr = liveId ? ` ${LIVE_ATTR}="${esc(liveId)}"` : '';
  return `
    <section class="live-rail-slot live-rail-slot--info" data-rail-info="${key}" data-rail-state="${state}" data-info-rail-nav="${esc(
      ctx.navRole,
    )}" data-info-rail-home="${esc(ctx.homeBase)}" data-info-rail-leave="${ctx.leaveInNewTab ? 'blank' : 'hash'}"${liveAttr}>
      <div class="live-rail-slot__band"><strong class="live-rail-slot__title">${esc(board.label)}</strong></div>
      ${list}
      <div class="live-rail-info__foot">
        <button type="button" class="live-rail-slot__cta live-rail-info__more" data-info-rail-open="${key}" data-info-rail-more>${esc(COPY.more)}</button>
      </div>
    </section>`;
}

/** 같은 게시판 진행 중 요청은 store 가 하나로 묶는다. 버려진 요청이 끝나도 새 요청을 막지 않는다. */
function scheduleRefresh(boardKey, navRole) {
  loadInfoRailList(railViewer(navRole), boardKey).then(() => redraw(boardKey));
}

/** 응답이 오면 표식이 붙은 배너만 바꾼다. 받는 사이 세션이 바뀌거나 저장·삭제로 값이 버려졌으면 지금 세션으로 다시 받는다. */
function redraw(boardKey) {
  const entries = [...pendingBanners].filter(([, entry]) => entry.boardKey === boardKey);
  if (!entries.length) return;
  const navRole = entries[0][1].navRole;
  const viewer = railViewer(navRole);
  if (!canDiscoverBoard(boardKey, viewer.boardRole)) {
    entries.forEach(([id]) => pendingBanners.delete(id));
    return;
  }
  if (!getInfoRailList(viewer, boardKey)) {
    scheduleRefresh(boardKey, navRole);
    return;
  }
  for (const [id, entry] of entries) {
    pendingBanners.delete(id);
    if (typeof document === 'undefined') continue;
    const el = document.querySelector(`[${LIVE_ATTR}="${id}"]`);
    if (el) el.outerHTML = entry.build('');
  }
}

/**
 * 받은 값이 없거나 오래됐거나 실패였으면 서버에서 다시 받고, 받은 뒤 그 배너만 다시 그린다.
 * @param {{ boardKey: string, label: string }} board @param {InfoRailCtx} ctx
 */
function renderTracked(board, ctx) {
  const viewer = railViewer(ctx.navRole);
  const build = (liveId) => renderBanner(board, ctx, liveId);
  if (getInfoRailList(viewer, board.boardKey) && isInfoRailFresh(viewer, board.boardKey)) return build('');
  const id = `rif${++liveSeq}`;
  pendingBanners.set(id, { boardKey: board.boardKey, navRole: ctx.navRole, build });
  scheduleRefresh(board.boardKey, ctx.navRole);
  return build(id);
}

/**
 * 「이번 시즌 추천 행동」 아래 정보 게시판 배너. 볼 수 있는 게시판만(학생·member 는 info-student 하나).
 * @param {InfoRailCtx} ctx
 */
export function renderInfoRailBanners(ctx) {
  const viewer = railViewer(ctx.navRole);
  const boards = LIBRARY_BOARDS.filter((b) => canDiscoverBoard(b.boardKey, viewer.boardRole));
  if (typeof document !== 'undefined') {
    bindInfoRailEvents();
    syncRailPopupSession();
  }
  if (!boards.length) return '';
  return boards.map((board) => renderTracked(board, ctx)).join('');
}

/* ── 팝업 ── */

/** @param {{ boardKey: string, categories: { key: string, label: string }[] }} board @param {{ status: string, access?: string, post: any }} entry */
function renderSelectedPost(board, entry) {
  if (entry.status === 'not_found') return `<p class="rail-popup__state">${esc(COPY.notFound)}</p>`;
  if (entry.status === 'blocked') return `<p class="rail-popup__state">${esc(COPY.blocked)}</p>`;
  if (entry.status !== 'ready' || !entry.post) return `<p class="rail-popup__state" role="status">${esc(COPY.loadFailed)}</p>`;
  const post = entry.post;
  const full = entry.access === 'full';
  const meta = [full ? post.authorLabel : '', fmtDate(post.createdAt)].filter(Boolean).map(esc).join(' · ');
  const category = categoryLabel(board, post.categoryId);
  const head = `
    ${category ? `<p class="rail-popup__category">${esc(category)}</p>` : ''}
    <h3 class="rail-popup__post-title">${esc(post.title)}</h3>
    ${meta ? `<p class="rail-popup__meta">${meta}</p>` : ''}`;
  if (!full) {
    return `${head}
      <div class="rail-popup__guest">
        <p class="rail-popup__guest-text">${esc(COPY.guestDetail)}</p>
        <a class="rail-popup__login" href="${esc(boardLoginHref('library'))}">${esc(COPY.loginCta)}</a>
      </div>`;
  }
  return `${head}<div class="rail-popup__body">${esc(post.body)}</div>`;
}

function popupCopy() {
  return {
    close: COPY.popupClose,
    loading: COPY.loading,
    empty: COPY.empty,
    loadFailed: COPY.loadFailed,
    listLabel: COPY.popupList,
    pagerLabel: COPY.popupPager,
    prev: COPY.popupPrev,
    next: COPY.popupNext,
  };
}

function findOpener(boardKey, postId) {
  if (typeof document === 'undefined') return null;
  const scope = `[data-rail-info="${boardKey}"]`;
  const sel = postId ? `${scope} [data-info-rail-post="${postId.replace(/["\\]/g, '')}"]` : `${scope} [data-info-rail-more]`;
  return /** @type {HTMLElement|null} */ (document.querySelector(sel) || document.querySelector(`${scope} [data-info-rail-more]`));
}

/**
 * @param {{ boardKey: string, postId: string, opener: HTMLElement|null, navRole: string, homeBase: string, leaveInNewTab: boolean }} opts
 */
function openInfoBoardPopup({ boardKey, postId, opener, navRole, homeBase, leaveInNewTab }) {
  const board = LIBRARY_BOARDS.find((b) => b.boardKey === boardKey);
  if (!board || !canDiscoverBoard(boardKey, railViewer(navRole).boardRole)) return;
  const boardHref = leaveInNewTab ? `${String(homeBase).replace(/\/$/, '')}/#${board.path}` : `#${board.path}`;
  const blank = leaveInNewTab ? ' target="_blank" rel="noopener"' : '';
  openRailPopup({
    kind: 'info-board',
    title: board.label,
    copy: popupCopy(),
    pageSize: INFO_POPUP_PAGE_SIZE,
    selectedId: postId,
    opener,
    refocus: () => findOpener(boardKey, postId),
    sessionKey: () => {
      const v = railViewer(navRole);
      return `${v.ownerKey}|${v.boardRole}`;
    },
    loadPage: async (offset, limit) => {
      const res = await loadInfoPage(railViewer(navRole), boardKey, offset, limit);
      return {
        status: res.status === 'ready' ? 'ready' : 'failed',
        total: res.total,
        items: res.posts.map((p) => ({ id: p.id, title: p.title, meta: fmtDate(p.createdAt) })),
      };
    },
    renderSelected: async (id) => renderSelectedPost(board, await loadInfoPost(railViewer(navRole), boardKey, id)),
    footerHtml: `<a class="rail-popup__go" href="${esc(boardHref)}" data-rail-popup-leave${blank}>${esc(COPY.goBoard)}</a>`,
  });
}

/** @param {MouseEvent} e */
function onDocumentClick(e) {
  const btn = e.target instanceof Element ? e.target.closest('[data-info-rail-open]') : null;
  const section = btn?.closest('[data-rail-info]');
  if (!btn || !section) return;
  e.preventDefault();
  openInfoBoardPopup({
    boardKey: btn.getAttribute('data-info-rail-open') || '',
    postId: btn.getAttribute('data-info-rail-post') || '',
    opener: /** @type {HTMLElement} */ (btn),
    navRole: section.getAttribute('data-info-rail-nav') || 'guest',
    homeBase: section.getAttribute('data-info-rail-home') || '',
    leaveInNewTab: section.getAttribute('data-info-rail-leave') === 'blank',
  });
}

let delegateBound = false;

/** 배너 버튼 클릭을 문서 한 곳에서 받는다(배너를 다시 그려도 다시 걸 필요 없음). */
export function bindInfoRailEvents() {
  if (delegateBound || typeof document === 'undefined') return;
  delegateBound = true;
  document.addEventListener('click', onDocumentClick);
}
