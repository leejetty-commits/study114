/**
 * 레일 읽기 팝업 공용 틀. 페이지를 옮기지 않고(주소 그대로) 지금 화면 위에 뜬다.
 * 위쪽은 고른 글, 아래쪽은 그 게시판 글 목록(페이지 번호). 제목·문구·목록·본문은 모두 여는 쪽이 넣는다.
 * 한 번에 하나만 열린다. 로그아웃·로그인·역할 변경(auth 이벤트)이나 sessionKey 가 바뀌면 닫힌다.
 * 글쓰기·수정·삭제는 이 틀에서 하지 않는다.
 */

const ROOT_ID = 'rail-popup';
const TITLE_ID = 'rail-popup-title';
const LOCK_CLASS = 'is-rail-popup-open';
const SESSION_EVENTS = ['auth:login', 'auth:logout', 'auth:role-change'];
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * @typedef {{ id: string, title: string, meta?: string }} RailPopupItem
 * @typedef {{ status: 'ready'|'failed', items: RailPopupItem[], total: number }} RailPopupPage
 * @typedef {{
 *   close: string, loading: string, empty: string, loadFailed: string,
 *   listLabel: string, pagerLabel: string, prev: string, next: string,
 * }} RailPopupCopy
 * @typedef {{
 *   title: string,
 *   copy: RailPopupCopy,
 *   loadPage: (offset: number, limit: number) => Promise<RailPopupPage>,
 *   renderSelected: (id: string, item: RailPopupItem|null) => Promise<string>,
 *   selectedId?: string,
 *   pageSize?: number,
 *   footerHtml?: string,
 *   opener?: HTMLElement|null,
 *   refocus?: () => HTMLElement|null,
 *   sessionKey?: () => string,
 *   kind?: string,
 * }} RailPopupSpec
 * renderSelected 가 돌려주는 HTML 은 여는 쪽이 이스케이프한다.
 * footerHtml 안의 [data-rail-popup-leave] 링크는 누르면 팝업을 닫고 그대로 이동한다.
 * [data-rail-popup-continue] 는 팝업을 닫지 않고 아래 글 목록으로 스크롤한다.
 */

/** @type {null | { spec: RailPopupSpec, root: HTMLElement, panel: HTMLElement, page: number, pages: number, items: RailPopupItem[], selectedId: string, pageToken: number, selectToken: number, sessionAtOpen: string, scroll: { x: number, y: number }, onKey: (e: KeyboardEvent) => void, onFocusIn: (e: FocusEvent) => void, onSession: () => void }} */
let current = null;

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function sessionOf(spec) {
  try {
    return spec.sessionKey ? String(spec.sessionKey()) : '';
  } catch {
    return '';
  }
}

export function isRailPopupOpen() {
  return current !== null;
}

/** 열린 팝업의 세션 주인이 바뀌었으면 닫는다. 레일을 다시 그릴 때 부른다. */
export function syncRailPopupSession() {
  if (current && current.spec.sessionKey && sessionOf(current.spec) !== current.sessionAtOpen) {
    closeRailPopup({ restoreFocus: false });
  }
}

/** @param {{ restoreFocus?: boolean }} [opts] */
export function closeRailPopup(opts = {}) {
  if (!current) return;
  const c = current;
  current = null;
  document.removeEventListener('keydown', c.onKey, true);
  document.removeEventListener('focusin', c.onFocusIn, true);
  SESSION_EVENTS.forEach((name) => window.removeEventListener(name, c.onSession));
  c.root.remove();
  document.documentElement.classList.remove(LOCK_CLASS);
  document.body.classList.remove(LOCK_CLASS);
  if (window.scrollX !== c.scroll.x || window.scrollY !== c.scroll.y) window.scrollTo(c.scroll.x, c.scroll.y);
  if (opts.restoreFocus === false) return;
  const opener = c.spec.opener?.isConnected ? c.spec.opener : c.spec.refocus?.();
  opener?.focus?.({ preventScroll: true });
}

function focusables(panel) {
  return [...panel.querySelectorAll(FOCUSABLE)].filter((el) => !el.closest('[hidden]'));
}

function pagerHtml(page, pages, copy) {
  if (pages <= 1) return '';
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const end = Math.min(pages, start + 4);
  const nums = [];
  for (let n = start; n <= end; n += 1) {
    nums.push(
      `<button type="button" class="rail-popup__page" data-rail-popup-page="${n}"${n === page ? ' aria-current="page"' : ''}>${n}</button>`,
    );
  }
  return `
    <button type="button" class="rail-popup__page rail-popup__page--step" data-rail-popup-page="${page - 1}"${page <= 1 ? ' disabled' : ''}>${esc(copy.prev)}</button>
    ${nums.join('')}
    <button type="button" class="rail-popup__page rail-popup__page--step" data-rail-popup-page="${page + 1}"${page >= pages ? ' disabled' : ''}>${esc(copy.next)}</button>`;
}

function stateHtml(text, role = '') {
  return `<p class="rail-popup__state"${role ? ` role="${role}"` : ''}>${esc(text)}</p>`;
}

function markSelected(c) {
  c.root.querySelectorAll('[data-rail-popup-item]').forEach((el) => {
    if (el.getAttribute('data-rail-popup-item') === c.selectedId) el.setAttribute('aria-current', 'true');
    else el.removeAttribute('aria-current');
  });
}

/** @param {string} id */
async function select(id) {
  const c = current;
  if (!c || !id) return;
  c.selectedId = id;
  const token = ++c.selectToken;
  markSelected(c);
  const box = /** @type {HTMLElement} */ (c.root.querySelector('[data-rail-popup-selected]'));
  box.hidden = false;
  box.innerHTML = stateHtml(c.spec.copy.loading, 'status');
  const item = c.items.find((it) => it.id === id) || null;
  let html;
  try {
    html = await c.spec.renderSelected(id, item);
  } catch {
    html = stateHtml(c.spec.copy.loadFailed, 'status');
  }
  if (current !== c || token !== c.selectToken) return;
  if (c.spec.sessionKey && sessionOf(c.spec) !== c.sessionAtOpen) {
    closeRailPopup({ restoreFocus: false });
    return;
  }
  box.innerHTML = html;
}

/** @param {number} page @param {{ focusPager?: boolean }} [opts] */
async function showPage(page, opts = {}) {
  const c = current;
  if (!c) return;
  const size = c.spec.pageSize || 10;
  const target = Math.max(1, page);
  const token = ++c.pageToken;
  const list = /** @type {HTMLElement} */ (c.root.querySelector('[data-rail-popup-items]'));
  const pager = /** @type {HTMLElement} */ (c.root.querySelector('[data-rail-popup-pager]'));
  list.innerHTML = stateHtml(c.spec.copy.loading, 'status');
  let res;
  try {
    res = await c.spec.loadPage((target - 1) * size, size);
  } catch {
    res = { status: 'failed', items: [], total: 0 };
  }
  if (current !== c || token !== c.pageToken) return;
  if (c.spec.sessionKey && sessionOf(c.spec) !== c.sessionAtOpen) {
    closeRailPopup({ restoreFocus: false });
    return;
  }
  const items = res?.status === 'ready' && Array.isArray(res.items) ? res.items : [];
  c.items = items;
  c.page = target;
  c.pages = Math.max(1, Math.ceil((Number(res?.total) || 0) / size));
  if (res?.status !== 'ready') {
    list.innerHTML = stateHtml(c.spec.copy.loadFailed, 'status');
  } else if (!items.length) {
    list.innerHTML = stateHtml(c.spec.copy.empty);
  } else {
    list.innerHTML = `<ul class="rail-popup__items">${items
      .map(
        (it) => `<li>
          <button type="button" class="rail-popup__item" data-rail-popup-item="${esc(it.id)}">
            <span class="rail-popup__item-title">${esc(it.title)}</span>
            ${it.meta ? `<span class="rail-popup__item-meta">${esc(it.meta)}</span>` : ''}
          </button>
        </li>`,
      )
      .join('')}</ul>`;
  }
  pager.innerHTML = res?.status === 'ready' ? pagerHtml(c.page, c.pages, c.spec.copy) : '';
  markSelected(c);
  if (opts.focusPager) {
    /** @type {HTMLElement|null} */ (pager.querySelector('[aria-current="page"]'))?.focus();
  }
  if (!c.selectedId) {
    if (items.length) select(items[0].id);
    else /** @type {HTMLElement} */ (c.root.querySelector('[data-rail-popup-selected]')).hidden = true;
  }
}

/** @param {MouseEvent} e */
function onClick(e) {
  const c = current;
  const target = /** @type {HTMLElement|null} */ (e.target instanceof Element ? e.target : null);
  if (!c || !target) return;
  if (target.closest('[data-rail-popup-dismiss]')) {
    e.preventDefault();
    closeRailPopup();
    return;
  }
  const stay = target.closest('[data-rail-popup-continue]');
  if (stay) {
    e.preventDefault();
    c.root.setAttribute('data-rail-popup-continued', 'true');
    const list = c.root.querySelector('[data-rail-popup-items]');
    const scroller = c.root.querySelector('.rail-popup__scroll');
    if (list && scroller) {
      const top = list.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
      scroller.scrollTo({ top });
    }
    const first = /** @type {HTMLElement|null} */ (list?.querySelector('[data-rail-popup-item]'));
    first?.focus();
    return;
  }
  const leave = target.closest('[data-rail-popup-leave]');
  if (leave) {
    closeRailPopup({ restoreFocus: leave.getAttribute('target') === '_blank' });
    return;
  }
  const pageBtn = target.closest('[data-rail-popup-page]');
  if (pageBtn && !pageBtn.hasAttribute('disabled')) {
    e.preventDefault();
    const n = Number(pageBtn.getAttribute('data-rail-popup-page'));
    if (Number.isFinite(n) && n >= 1 && n <= c.pages && n !== c.page) showPage(n, { focusPager: true });
    return;
  }
  const itemBtn = target.closest('[data-rail-popup-item]');
  if (itemBtn) {
    e.preventDefault();
    const id = itemBtn.getAttribute('data-rail-popup-item') || '';
    if (id && id !== c.selectedId) select(id);
  }
}

/**
 * 팝업을 연다. 이미 열려 있으면 닫고 새로 연다.
 * @param {RailPopupSpec} spec
 */
export function openRailPopup(spec) {
  if (typeof document === 'undefined' || !spec) return;
  closeRailPopup({ restoreFocus: false });
  const copy = spec.copy;
  const root = document.createElement('div');
  root.id = ROOT_ID;
  root.className = 'rail-popup';
  if (spec.kind) root.setAttribute('data-rail-popup-kind', spec.kind);
  root.innerHTML = `
    <div class="rail-popup__backdrop" data-rail-popup-dismiss></div>
    <div class="rail-popup__panel" role="dialog" aria-modal="true" aria-labelledby="${TITLE_ID}" tabindex="-1">
      <header class="rail-popup__head">
        <h2 class="rail-popup__title" id="${TITLE_ID}">${esc(spec.title)}</h2>
        <button type="button" class="rail-popup__close" data-rail-popup-dismiss>${esc(copy.close)}</button>
      </header>
      <div class="rail-popup__scroll">
        <section class="rail-popup__selected" data-rail-popup-selected aria-live="polite"></section>
        <section class="rail-popup__list" aria-label="${esc(copy.listLabel)}">
          <div data-rail-popup-items></div>
          <nav class="rail-popup__pager" data-rail-popup-pager aria-label="${esc(copy.pagerLabel)}"></nav>
        </section>
      </div>
      ${spec.footerHtml ? `<footer class="rail-popup__foot">${spec.footerHtml}</footer>` : ''}
    </div>`;
  const panel = /** @type {HTMLElement} */ (root.querySelector('.rail-popup__panel'));

  const onKey = (/** @type {KeyboardEvent} */ e) => {
    if (!current) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      closeRailPopup();
      return;
    }
    if (e.key !== 'Tab') return;
    const list = focusables(panel);
    if (!list.length) {
      e.preventDefault();
      panel.focus();
      return;
    }
    const first = list[0];
    const last = list[list.length - 1];
    const active = document.activeElement;
    if (!active || !panel.contains(active) || active === panel) {
      e.preventDefault();
      (e.shiftKey ? last : first).focus();
    } else if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };
  const onFocusIn = (/** @type {FocusEvent} */ e) => {
    if (current && e.target instanceof Node && !root.contains(e.target)) {
      /** @type {HTMLElement|null} */ (panel.querySelector('.rail-popup__close'))?.focus();
    }
  };
  const onSession = () => closeRailPopup({ restoreFocus: false });

  current = {
    spec,
    root,
    panel,
    page: 1,
    pages: 1,
    items: [],
    selectedId: String(spec.selectedId || ''),
    pageToken: 0,
    selectToken: 0,
    sessionAtOpen: sessionOf(spec),
    scroll: { x: window.scrollX, y: window.scrollY },
    onKey,
    onFocusIn,
    onSession,
  };

  root.addEventListener('click', onClick);
  document.body.appendChild(root);
  document.documentElement.classList.add(LOCK_CLASS);
  document.body.classList.add(LOCK_CLASS);
  document.addEventListener('keydown', onKey, true);
  document.addEventListener('focusin', onFocusIn, true);
  SESSION_EVENTS.forEach((name) => window.addEventListener(name, onSession));
  /** @type {HTMLElement|null} */ (panel.querySelector('.rail-popup__close'))?.focus({ preventScroll: true });

  if (current.selectedId) select(current.selectedId);
  showPage(1);
}
