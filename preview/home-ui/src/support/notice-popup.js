/**
 * 공지 팝업(rail-popup). 홈 뉴스 칸·마이페이지 「내 공지」가 같이 쓴다.
 * 목록·본문: GET view=home (역할 필터는 서버).
 */

import { HOME_NEWS_COPY as COPY } from '../home-news-copy.js';
import { fetchHomeViewNotices, noticeTargetLabel } from './notice-store.js';
import { openRailPopup } from '../rail-popup.js';
import { navigateToSupport } from '../state.js';
import { getAuthUser } from '../auth-session.js';

const NOTICE_POPUP_PAGE_SIZE = 10;
const NOTICE_BOARD_PATH = '/support/notice';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDate(value) {
  const m = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}.${m[2]}.${m[3]}` : '';
}

function sessionOwner() {
  const user = getAuthUser();
  if (!user) return 'guest';
  return `${user.user_id ?? ''}:${user.role_type || ''}:${user.admin_level || ''}`;
}

function popupCopy() {
  return {
    close: COPY.popupClose,
    loading: COPY.loading,
    empty: COPY.noticeEmpty,
    loadFailed: COPY.loadFailed,
    listLabel: COPY.popupList,
    pagerLabel: COPY.popupPager,
    prev: COPY.popupPrev,
    next: COPY.popupNext,
  };
}

/** @param {{ id: string, title: string, date: string, body: string[], targetRole?: string }} n */
function renderNoticeBody(n) {
  const date = fmtDate(n.date);
  return `
    <p class="rail-popup__category">${esc(noticeTargetLabel(n))}</p>
    <h3 class="rail-popup__post-title">${esc(n.title)}</h3>
    ${date ? `<p class="rail-popup__meta">${esc(date)}</p>` : ''}
    <div class="rail-popup__body">${(n.body || []).map(esc).join('\n')}</div>`;
}

/** @param {string} id */
function findNoticeOpener(id) {
  if (typeof document === 'undefined') return null;
  const safe = String(id || '').replace(/["\\]/g, '');
  return /** @type {HTMLElement|null} */ (
    (safe && document.querySelector(`[data-home-notice-open="${safe}"]`)) ||
    (safe && document.querySelector(`[data-mypage-notice-open="${safe}"]`)) ||
    document.querySelector('[data-home-notice-more]') ||
    document.querySelector('[data-mypage-notice-more]')
  );
}

/**
 * 위: 고른 공지 본문, 아래: 공지 목록(페이지당 10).
 * @param {{ selectedId?: string, opener?: HTMLElement|null }} opts
 */
export function openNoticePopup({ selectedId = '', opener = null } = {}) {
  /** @type {Promise<{ ok: boolean, items: Awaited<ReturnType<typeof fetchHomeViewNotices>> }>|null} */
  let listOnce = null;
  const loadList = () =>
    (listOnce ??= fetchHomeViewNotices().then(
      (items) => ({ ok: true, items }),
      () => ({ ok: false, items: [] }),
    ));
  openRailPopup({
    kind: 'notice',
    title: COPY.noticePopupTitle,
    copy: popupCopy(),
    pageSize: NOTICE_POPUP_PAGE_SIZE,
    selectedId,
    opener,
    refocus: () => findNoticeOpener(selectedId),
    sessionKey: sessionOwner,
    loadPage: async (offset, limit) => {
      const res = await loadList();
      if (!res.ok) return { status: 'failed', items: [], total: 0 };
      return {
        status: 'ready',
        total: res.items.length,
        items: res.items.slice(offset, offset + limit).map((n) => ({ id: n.id, title: n.title, meta: fmtDate(n.date) })),
      };
    },
    renderSelected: async (id) => {
      const res = await loadList();
      if (!res.ok) return `<p class="rail-popup__state" role="status">${esc(COPY.loadFailed)}</p>`;
      const notice = res.items.find((n) => n.id === id);
      if (!notice) return `<p class="rail-popup__state">${esc(COPY.noticeNotFound)}</p>`;
      return renderNoticeBody(notice);
    },
    footerHtml: `<a class="rail-popup__go" href="#${NOTICE_BOARD_PATH}" data-rail-popup-leave data-home-notice-go>${esc(COPY.goBoard)}</a>`,
  });
}

let goBound = false;
/** 「게시판에서 보기」→ 고객센터 공지 게시판 */
export function bindNoticeGo() {
  if (goBound || typeof document === 'undefined') return;
  goBound = true;
  document.addEventListener('click', (e) => {
    const go = e.target instanceof Element ? e.target.closest('[data-home-notice-go]') : null;
    if (!go) return;
    e.preventDefault();
    navigateToSupport(NOTICE_BOARD_PATH);
  });
}
