/**
 * 홈 [공지 | 동네 인사] 2단 박스. 게스트·학생·공부방·과외쌤 홈이 같은 이 컴포넌트를 쓴다.
 * 자리는 홈 안내 3칸 바로 아래, 내 박스·탭 위. 좁은 화면에서는 위아래로 쌓인다.
 * 두 칸 모두 받는 중·0건·실패에도 칸과 제목을 그대로 두고, 문구는 home-news-copy.js 에서만 가져온다.
 * 공지: GET /api/board/posts.php?board_key=notice&view=home (역할 필터는 서버) — 홈은 최신 3줄, 팝업은 전체.
 * 동네 인사: neighborhood-greeting-ui.js (GET /api/neighborhood-greetings.php, 같은 동네·게스트 티저 규칙).
 */

import { HOME_NEWS_COPY as COPY } from './home-news-copy.js';
import { createNewsLoader } from './home-news-loader.js';
import { fetchHomeViewNotices, noticeTargetLabel } from './support/notice-store.js';
import {
  bindNeighborhoodGreetingRail,
  ensureGreetings,
  greetingCellBody,
  isGreetingFresh,
  isGreetingReady,
  renderNeighborhoodGreetingRail,
} from './neighborhood-greeting-ui.js';
import { getAuthUser } from './auth-session.js';
import { openRailPopup } from './rail-popup.js';
import { navigateToSupport } from './state.js';

export const NOTICE_HOME_LINES = 3;
const NOTICE_POPUP_PAGE_SIZE = 10;
const NOTICE_TTL_MS = 60 * 1000;
const NOTICE_BOARD_PATH = '/support/notice';

/** @typedef {'guest'|'parent'|'study_room'|'tutor'} NewsViewer */

const noticeLoader = createNewsLoader(
  () => fetchHomeViewNotices(NOTICE_HOME_LINES),
  /** @type {Awaited<ReturnType<typeof fetchHomeViewNotices>>} */ ([]),
  NOTICE_TTL_MS,
);

function sessionOwner() {
  const user = getAuthUser();
  if (!user) return 'guest';
  return `${user.user_id ?? ''}:${user.role_type || ''}:${user.admin_level || ''}`;
}

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  ['auth:login', 'auth:logout', 'auth:role-change'].forEach((name) => {
    window.addEventListener(name, () => noticeLoader.reset());
  });
}

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

/* ── 공지 칸 ── */

/** @returns {{ state: 'loading'|'failed'|'empty'|'posts', html: string }} */
function noticeCellBody() {
  const who = sessionOwner();
  const status = noticeLoader.status(who);
  if (status === 'loading') {
    return { state: 'loading', html: `<p class="home-news-row__state" role="status">${esc(COPY.loading)}</p>` };
  }
  if (status === 'failed') {
    return {
      state: 'failed',
      html: `<p class="home-news-row__state home-news-row__state--failed" role="status">${esc(COPY.loadFailed)}</p>`,
    };
  }
  const notices = (noticeLoader.peek(who) || []).slice(0, NOTICE_HOME_LINES);
  if (!notices.length) return { state: 'empty', html: `<p class="home-news-row__state">${esc(COPY.noticeEmpty)}</p>` };
  const rows = notices
    .map(
      (n) => `<li>
        <button type="button" class="home-news-row__notice" data-home-notice-open="${esc(n.id)}">
          <span class="home-news-row__badge">${esc(noticeTargetLabel(n))}</span>
          <span class="home-news-row__notice-title">${esc(n.title)}</span>
          <span class="home-news-row__date">${esc(fmtDate(n.date))}</span>
        </button>
      </li>`,
    )
    .join('');
  return { state: 'posts', html: `<ul class="home-news-row__list">${rows}</ul>` };
}

function renderNoticeCell() {
  const { state, html } = noticeCellBody();
  return `
    <section class="home-news-row__cell home-news-row__cell--notice" data-home-news="notice" data-home-news-state="${state}" aria-labelledby="home-news-notice-title">
      <div class="home-news-row__head">
        <h2 class="home-news-row__title" id="home-news-notice-title" aria-label="${esc(COPY.noticeTitle)}">${esc(COPY.noticeTitle)}</h2>
        <button type="button" class="home-news-row__more" data-home-notice-more aria-label="${esc(COPY.noticeMoreLabel)}">${esc(COPY.more)}</button>
      </div>
      <div class="home-news-row__body" data-home-news-body>${html}</div>
    </section>`;
}

/* ── 응답 뒤 칸 본문만 다시 그린다(칸·제목·이벤트는 그대로) ── */

/** @param {'notice'|'greeting'} kind */
function paintCells(kind) {
  if (typeof document === 'undefined') return;
  document.querySelectorAll(`[data-home-news="${kind}"]`).forEach((cell) => {
    const viewer = /** @type {NewsViewer} */ (cell.closest('[data-home-news-row]')?.getAttribute('data-home-news-viewer') || 'guest');
    const { state, html } = kind === 'notice' ? noticeCellBody() : greetingCellBody(viewer);
    cell.setAttribute('data-home-news-state', state);
    const body = cell.querySelector('[data-home-news-body]');
    if (body) body.innerHTML = html;
  });
}

let noticeRefreshing = false;
function refreshNotices() {
  if (noticeRefreshing || noticeLoader.isFresh(sessionOwner())) return;
  noticeRefreshing = true;
  noticeLoader.ensure(sessionOwner()).then(() => {
    noticeRefreshing = false;
    // 받는 사이 로그인·로그아웃·역할 변경으로 값이 버려졌다. 지금 세션으로 다시 받는다.
    if (noticeLoader.peek(sessionOwner()) === null) {
      refreshNotices();
      return;
    }
    paintCells('notice');
  });
}

let greetingRefreshing = false;
function refreshGreetings() {
  if (greetingRefreshing || isGreetingFresh()) return;
  greetingRefreshing = true;
  ensureGreetings().then(() => {
    greetingRefreshing = false;
    if (!isGreetingReady()) {
      refreshGreetings();
      return;
    }
    paintCells('greeting');
  });
}

/**
 * [공지 | 동네 인사] 2단 박스.
 * @param {NewsViewer} viewer
 */
export function renderHomeNewsRow(viewer) {
  const html = `
    <section class="home-news-row" data-home-news-row data-home-news-viewer="${esc(viewer)}" aria-label="${esc(COPY.rowLabel)}">
      ${renderNoticeCell()}
      ${renderNeighborhoodGreetingRail(viewer)}
    </section>`;
  refreshNotices();
  refreshGreetings();
  return html;
}

/* ── 공지 팝업(rail-popup 공용 틀) ── */

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
    (safe && document.querySelector(`[data-home-notice-open="${safe}"]`)) || document.querySelector('[data-home-notice-more]')
  );
}

/**
 * 위: 고른 공지 본문, 아래: 공지 목록(페이지당 10). 제목에서 열면 그 공지, 「더보기」면 최신 공지를 고른다.
 * 목록·본문은 서버가 역할로 거른 view=home 응답만 쓴다(학생 전용 공지는 학생에게만). 읽기 전용.
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
/** 「게시판에서 보기」는 고객센터 맥락 역할을 남기고 공지 게시판으로 간다(예전 홈 공지 띠 링크와 같은 이동). */
function bindNoticeGo() {
  if (goBound || typeof document === 'undefined') return;
  goBound = true;
  document.addEventListener('click', (e) => {
    const go = e.target instanceof Element ? e.target.closest('[data-home-notice-go]') : null;
    if (!go) return;
    e.preventDefault();
    navigateToSupport(NOTICE_BOARD_PATH);
  });
}

/**
 * @param {HTMLElement} root
 * @param {{ viewer?: NewsViewer, onRerender?: () => void, sourceRoute?: string }} [opts]
 */
export function bindHomeNewsRow(root, opts = {}) {
  const row = root.querySelector('[data-home-news-row]');
  if (!row) return;
  bindNoticeGo();
  bindNeighborhoodGreetingRail(/** @type {HTMLElement} */ (row), opts);
  const notice = row.querySelector('[data-home-news="notice"]');
  notice?.addEventListener('click', (e) => {
    const target = e.target instanceof Element ? e.target : null;
    if (!target) return;
    const item = target.closest('[data-home-notice-open]');
    if (item) {
      e.preventDefault();
      openNoticePopup({ selectedId: item.getAttribute('data-home-notice-open') || '', opener: /** @type {HTMLElement} */ (item) });
      return;
    }
    const more = target.closest('[data-home-notice-more]');
    if (more) {
      e.preventDefault();
      openNoticePopup({ opener: /** @type {HTMLElement} */ (more) });
    }
  });
}
