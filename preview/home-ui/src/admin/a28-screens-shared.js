/**
 * Small shared A28 UI helpers — used by screens / labs / bind.
 * Rollback: git revert the a28 split commit(s).
 */
import { listSectionGroupSummary } from '../board-channel-store.js';
import { A28_COPY } from './a28-copy.js';

export function sectionOwnerLabel(id) {
  const labels = {
    support: '고객센터',
    library: '자료실',
    'policy-log': '정책 기록',
    'mypage-submission': '마이페이지 제출함',
    community: '커뮤니티',
    concern: '커뮤니티(레거시)',
    phase2: '추후 기능',
  };
  return labels[id] || listSectionGroupSummary().find((group) => group.id === id)?.label || '기타';
}

export function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

/** 쉬운 말로 운영 안내 (이정표·영문 코드는 코드 주석에만) */
export function renderOpsTip() {
  return `<div class="a28-ops-tip" role="note">
    <strong>${esc(A28_COPY.opsTipTitle)}</strong>
    <p>${esc(A28_COPY.opsTipBody)}</p>
  </div>`;
}

export function renderDetailDrawer(id, title, bodyHtml) {
  return `
    <aside class="admin-drawer" data-admin-drawer="${esc(id)}" hidden>
      <div class="admin-drawer__backdrop" data-admin-drawer-close></div>
      <div class="admin-drawer__panel" role="dialog" aria-label="${esc(title)}">
        <header class="admin-drawer__head">
          <strong>${esc(title)}</strong>
          <button type="button" class="btn btn--secondary btn--sm" data-admin-drawer-close>닫기</button>
        </header>
        <div class="admin-drawer__body">${bodyHtml}</div>
      </div>
    </aside>`;
}

export function bindDetailDrawer(root) {
  root.querySelectorAll('[data-admin-drawer-open]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-admin-drawer-open');
      const drawer = root.querySelector(`[data-admin-drawer="${id}"]`);
      if (drawer) drawer.hidden = false;
    });
  });
  root.querySelectorAll('[data-admin-drawer-close]').forEach((el) => {
    el.addEventListener('click', () => {
      const drawer = el.closest('[data-admin-drawer]');
      if (drawer) drawer.hidden = true;
    });
  });
}

/**
 * @param {string} title
 * @param {string} _screenId 개발 참고용 이정표 — 화면에 표시하지 않음
 * @param {string} bodyHtml
 * @param {{ lead?: string }} [opts]
 */
export function renderPanel(title, _screenId, bodyHtml, { lead = '' } = {}) {
  return `
    <section class="sup-panel-card sup-panel-card--admin a28-panel">
      <header class="sup-panel-card__head">
        <div>
          <h2 class="sup-panel-card__title">${esc(title)} <span class="sup-admin-badge a28-badge">${esc(A28_COPY.previewBadge)}</span></h2>
          ${lead ? `<p class="sup-panel-card__lead">${lead}</p>` : ''}
        </div>
      </header>
      <div class="sup-panel-card__body">${bodyHtml}</div>
    </section>`;
}

export function selected(actual, value) {
  return String(actual) === String(value) ? ' selected' : '';
}

export function checked(value) {
  return value ? ' checked' : '';
}

/** @param {Record<string, any>} policy */
export function cloneJoinPolicy(policy) {
  return JSON.parse(JSON.stringify(policy || {}));
}
