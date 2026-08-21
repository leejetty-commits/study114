import { renderEmptyStateCard } from './empty-state-copy.js';
import {
  STUDY_ROOM_COMPARE_ROWS,
  TUTOR_COMPARE_ROWS,
  COMPARE_MAX,
} from './exposure-schema.js';
import { resolveDisplayValue } from './exposure-format.js';
import { resolveCardVisualLayers, renderPromoBadgeRow, renderTrustBadgeRow } from './card-visual.js';
import { isLoggedIn } from './auth-session.js';
import { openDeepAccessLoginGate } from '../../shared/guest-gate-ui.js';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {boolean} isLoggedIn
 * @param {'study_room' | 'tutor'} kind
 */
export function promptCompareLogin(loggedIn, kind) {
  if (loggedIn) return true;
  openDeepAccessLoginGate({
    source: 'compare',
    providerType: kind === 'tutor' ? 'tutor' : 'study_room',
  });
  return false;
}

/**
 * 비교 상단 정책축 — card-visual SSOT 재사용
 * 1행: 유료/자동/신뢰 · 2행: 추천·후기 통계
 * @param {'study_room'|'tutor'} kind
 * @param {object[]} cols
 */
function renderComparePolicyAxis(kind, cols) {
  const nameCells = cols
    .map((c) => {
      const name = c.study_room_name || c.tutor_display_name || '—';
      return `<th scope="col" class="compare-policy__name">${esc(name)}</th>`;
    })
    .join('');

  const layerCells = cols
    .map((item) => {
      const layers = resolveCardVisualLayers(kind, item);
      const trustShort = layers.trustBadges.slice(0, 2);
      const promo = renderPromoBadgeRow(layers.promoBadges, esc);
      const trust = renderTrustBadgeRow(trustShort, esc);
      const empty =
        !promo && !trust
          ? '<span class="compare-policy__empty">—</span>'
          : '';
      return `<td class="compare-policy__layers">${promo}${trust}${empty}</td>`;
    })
    .join('');

  const statCells = cols
    .map((item) => {
      const layers = resolveCardVisualLayers(kind, item);
      const bits = [`추천 ${layers.stats.recommend}`];
      if (layers.stats.showReview) bits.push(`후기 ${layers.stats.review}`);
      return `<td class="compare-policy__stats">${esc(bits.join(' · '))}</td>`;
    })
    .join('');

  return `
    <div class="compare-policy-axis" aria-label="카드 정책 비교축">
      <table class="compare-policy-table">
        <thead>
          <tr>
            <th scope="col" class="compare-policy__row-label">대상</th>
            ${nameCells}
          </tr>
        </thead>
        <tbody>
          <tr class="compare-policy__row--layers">
            <th scope="row">유료·New·신뢰</th>
            ${layerCells}
          </tr>
          <tr class="compare-policy__row--stats">
            <th scope="row">추천·후기</th>
            ${statCells}
          </tr>
        </tbody>
      </table>
      <p class="compare-policy__note">모바일·좁은 폭: 신뢰는 최대 2개 · 액션 레일은 비교표에 복제하지 않음</p>
    </div>`;
}

/**
 * @param {Array<object>} items
 * @param {Array<{key:string,label:string}>} rows
 * @param {'study_room'|'tutor'} kind
 */
function renderCompareTable(items, rows, kind) {
  const cols = items.slice(0, COMPARE_MAX);
  const ineligible = cols.filter((c) => c.compare_eligible === false);
  const warn =
    ineligible.length > 0
      ? `<p class="compare-modal__warn">[11장] 비교 필수 항목 미충족 항목 ${ineligible.length}건 — 실서비스에서는 표에서 제외 또는 안내</p>`
      : '';

  const colHeaders = cols.map((c, i) => {
    const name =
      c.study_room_name || c.tutor_display_name || `선택 ${i + 1}`;
    return `<th scope="col">${esc(name)}</th>`;
  });

  return `
    ${warn}
    ${renderComparePolicyAxis(kind, cols)}
    <div class="compare-table-wrap">
      <table class="compare-table">
        <thead>
          <tr>
            <th scope="col">항목</th>
            ${colHeaders.join('')}
          </tr>
        </thead>
        <tbody>
          ${rows
            .map((row) => {
              const cells = cols
                .map((item) => {
                  const val = resolveDisplayValue(item, row.key);
                  return `<td>${val != null && val !== '' ? esc(val) : '—'}</td>`;
                })
                .join('');
              return `<tr><th scope="row">${esc(row.label)}</th>${cells}</tr>`;
            })
            .join('')}
        </tbody>
      </table>
    </div>
    <p class="compare-modal__note">6장 · 사용자가 ⇄로 선택한 ${cols.length}건 · 상단=카드 정책축 · 하단=상세 비교표</p>
  `;
}

function renderCompareEmpty(kind) {
  const exploreHref = kind === 'study_room' ? '#/parent' : '#/parent';
  return renderEmptyStateCard('compare', {
    ctaHref: exploreHref,
    links: [{ label: '탐색하기', href: exploreHref }],
  });
}

/**
 * @param {'study_room' | 'tutor'} kind
 * @param {Array<object>} [items]
 */
export function openCompareModal(kind, items = []) {
  if (!isLoggedIn()) {
    openDeepAccessLoginGate({ source: 'compare', providerType: kind === 'tutor' ? 'tutor' : 'study_room' });
    return;
  }
  if (!items.length) {
    alert(`비교할 항목을 ⇄ 버튼으로 선택하세요 (최대 ${COMPARE_MAX}개).`);
    return;
  }

  const existing = document.getElementById('compare-modal-root');
  if (existing) existing.remove();

  const rows = kind === 'study_room' ? STUDY_ROOM_COMPARE_ROWS : TUTOR_COMPARE_ROWS;
  const title = kind === 'study_room' ? '공부방 비교검색' : '과외쌤 비교검색';
  const sub =
    kind === 'tutor'
      ? '상단 정책축(유료·신뢰·통계) + 경량 비교표 · 최대 3개'
      : '상단 정책축(유료·신뢰·통계) + 비교표 · 최대 3개';

  const root = document.createElement('div');
  root.id = 'compare-modal-root';
  root.className = 'compare-modal-root';
  root.innerHTML = `
    <div class="compare-modal__backdrop" data-action="compare-close"></div>
    <div class="compare-modal" role="dialog" aria-modal="true" aria-labelledby="compare-modal-title">
      <header class="compare-modal__header">
        <div>
          <h2 id="compare-modal-title" class="compare-modal__title">${title}</h2>
          <p class="compare-modal__sub">${sub}</p>
        </div>
        <button type="button" class="compare-modal__close" data-action="compare-close" aria-label="닫기">×</button>
      </header>
      <div class="compare-modal__body">
        ${items.length ? renderCompareTable(items, rows, kind) : renderCompareEmpty(kind)}
      </div>
      <footer class="compare-modal__footer">
        <button type="button" class="btn btn--secondary btn--sm" data-action="compare-close">닫기</button>
      </footer>
    </div>
  `;

  document.body.appendChild(root);
  document.body.style.overflow = 'hidden';

  root.querySelectorAll('[data-action="compare-close"]').forEach((el) => {
    el.addEventListener('click', closeCompareModal);
  });

  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCompareModal();
  });
}

export function closeCompareModal() {
  const root = document.getElementById('compare-modal-root');
  if (root) root.remove();
  document.body.style.overflow = '';
}

/**
 * @param {HTMLElement} root
 * @param {boolean} isLoggedIn
 */
export function bindCompareEvents(root, isLoggedIn) {
  root.querySelectorAll('[data-action="compare-guest-blocked"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const kind = btn.dataset.compareKind || 'study_room';
      if (!promptCompareLogin(isLoggedIn, kind)) {
        return;
      }
    });
  });
}
