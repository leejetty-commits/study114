import { getNavRole } from '../state.js';
import { renderEmptyStateCard } from '../empty-state-copy.js';
import { BOARD_TYPES, getBoardPolicy } from '../board-engine-copy.js';
import { LIBRARY_HEAD, LIBRARY_SECTIONS } from './library-copy.js';
import { getLibraryBoardMeta, libraryDownloadControlHtml, listLibraryItems } from './library-store.js';
import { getLibrarySection } from './library-router.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function boardTypeLabel(boardType) {
  return BOARD_TYPES[boardType]?.label || boardType || '자료';
}

function renderBoardPolicyChips(boardKey, navRole) {
  const meta = getLibraryBoardMeta(boardKey, navRole);
  if (!meta) return '';
  const chips = [
    `<span class="lib-chip lib-chip--type">${esc(boardTypeLabel(meta.policy.boardType))}</span>`,
    `<span class="lib-chip">열람 ${meta.canRead ? '가능' : '제한'}</span>`,
    `<span class="lib-chip">${meta.canDownload ? '다운로드 가능' : '파일 다운로드 미구현'}</span>`,
  ];
  if (meta.policy.requireReview) {
    chips.push('<span class="lib-chip lib-chip--muted">운영 검토 후 노출</span>');
  }
  return `<div class="lib-policy-chips" aria-label="자료 권한 안내">${chips.join('')}</div>`;
}

function formatAudience(audience) {
  const aud = Array.isArray(audience) ? audience : ['all'];
  if (aud.includes('all')) return '전체';
  return aud.join(' · ');
}

function renderCard(item, navRole) {
  const policy = getBoardPolicy(item.boardKey);
  const dlBtn = libraryDownloadControlHtml();

  return `
    <article class="lib-card" data-lib-id="${esc(item.id)}">
      <div class="lib-card__head">
        <div class="lib-card__format">${esc(item.format || 'FILE')}</div>
        ${policy ? `<span class="lib-card__type">${esc(boardTypeLabel(policy.boardType))}</span>` : ''}
      </div>
      <h3 class="lib-card__title">${esc(item.title)}</h3>
      <p class="lib-card__summary">${esc(item.summary)}</p>
      <p class="lib-card__meta">${esc(formatAudience(item.audience))}</p>
      <p class="lib-card__meta">표시 이름: ${esc(item.fileLabel || '파일')} · 실제 파일 없음</p>
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
    <section class="sup-panel-card">
      <header class="sup-panel-card__head">
        <div>
          <h2 class="sup-panel-card__title">${esc(meta.label)}</h2>
          <p class="sup-panel-card__lead">${esc(LIBRARY_HEAD.lead)}</p>
          ${renderBoardPolicyChips(meta.boardKey, navRole)}
        </div>
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
}
