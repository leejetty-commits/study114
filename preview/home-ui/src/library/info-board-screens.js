/**
 * 정보 게시판 화면 — 목록(분류 탭 + 더 보기) · 상세 · 글쓰기 · 수정 · 삭제 확인.
 * 문구는 library-copy.js(INFO_BOARD_COPY · LIBRARY_BOARDS · STUDENT_TIPS_COPY · LIBRARY_ENTRY_COPY)에서만 가져온다.
 * 열람 판정은 서버가 하고, 화면은 서버가 준 access·canCompose·canEdit·canDelete·canCheer 만 따른다.
 */

import {
  LIBRARY_BOARDS,
  INFO_BOARD_COPY as COPY,
  LIBRARY_ENTRY_COPY as ENTRY,
  STUDENT_TIPS_COPY as TIPS,
} from './library-copy.js';
import { parseInfoBoardPath } from './library-router.js';
import {
  currentInfoViewer,
  infoAccessFor,
  getInfoList,
  loadInfoList,
  loadMoreInfoList,
  getInfoPost,
  loadInfoPost,
  saveInfoPost,
  deleteInfoPost,
  toggleInfoCheer,
} from './info-board-store.js';
import { renderStateCard } from '../empty-state-copy.js';
import { getAuthUser } from '../auth-session.js';
import { boardLoginHref, canDiscoverBoard, STUDENT_TIPS_BOARD_KEY } from '../board-channel-acl.js';

/** 본문 줄바꿈은 CSS(pre-wrap)로 살리고, 꺾쇠는 글자로만 그린다. */
function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function boardOf(boardKey) {
  return LIBRARY_BOARDS.find((b) => b.boardKey === boardKey) || null;
}

function isStudentTips(board) {
  return board?.boardKey === STUDENT_TIPS_BOARD_KEY;
}

function categoryLabel(board, key) {
  return board?.categories.find((c) => c.key === key)?.label || '';
}

function fmtDate(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}.${m[2]}.${m[3]}` : '';
}

/* ── 안내 띠 (저장·삭제 결과) ── */

/** @type {{ path: string, tone: 'success'|'error', text: string }|null} */
let _flash = null;

function setFlash(path, tone, text) {
  _flash = { path, tone, text };
}

function renderFlash(path) {
  if (!_flash) return '';
  if (_flash.path !== path) {
    _flash = null;
    return '';
  }
  const role = _flash.tone === 'error' ? 'alert' : 'status';
  return `
    <div class="concern-flash concern-flash--${esc(_flash.tone)}" role="${role}">
      <p class="concern-flash__text">${esc(_flash.text)}</p>
      <button type="button" class="concern-flash__close" data-info-flash-close aria-label="${esc(COPY.flashClose)}">${esc(COPY.flashClose)}</button>
    </div>`;
}

/* ── 진입 링크 (자료실 메뉴) ── */

/** 진입 링크·입구 카드를 보여 줄 게시판. 학생·member 는 info-student 하나(공급자 게시판은 빠진다). */
function visibleInfoBoards(boardRole) {
  return LIBRARY_BOARDS.filter((b) => canDiscoverBoard(b.boardKey, boardRole));
}

/**
 * 볼 수 있는 게시판만. 학생·member 에게는 info-student 만(공급자 게시판 이름은 내보내지 않는다).
 * @param {string} activePath @param {string} boardRole
 */
export function renderInfoBoardNavLinks(activePath, boardRole) {
  const visible = visibleInfoBoards(boardRole);
  if (!visible.length) return '';
  const active = parseInfoBoardPath(activePath || '')?.boardKey || '';
  return `
        <li class="sup-nav__group" aria-hidden="true"><span class="sup-nav__label info-board-nav__heading">${esc(COPY.navHeading)}</span></li>
        ${visible
          .map(
            (b) => `<li>
              <a href="#${esc(b.path)}" class="sup-nav__link${b.boardKey === active ? ' is-active' : ''}" data-lib-nav="${esc(b.path)}">
                <span class="sup-nav__label">${esc(b.label)}</span>
              </a>
            </li>`,
          )
          .join('')}`;
}

/* ── 자료실 입구(#/support/library · #/library) 게시판 카드 ── */

/**
 * 고객센터 화면은 세션 확인 전에 먼저 그려지므로, 역할이 정해지기 전에는 링크를 그리지 않는다.
 * 세션 사용자가 있으면 그 역할을 쓰고, 없으면 me.php 로 비로그인임을 확인한 뒤에만 게스트로 본다.
 * me.php 가 실패하면 실패 상자(다시 시도)를, 확인 중에는 불러오는 중 상자를 그린다.
 */
let _anonConfirmed = false;
let _entryFailed = false;
/** @type {Promise<void>|null} */
let _entryProbe = null;

window.addEventListener('auth:logout', () => {
  _anonConfirmed = true;
  _entryFailed = false;
});

function entryRoleKnown() {
  return getAuthUser() !== null || _anonConfirmed;
}

/** 역할이 아직 정해지지 않았으면 비로그인 여부를 한 번 확인한다. 실패하면 실패로 표시하고 역할은 정해지지 않은 채로 둔다. */
export function primeInfoBoardEntry() {
  if (entryRoleKnown()) return Promise.resolve();
  _entryProbe ??= fetch('/api/auth/me.php', { credentials: 'include' })
    .then((res) => res.json().catch(() => ({})).then((data) => ({ res, data })))
    .then(({ res, data }) => {
      if (!res.ok || !data?.ok) {
        _entryFailed = true;
        return;
      }
      _entryFailed = false;
      if (!data.authenticated) _anonConfirmed = true;
    })
    .catch(() => {
      _entryFailed = true;
    })
    .finally(() => {
      _entryProbe = null;
    });
  return _entryProbe;
}

function renderLibraryBoardCard(b) {
  const titleId = `lib-board-${b.slug}`;
  return `
      <li class="lib-board-card" data-library-board="${esc(b.boardKey)}">
        <article class="lib-board-card__inner" aria-labelledby="${titleId}">
          <h3 class="lib-board-card__title" id="${titleId}">${esc(b.label)}</h3>
          <p class="lib-board-card__lead">${esc(b.lead)}</p>
          <ul class="lib-board-card__chips" aria-label="${esc(ENTRY.categoriesLabel)}">
            ${b.categories.map((c) => `<li class="lib-chip">${esc(c.label)}</li>`).join('')}
          </ul>
          <a href="#${esc(b.path)}" class="btn btn--primary btn--sm lib-board-card__go" aria-label="${esc(`${b.label} ${ENTRY.enter}`)}">${esc(ENTRY.enter)}</a>
        </article>
      </li>`;
}

/**
 * 자료실 입구 게시판 카드. 노출은 canDiscoverBoard 그대로라 학생·member 에게는 info-student 카드만 있다.
 * 역할 확인 전에는 카드 없이 불러오는 중 상자, me.php 실패면 실패 상자 + 다시 시도.
 */
export function renderLibraryBoardCards() {
  if (!entryRoleKnown()) {
    if (_entryFailed) {
      return `<div class="lib-board-empty" data-library-entry-state="failed">${renderStateCard({
        title: ENTRY.loadFailed,
        cta: ENTRY.retry,
        ctaAction: 'library-entry-retry',
      })}</div>`;
    }
    return `<div class="lib-board-empty" data-info-entry-pending data-library-entry-state="loading">${renderStateCard({ title: ENTRY.loading })}</div>`;
  }
  const visible = visibleInfoBoards(currentInfoViewer().boardRole);
  return `
    <ul class="lib-board-grid" aria-label="${esc(ENTRY.listLabel)}" data-library-entry>
      ${visible.map(renderLibraryBoardCard).join('')}
    </ul>`;
}

/** @param {HTMLElement} root @param {(() => void)|undefined} rerender */
export function bindInfoBoardEntry(root, rerender) {
  root.querySelectorAll('[data-action="library-entry-retry"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      _entryFailed = false;
      if (rerender) rerender();
    });
  });
  if (!root.querySelector('[data-info-entry-pending]')) return;
  primeInfoBoardEntry().then(() => {
    if ((entryRoleKnown() || _entryFailed) && rerender) rerender();
  });
}

/** 셸 제목 뒤에 붙일 게시판 이름. 볼 수 없는 역할이면 빈 값. */
export function infoBoardTitleFor(path, boardRole) {
  const route = parseInfoBoardPath(path || '');
  if (!route || !canDiscoverBoard(route.boardKey, boardRole)) return '';
  return boardOf(route.boardKey)?.label || '';
}

/* ── 공통 조각 ── */

function renderBlocked() {
  return `
    <section class="sup-panel-card">
      <div class="sup-panel-card__body">${renderStateCard({ title: COPY.blocked })}</div>
    </section>`;
}

function renderLoading(attrs) {
  return `<p class="info-board__loading" ${attrs} role="status">${esc(COPY.loading)}</p>`;
}

function renderBack(board) {
  return `<a class="concern-back" href="#${esc(board.path)}">${esc(COPY.backToList)}</a>`;
}

function renderFrame(board, path, inner) {
  return `
    <section class="sup-panel-card info-board" data-info-board="${esc(board.boardKey)}">
      <div class="sup-panel-card__body">
        <p class="info-board__lead">${esc(board.lead)}</p>
        ${renderFlash(path)}
        ${inner}
      </div>
    </section>`;
}

function renderMeta(board, post, access) {
  const bits = [categoryLabel(board, post.categoryId)];
  if (access === 'full' && post.authorLabel) bits.push(post.authorLabel);
  bits.push(fmtDate(post.createdAt));
  if (access === 'full' && post.edited) bits.push(COPY.edited);
  return bits
    .filter(Boolean)
    .map((b) => `<span>${esc(b)}</span>`)
    .join('<span aria-hidden="true"> · </span>');
}

/* ── 목록 ── */

function renderTabs(board, current) {
  const tabs = [{ key: '', label: COPY.allTab }, ...board.categories];
  return `
    <div class="sup-subtabs info-board__tabs" role="tablist">
      ${tabs
        .map(
          (t) =>
            `<button type="button" role="tab" class="sup-subtab info-board__tab${t.key === current ? ' is-active' : ''}" aria-selected="${t.key === current}" data-info-cat="${esc(t.key)}">${esc(t.label)}</button>`,
        )
        .join('')}
    </div>`;
}

/** 글쓰기를 못 하는 계정 안내. info-student 는 게스트에게 로그인 안내, 무료 공급자에게 그 게시판 안내. */
function composeBlockedNotice(board, viewer) {
  if (!isStudentTips(board)) return COPY.freeProviderCompose;
  if (viewer.boardRole === 'guest') return COPY.loginToWrite;
  if (viewer.boardRole === 'supply-room' || viewer.boardRole === 'supply-tutor') return TIPS.freeProviderCompose;
  return '';
}

function renderComposeArea(board, entry, viewer) {
  if (!entry || entry.status !== 'ready') return '';
  if (viewer.boardRole === 'guest' && !isStudentTips(board)) return '';
  if (entry.canCompose) {
    return `<div class="info-board__compose"><a href="#${esc(board.path)}/new" class="btn btn--primary btn--sm">${esc(COPY.composeCta)}</a></div>`;
  }
  const notice = composeBlockedNotice(board, viewer);
  return notice ? `<p class="info-board__notice">${esc(notice)}</p>` : '';
}

function renderList(board, entry, viewer) {
  const current = entry?.category || '';
  let body;
  if (!entry) {
    body = renderLoading(`data-info-list-load="${esc(board.boardKey)}"`);
  } else if (entry.status === 'failed') {
    body = renderStateCard({ title: COPY.loadFailed, cta: COPY.retry, ctaAction: 'info-retry' });
  } else if (!entry.posts.length) {
    body = renderStateCard({ title: COPY.empty });
  } else {
    const rows = entry.posts
      .map(
        (p) => `<li>
          <a class="info-board__row" href="#${esc(board.path)}/${esc(p.id)}">
            <strong class="info-board__row-title">${esc(p.title)}</strong>
            <span class="info-board__meta">${renderMeta(board, p, entry.access)}</span>
          </a>
        </li>`,
      )
      .join('');
    const more = entry.hasMore
      ? `<div class="info-board__more">
          <button type="button" class="btn btn--secondary btn--sm" data-info-more>${esc(COPY.more)}</button>
          <p class="info-board__more-error" data-info-more-error role="alert" hidden>${esc(COPY.loadFailed)}</p>
        </div>`
      : '';
    body = `<ul class="info-board__list">${rows}</ul>${more}`;
  }
  return `${renderComposeArea(board, entry, viewer)}${renderTabs(board, current)}${body}`;
}

/* ── 상세 ── */

function renderDetail(board, route, viewer) {
  const entry = getInfoPost(viewer, board.boardKey, route.postKey);
  if (!entry) return renderLoading(`data-info-post-load="${esc(route.postKey)}"`);
  if (entry.status === 'not_found') {
    return `${renderBack(board)}${renderStateCard({ title: COPY.notFound })}`;
  }
  if (entry.status !== 'ready' || !entry.post) {
    return `${renderBack(board)}${renderStateCard({ title: COPY.loadFailed, cta: COPY.retry, ctaAction: 'info-post-retry' })}`;
  }
  const post = entry.post;
  const head = `
      <h2 class="info-board__title">${esc(post.title)}</h2>
      <p class="info-board__meta">${renderMeta(board, post, entry.access)}</p>`;
  if (entry.access !== 'full') {
    return `
      ${renderBack(board)}
      <article class="info-board__article">
        ${head}
        ${renderStateCard({ title: COPY.guestDetail, cta: COPY.loginCta, ctaHref: boardLoginHref('library') })}
        ${isStudentTips(board) ? `<p class="info-board__notice" data-info-cheer-login>${esc(TIPS.cheerLogin)}</p>` : ''}
      </article>`;
  }
  const actions = [
    post.canEdit ? `<a href="#${esc(board.path)}/${esc(post.id)}/edit" class="btn btn--secondary btn--sm">${esc(COPY.edit)}</a>` : '',
    post.canDelete ? `<button type="button" class="btn btn--ghost btn--sm" data-info-delete="${esc(post.id)}">${esc(COPY.delete)}</button>` : '',
  ].join('');
  return `
    ${renderBack(board)}
    <article class="info-board__article">
      ${head}
      <div class="info-board__body">${esc(post.body)}</div>
      ${isStudentTips(board) ? renderCheer(post) : ''}
      ${actions ? `<div class="info-board__actions">${actions}</div><div class="concern-confirm-slot" data-info-confirm-slot></div>` : ''}
    </article>`;
}

/** info-student 응원(cheer) 하나. 누를 수 없는 계정은 수만 보인다. */
function renderCheer(post) {
  const count = Number.isFinite(post.cheerCount) ? post.cheerCount : 0;
  const label = `${TIPS.cheerEmoji} ${TIPS.cheer}`;
  const inner = `<span aria-hidden="true">${esc(TIPS.cheerEmoji)}</span> ${esc(TIPS.cheer)} <span class="info-board__cheer-count" data-info-cheer-count>${count}</span>`;
  const button = post.canCheer
    ? `<button type="button" class="btn btn--secondary btn--sm info-board__cheer${post.cheered ? ' is-active' : ''}" data-info-cheer="${esc(post.id)}" aria-pressed="${post.cheered === true}" aria-label="${esc(`${label} ${count}`)}">${inner}</button>`
    : `<span class="info-board__cheer is-readonly" aria-label="${esc(`${label} ${count}`)}">${inner}</span>`;
  return `
      <div class="info-board__reactions">
        ${button}
        <p class="info-board__more-error" data-info-cheer-error role="alert" hidden>${esc(TIPS.cheerFailed)}</p>
      </div>`;
}

/* ── 글쓰기 · 수정 (연락처 차단은 서버가 422 로 판정하고, 실패하면 폼을 다시 그리지 않아 입력이 남는다) ── */

function renderForm(board, post) {
  const isEdit = Boolean(post);
  const options = board.categories
    .map((c) => `<option value="${esc(c.key)}"${post?.categoryId === c.key ? ' selected' : ''}>${esc(c.label)}</option>`)
    .join('');
  const cancelHref = isEdit ? `${board.path}/${post.id}` : board.path;
  return `
    <section class="concern-compose">
      ${renderBack(board)}
      <h2 class="info-board__title">${esc(isEdit ? COPY.editTitle : COPY.newTitle)}</h2>
      <form class="concern-compose-form" data-info-form="${esc(board.boardKey)}" data-info-post-key="${esc(post?.id || '')}">
        <label class="concern-field">
          <span>${esc(COPY.fieldCategory)}</span>
          <select name="category" required><option value="">${esc(COPY.fieldCategoryPlaceholder)}</option>${options}</select>
        </label>
        <label class="concern-field">
          <span>${esc(COPY.fieldTitle)}</span>
          <input name="title" maxlength="100" required placeholder="${esc(COPY.fieldTitlePlaceholder)}" value="${esc(post?.title || '')}" />
        </label>
        <label class="concern-field">
          <span>${esc(COPY.fieldBody)}</span>
          <textarea name="body" rows="12" maxlength="5000" required placeholder="${esc(isStudentTips(board) ? TIPS.fieldBodyPlaceholder : COPY.fieldBodyPlaceholder)}">${esc(post?.body || '')}</textarea>
        </label>
        <p class="info-board__notice" data-info-contact-notice>${esc(COPY.contactNotice)}</p>
        <div class="concern-compose__error" data-info-form-error role="alert" hidden></div>
        <div class="info-board__actions">
          <button type="submit" class="btn btn--primary">${esc(isEdit ? COPY.submitEdit : COPY.submitNew)}</button>
          <a href="#${esc(cancelHref)}" class="btn btn--ghost">${esc(COPY.cancel)}</a>
        </div>
      </form>
    </section>`;
}

function renderCompose(board, viewer) {
  if (viewer.boardRole === 'guest') {
    return `${renderBack(board)}${renderStateCard({ title: COPY.loginToWrite, cta: COPY.loginCta, ctaHref: boardLoginHref('library') })}`;
  }
  const entry = getInfoList(viewer, board.boardKey);
  if (!entry) return renderLoading(`data-info-list-load="${esc(board.boardKey)}"`);
  if (entry.status === 'failed') {
    return `${renderBack(board)}${renderStateCard({ title: COPY.loadFailed, cta: COPY.retry, ctaAction: 'info-retry' })}`;
  }
  if (!entry.canCompose) {
    const notice = composeBlockedNotice(board, viewer) || COPY.blocked;
    return `${renderBack(board)}<p class="info-board__notice">${esc(notice)}</p>`;
  }
  return renderForm(board, null);
}

function renderEdit(board, route, viewer) {
  if (viewer.boardRole === 'guest') {
    return `${renderBack(board)}${renderStateCard({ title: COPY.loginToWrite, cta: COPY.loginCta, ctaHref: boardLoginHref('library') })}`;
  }
  const entry = getInfoPost(viewer, board.boardKey, route.postKey);
  if (!entry) return renderLoading(`data-info-post-load="${esc(route.postKey)}"`);
  if (entry.status === 'not_found') return `${renderBack(board)}${renderStateCard({ title: COPY.notFound })}`;
  if (entry.status !== 'ready' || !entry.post) {
    return `${renderBack(board)}${renderStateCard({ title: COPY.loadFailed, cta: COPY.retry, ctaAction: 'info-post-retry' })}`;
  }
  if (entry.access !== 'full' || !entry.post.canEdit) {
    return `${renderBack(board)}${renderStateCard({ title: COPY.editNotAllowed })}`;
  }
  return renderForm(board, entry.post);
}

/* ── 메인 렌더 ── */

/**
 * @param {string} path
 * @param {{ boardRole: string, ownerKey: string }} [viewer]
 */
export function renderInfoBoardScreen(path, viewer = currentInfoViewer()) {
  const route = parseInfoBoardPath(path);
  if (!route) return '';
  if (infoAccessFor(viewer, route.boardKey) === 'blocked') return renderBlocked();
  const board = boardOf(route.boardKey);
  if (!board) return renderBlocked();
  let inner;
  if (route.view === 'detail') inner = renderDetail(board, route, viewer);
  else if (route.view === 'new') inner = renderCompose(board, viewer);
  else if (route.view === 'edit') inner = renderEdit(board, route, viewer);
  else inner = renderList(board, getInfoList(viewer, board.boardKey), viewer);
  return renderFrame(board, path, inner);
}

/* ── 이벤트 ── */

const _pending = new Set();

/** 같은 요청이 여러 번 그려져도 한 번만 보낸다. */
function once(key, task, rerender) {
  if (_pending.has(key)) return;
  _pending.add(key);
  task()
    .catch(() => {})
    .finally(() => {
      _pending.delete(key);
      rerender();
    });
}

function goTo(path) {
  window.location.hash = `#${path}`;
}

/**
 * @param {HTMLElement} root
 * @param {() => void} rerender
 * @param {string} path
 */
export function bindInfoBoardEvents(root, rerender, path) {
  const route = parseInfoBoardPath(path);
  if (!route) return;
  const viewer = currentInfoViewer();
  if (infoAccessFor(viewer, route.boardKey) === 'blocked') return;
  const board = boardOf(route.boardKey);
  if (!board) return;
  const { boardKey } = board;

  if (root.querySelector('[data-info-list-load]')) {
    once(`${viewer.ownerKey}|list|${boardKey}`, () => loadInfoList(viewer, boardKey, ''), rerender);
  }
  if (root.querySelector('[data-info-post-load]')) {
    once(`${viewer.ownerKey}|post|${boardKey}|${route.postKey}`, () => loadInfoPost(viewer, boardKey, route.postKey), rerender);
  }

  root.querySelectorAll('[data-action="info-retry"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const category = getInfoList(viewer, boardKey)?.category || '';
      once(`${viewer.ownerKey}|list|${boardKey}`, () => loadInfoList(viewer, boardKey, category), rerender);
    });
  });
  root.querySelectorAll('[data-action="info-post-retry"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      once(`${viewer.ownerKey}|post|${boardKey}|${route.postKey}`, () => loadInfoPost(viewer, boardKey, route.postKey), rerender);
    });
  });

  root.querySelectorAll('[data-info-cat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const category = btn.getAttribute('data-info-cat') || '';
      if ((getInfoList(viewer, boardKey)?.category || '') === category) return;
      root.querySelectorAll('[data-info-cat]').forEach((b) => b.setAttribute('disabled', ''));
      once(`${viewer.ownerKey}|list|${boardKey}`, () => loadInfoList(viewer, boardKey, category), rerender);
    });
  });

  root.querySelector('[data-info-more]')?.addEventListener('click', async (e) => {
    const btn = /** @type {HTMLButtonElement} */ (e.currentTarget);
    const errorEl = root.querySelector('[data-info-more-error]');
    btn.disabled = true;
    btn.textContent = COPY.moreLoading;
    if (errorEl) errorEl.hidden = true;
    try {
      await loadMoreInfoList(viewer, boardKey);
      rerender();
    } catch {
      btn.disabled = false;
      btn.textContent = COPY.more;
      if (errorEl) errorEl.hidden = false;
    }
  });

  const cheerBtn = /** @type {HTMLButtonElement|null} */ (root.querySelector('[data-info-cheer]'));
  cheerBtn?.addEventListener('click', async () => {
    const errorEl = root.querySelector('[data-info-cheer-error]');
    cheerBtn.disabled = true;
    if (errorEl) errorEl.hidden = true;
    try {
      await toggleInfoCheer(viewer, boardKey, cheerBtn.getAttribute('data-info-cheer') || route.postKey);
      rerender();
    } catch {
      cheerBtn.disabled = false;
      if (errorEl) errorEl.hidden = false;
    }
  });

  root.querySelector('[data-info-flash-close]')?.addEventListener('click', () => {
    _flash = null;
    rerender();
  });

  const form = /** @type {HTMLFormElement|null} */ (root.querySelector('form[data-info-form]'));
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const postKey = form.getAttribute('data-info-post-key') || '';
    const submit = /** @type {HTMLButtonElement|null} */ (form.querySelector('button[type="submit"]'));
    const errorEl = form.querySelector('[data-info-form-error]');
    const label = submit?.textContent || '';
    if (submit) {
      submit.disabled = true;
      submit.textContent = COPY.saving;
    }
    if (errorEl) errorEl.hidden = true;
    try {
      const saved = await saveInfoPost(viewer, {
        boardKey,
        postKey: postKey || undefined,
        title: String(fd.get('title') || '').trim(),
        body: String(fd.get('body') || ''),
        category: String(fd.get('category') || ''),
      });
      const target = postKey ? `${board.path}/${saved.id}` : board.path;
      setFlash(target, 'success', postKey ? COPY.savedEdit : COPY.savedNew);
      goTo(target);
    } catch (err) {
      if (submit) {
        submit.disabled = false;
        submit.textContent = label;
      }
      if (errorEl) {
        errorEl.textContent = err instanceof Error && err.message && err.message !== 'board api error' ? err.message : COPY.saveFailed;
        errorEl.hidden = false;
      }
    }
  });

  const delBtn = root.querySelector('[data-info-delete]');
  delBtn?.addEventListener('click', () => {
    const slot = root.querySelector('[data-info-confirm-slot]');
    if (!slot) return;
    if (slot.innerHTML.trim()) {
      slot.innerHTML = '';
      return;
    }
    slot.innerHTML = `
      <div class="concern-confirm concern-confirm--danger" role="group" aria-label="${esc(COPY.deleteConfirmTitle)}">
        <p class="concern-confirm__title">${esc(COPY.deleteConfirmTitle)}</p>
        <p class="concern-confirm__body">${esc(COPY.deleteConfirmBody)}</p>
        <p class="concern-confirm__error" data-confirm-error hidden></p>
        <div class="concern-confirm__actions">
          <button type="button" class="btn btn--danger btn--sm" data-confirm-ok>${esc(COPY.delete)}</button>
          <button type="button" class="btn btn--ghost btn--sm" data-confirm-cancel>${esc(COPY.cancel)}</button>
        </div>
      </div>`;
    const okBtn = /** @type {HTMLButtonElement|null} */ (slot.querySelector('[data-confirm-ok]'));
    const errorEl = slot.querySelector('[data-confirm-error]');
    slot.querySelector('[data-confirm-cancel]')?.addEventListener('click', () => {
      slot.innerHTML = '';
    });
    okBtn?.addEventListener('click', async () => {
      okBtn.disabled = true;
      if (errorEl) errorEl.hidden = true;
      try {
        await deleteInfoPost(viewer, boardKey, delBtn.getAttribute('data-info-delete') || route.postKey);
        setFlash(board.path, 'success', COPY.deleted);
        goTo(board.path);
      } catch (err) {
        okBtn.disabled = false;
        if (errorEl) {
          errorEl.textContent = err instanceof Error && err.message && err.message !== 'board api error' ? err.message : COPY.deleteFailed;
          errorEl.hidden = false;
        }
      }
    });
  });
}
