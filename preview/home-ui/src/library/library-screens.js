import { getNavRole } from '../state.js';
import { renderEmptyStateCard } from '../empty-state-copy.js';
import { BOARD_ENGINE_LOCK, BOARD_TYPES, getBoardPolicy } from '../board-engine-copy.js';
import { LIBRARY_HEAD, LIBRARY_SECTIONS } from './library-copy.js';
import { canDownloadFromBoard, getLibraryBoardMeta, listLibraryItems } from './library-store.js';
import { getLibrarySection } from './library-router.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function renderEngineBanner() {
  return `
    <div class="lib-engine-banner" role="note">
      <span class="lib-engine-banner__tag">${esc(BOARD_ENGINE_LOCK.topConcept)}</span>
      <p class="lib-engine-banner__text">${esc(BOARD_ENGINE_LOCK.libraryPosition)}</p>
    </div>`;
}

function renderBoardPolicyChips(boardKey, navRole) {
  const meta = getLibraryBoardMeta(boardKey, navRole);
  if (!meta) return '';
  const type = BOARD_TYPES[meta.policy.boardType];
  const chips = [
    `<span class="lib-chip lib-chip--type">${esc(type.label)}</span>`,
    `<span class="lib-chip">read: ${meta.canRead ? '✓' : '✕'}</span>`,
    `<span class="lib-chip">download: ${meta.canDownload ? '✓' : '로그인'}</span>`,
  ];
  if (meta.policy.requireReview) {
    chips.push('<span class="lib-chip lib-chip--muted">운영 검토 후 노출</span>');
  }
  return `<div class="lib-policy-chips" aria-label="boardKey 권한">${chips.join('')}</div>`;
}

function renderSectionNav(activeSection) {
  return `
    <nav class="lib-nav" aria-label="자료실 카테고리">
      ${LIBRARY_SECTIONS.map(
        (s) =>
          `<a href="#${s.path}" class="lib-nav__link${s.key === activeSection ? ' is-active' : ''}" data-lib-nav="${s.path}">${esc(s.label)}</a>`,
      ).join('')}
      <a href="#/support" class="lib-nav__link lib-nav__link--muted" data-lib-nav="/support">← 고객센터</a>
    </nav>`;
}

function renderCard(item, navRole) {
  const audience = item.audience.includes('all') ? '전체' : item.audience.join(' · ');
  const canDl = canDownloadFromBoard(item.boardKey, navRole);
  const policy = getBoardPolicy(item.boardKey);
  const dlBtn = canDl
    ? `<button type="button" class="btn btn--secondary btn--sm lib-card__dl" data-lib-download="${esc(item.id)}">다운로드 · ${esc(item.fileLabel)}</button>`
    : `<button type="button" class="btn btn--secondary btn--sm lib-card__dl" disabled title="로그인 후 다운로드">다운로드 · 로그인 필요</button>`;

  return `
    <article class="lib-card" data-lib-id="${esc(item.id)}">
      <div class="lib-card__head">
        <div class="lib-card__format">${esc(item.format)}</div>
        ${policy ? `<span class="lib-card__type">${esc(BOARD_TYPES[policy.boardType].label)}</span>` : ''}
      </div>
      <h3 class="lib-card__title">${esc(item.title)}</h3>
      <p class="lib-card__summary">${esc(item.summary)}</p>
      <p class="lib-card__meta"><code>${esc(item.boardKey)}</code> · ${esc(audience)}</p>
      ${dlBtn}
    </article>`;
}

/** @param {string} path */
export function renderLibraryScreen(path) {
  const section = getLibrarySection(path);
  const navRole = getNavRole();
  const items = listLibraryItems(section, navRole);
  const meta = LIBRARY_SECTIONS.find((s) => s.key === section) || LIBRARY_SECTIONS[0];

  const grid =
    items.length === 0
      ? renderEmptyStateCard('library', { cta: null })
      : `<div class="lib-grid">${items.map((item) => renderCard(item, navRole)).join('')}</div>`;

  return `
    ${renderEngineBanner()}
    ${renderSectionNav(section)}
    <section class="sup-panel-card">
      <header class="sup-panel-card__head">
        <div>
          <h2 class="sup-panel-card__title">${esc(meta.label)}</h2>
          <p class="sup-panel-card__lead">${esc(LIBRARY_HEAD.lead)}</p>
          ${renderBoardPolicyChips(meta.boardKey, navRole)}
        </div>
        <span class="sup-panel-card__id">${esc(meta.screenId)} · <code>${esc(meta.boardKey)}</code></span>
      </header>
      <div class="sup-panel-card__body">
        ${grid}
        <p class="lib-footnote">${esc(LIBRARY_HEAD.footnote)}</p>
      </div>
    </section>`;
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindLibraryScreenEvents(root, rerender) {
  root.querySelectorAll('[data-lib-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = el.getAttribute('data-lib-nav') || '/library';
    });
  });
  root.querySelectorAll('[data-lib-download]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-lib-download');
      window.alert(`[23장 프리뷰] 자료 다운로드 — ${id}\n실서비스: Board Engine + 스토리지 URL`);
    });
  });
}
