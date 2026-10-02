/**
 * 우측 레일 고민방 배너·이달의 베스트 → 레일 읽기 팝업(rail-popup.js 공용 틀).
 * 위: 고른 글 본문, 아래: 그 방 글 목록(배너는 서버 최신순 페이지, 베스트는 그 방 이달 베스트 최대 3개).
 * 읽기 전용. 댓글·반응·글쓰기는 「게시판에서 보기」로 옮겨 간 게시판에서 한다.
 * 목록·본문은 기존 고민방 서버 읽기 경로(/api/board/posts.php · /api/board/concern-hot.php?view=best)만 쓴다.
 * 게스트·읽기 권한 없는 역할은 서버가 제목 항목만 주므로 본문 자리에 안내만 그린다.
 */

import { CONCERN_RAIL_COPY as COPY, getConcernBoardByKey } from './copy.js';
import {
  ensureBestConcernPosts,
  fetchConcernRailPage,
  fetchConcernRailPost,
  getBestConcernBoards,
  getBestConcernStatus,
} from './store.js';
import { openRailPopup } from '../rail-popup.js';
import { getAuthUser } from '../auth-session.js';
import { boardLoginHref, canShowBoardInRail, getChannelIntro } from '../board-channel-acl.js';

export const CONCERN_POPUP_PAGE_SIZE = 10;
/** 서버 베스트 규칙과 같은 값(이번 달 · 방별 · 반응 합계 많은 순 · 합계 5 미만 제외). */
export const BEST_MIN_REACTIONS = 5;
export const BEST_PER_BOARD = 3;

/**
 * 한 방의 이달 베스트(서버 순서 그대로, 최대 3개).
 * @param {Record<string, any[]>|null} boards
 * @param {string} boardKey
 */
export function bestPostsForBoard(boards, boardKey) {
  return (boards?.[boardKey] || [])
    .filter((post) => post?.id && post.title && (Number(post.reactionTotal) || 0) >= BEST_MIN_REACTIONS)
    .slice(0, BEST_PER_BOARD);
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function fmtDate(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}.${m[2]}.${m[3]}` : '';
}

function ownerKey() {
  const user = getAuthUser();
  if (!user) return 'guest';
  return `${user.user_id ?? ''}:${user.role_type || ''}:${user.admin_level || ''}`;
}

function boardInfo(boardKey) {
  const board = getConcernBoardByKey(boardKey);
  return {
    label: board?.label || getChannelIntro(boardKey).title,
    path: board?.path || '/community',
  };
}

function popupCopy(emptyCopy) {
  return {
    close: COPY.popupClose,
    loading: COPY.loading,
    empty: emptyCopy,
    loadFailed: COPY.loadFailed,
    listLabel: COPY.popupList,
    pagerLabel: COPY.popupPager,
    prev: COPY.popupPrev,
    next: COPY.popupNext,
  };
}

/** @param {any} post */
function itemMeta(post) {
  return [fmtDate(post.createdAt), `${COPY.reaction} ${Number(post.reactionTotal) || 0}`].filter(Boolean).join(' · ');
}

/**
 * @param {{ post: any|null, access: string }} entry
 * @param {boolean} guest
 */
function renderSelectedPost(entry, boardLabel, guest) {
  const post = entry.post;
  if (!post) return `<p class="rail-popup__state">${esc(COPY.notFound)}</p>`;
  const counts = `${COPY.reaction} ${Number(post.reactionTotal) || 0} · ${COPY.comment} ${Number(post.commentCount) || 0}`;
  if (post.titlesOnly) {
    const head = `
      <p class="rail-popup__category">${esc(boardLabel)}</p>
      <h3 class="rail-popup__post-title">${esc(post.title)}</h3>
      <p class="rail-popup__meta">${esc([fmtDate(post.createdAt), counts].filter(Boolean).join(' · '))}</p>`;
    if (guest) {
      return `${head}
        <div class="rail-popup__guest">
          <p class="rail-popup__guest-text">${esc(COPY.guestDetail)}</p>
          <a class="rail-popup__login" href="${esc(boardLoginHref('community'))}">${esc(COPY.loginCta)}</a>
        </div>`;
    }
    return `${head}<p class="rail-popup__state">${esc(COPY.titlesOnly)}</p>`;
  }
  const meta = [post.authorDisplayName, fmtDate(post.createdAt), counts].filter(Boolean).join(' · ');
  return `
    <p class="rail-popup__category">${esc(boardLabel)}</p>
    <h3 class="rail-popup__post-title">${esc(post.title)}</h3>
    <p class="rail-popup__meta">${esc(meta)}</p>
    <div class="rail-popup__body">${esc(post.description)}</div>`;
}

/** @param {'room'|'best'} mode @param {string} boardKey @param {string} postId */
function findOpener(mode, boardKey, postId) {
  if (typeof document === 'undefined') return null;
  const key = String(boardKey).replace(/["\\]/g, '');
  const id = String(postId || '').replace(/["\\]/g, '');
  if (mode === 'best') {
    return /** @type {HTMLElement|null} */ (document.querySelector(`[data-concern-best-open="${key}"]`));
  }
  const scope = `[data-rail-room="${key}"]`;
  return /** @type {HTMLElement|null} */ (
    (id && document.querySelector(`${scope} [data-concern-rail-post="${id}"]`)) || document.querySelector(`${scope} [data-concern-rail-more]`)
  );
}

/**
 * @param {{
 *   mode: 'room'|'best',
 *   boardKey: string,
 *   postId?: string,
 *   opener?: HTMLElement|null,
 *   navRole: string,
 *   guestFilter?: string,
 *   homeBase: string,
 *   leaveInNewTab: boolean,
 * }} opts
 */
export function openConcernRailPopup(opts) {
  const { mode, boardKey, navRole } = opts;
  // 레일 배너와 같은 규칙. 학생에게는 공부방·과외쌤 고민방 팝업도 요청도 없다.
  if (!boardKey || !canShowBoardInRail(boardKey, navRole, { guestFilter: opts.guestFilter })) return;
  const { label, path } = boardInfo(boardKey);
  const boardHref = opts.leaveInNewTab ? `${String(opts.homeBase).replace(/\/$/, '')}/#${path}` : `#${path}`;
  const blank = opts.leaveInNewTab ? ' target="_blank" rel="noopener"' : '';
  const guest = () => !getAuthUser() || navRole === 'guest';
  const postId = String(opts.postId || '');

  /** @type {(offset: number, limit: number) => Promise<import('../rail-popup.js').RailPopupPage>} */
  const loadPage =
    mode === 'best'
      ? async (offset, limit) => {
          await ensureBestConcernPosts();
          if (getBestConcernStatus() !== 'ready') return { status: 'failed', items: [], total: 0 };
          const posts = bestPostsForBoard(getBestConcernBoards(), boardKey);
          return {
            status: 'ready',
            total: posts.length,
            items: posts.slice(offset, offset + limit).map((p) => ({ id: p.id, title: p.title, meta: itemMeta(p) })),
          };
        }
      : async (offset, limit) => {
          const res = await fetchConcernRailPage(boardKey, offset, limit, navRole);
          return {
            status: 'ready',
            total: res.total,
            items: res.posts.map((p) => ({ id: p.id, title: p.title, meta: itemMeta(p) })),
          };
        };

  openRailPopup({
    kind: mode === 'best' ? 'concern-best' : 'concern-room',
    title: mode === 'best' ? `${label} · ${COPY.bestTitle}` : label,
    copy: popupCopy(mode === 'best' ? COPY.bestEmpty : COPY.roomEmpty),
    pageSize: CONCERN_POPUP_PAGE_SIZE,
    selectedId: postId,
    opener: opts.opener || null,
    refocus: () => findOpener(mode, boardKey, postId),
    sessionKey: () => `${ownerKey()}|${navRole}`,
    loadPage,
    renderSelected: async (id) => renderSelectedPost(await fetchConcernRailPost(boardKey, id, navRole), label, guest()),
    footerHtml: `<a class="rail-popup__go" href="${esc(boardHref)}" data-rail-popup-leave${blank}>${esc(COPY.goBoard)}</a>`,
  });
}

/** @param {MouseEvent} e */
function onDocumentClick(e) {
  const target = e.target instanceof Element ? e.target : null;
  if (!target) return;
  const room = target.closest('[data-concern-rail-open]');
  const best = room ? null : target.closest('[data-concern-best-open]');
  const btn = room || best;
  const section = btn?.closest('[data-concern-rail-nav]');
  if (!btn || !section) return;
  e.preventDefault();
  openConcernRailPopup({
    mode: room ? 'room' : 'best',
    boardKey: btn.getAttribute(room ? 'data-concern-rail-open' : 'data-concern-best-open') || '',
    postId: btn.getAttribute(room ? 'data-concern-rail-post' : 'data-concern-best-post') || '',
    opener: /** @type {HTMLElement} */ (btn),
    navRole: section.getAttribute('data-concern-rail-nav') || 'guest',
    guestFilter: section.getAttribute('data-concern-rail-guest') || '',
    homeBase: section.getAttribute('data-concern-rail-home') || '',
    leaveInNewTab: section.getAttribute('data-concern-rail-leave') === 'blank',
  });
}

let delegateBound = false;

/** 배너·베스트 버튼 클릭을 문서 한 곳에서 받는다(칸을 다시 그려도 다시 걸 필요 없음). */
export function bindConcernRailEvents() {
  if (delegateBound || typeof document === 'undefined') return;
  delegateBound = true;
  document.addEventListener('click', onDocumentClick);
}
