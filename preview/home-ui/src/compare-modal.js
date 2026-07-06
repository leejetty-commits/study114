import { AUTH_UI_BASE } from './data.js';
import { renderEmptyStateCard } from './empty-state-copy.js';
import {
  STUDY_ROOM_COMPARE_ROWS,
  TUTOR_COMPARE_ROWS,
  COMPARE_MAX,
} from './exposure-schema.js';
import { resolveDisplayValue } from './exposure-format.js';

const LOGIN_URL = `${AUTH_UI_BASE}/#/login`;

/**
 * @param {boolean} isLoggedIn
 * @param {'study_room' | 'tutor'} kind
 */
export function promptCompareLogin(isLoggedIn, kind) {
  if (isLoggedIn) return true;
  alert(
    `[6장] 비교검색은 로그인 후에만 이용할 수 있습니다.\n\n` +
      `${kind === 'study_room' ? '공부방' : '과외쌤'} 비교 — 최대 ${COMPARE_MAX}개 · 팝업 표 형태`,
  );
  return false;
}

/**
 * @param {Array<object>} items
 * @param {Array<{key:string,label:string}>} rows
 */
function renderCompareTable(items, rows) {
  const cols = items.slice(0, COMPARE_MAX);
  const ineligible = cols.filter((c) => c.compare_eligible === false);
  const warn =
    ineligible.length > 0
      ? `<p class="compare-modal__warn">[11장] 비교 필수 항목 미충족 항목 ${ineligible.length}건 — 실서비스에서는 표에서 제외 또는 안내</p>`
      : '';

  const colHeaders = cols.map((c, i) => {
    const name =
      c.study_room_name || c.tutor_display_name || `선택 ${i + 1}`;
    return `<th scope="col">${String(name).replace(/</g, '&lt;')}</th>`;
  });

  return `
    ${warn}
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
                  return `<td>${val != null && val !== '' ? String(val).replace(/</g, '&lt;') : '—'}</td>`;
                })
                .join('');
              return `<tr><th scope="row">${row.label}</th>${cells}</tr>`;
            })
            .join('')}
        </tbody>
      </table>
    </div>
    <p class="compare-modal__note">6장 · 사용자가 ⇄로 선택한 ${cols.length}건 · 표 형태 고정</p>
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
      ? '6장 · 경량 비교 · 최대 3개'
      : '6장 · 필수 비교 · 최대 3개';

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
        ${items.length ? renderCompareTable(items, rows) : renderCompareEmpty(kind)}
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
        const go = confirm('로그인 화면으로 이동할까요?');
        if (go) window.open(`${LOGIN_URL}?from=compare&kind=${kind}`, '_blank', 'noopener');
      }
    });
  });
}
