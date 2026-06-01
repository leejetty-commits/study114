import { AUTH_UI_BASE } from './data.js';
import {
  STUDY_ROOM_COMPARE_ROWS,
  TUTOR_COMPARE_ROWS,
  COMPARE_MAX,
} from './exposure-schema.js';
import { EXPOSURE_STUDY_ROOMS, EXPOSURE_TUTORS } from './exposure-data.js';
import { resolveDisplayValue } from './exposure-format.js';

const LOGIN_URL = `${AUTH_UI_BASE}/#/login`;

/**
 * @param {boolean} isLoggedIn
 * @param {'study_room' | 'tutor'} kind
 */
export function promptCompareLogin(isLoggedIn, kind) {
  if (isLoggedIn) return true;
  alert(
    `[11장] 비교검색은 로그인 후에만 이용할 수 있습니다.\n\n` +
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

  return `
    ${warn}
    <div class="compare-table-wrap">
      <table class="compare-table">
        <thead>
          <tr>
            <th scope="col">항목</th>
            ${cols.map((c, i) => `<th scope="col">선택 ${i + 1}</th>`).join('')}
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
    <p class="compare-modal__note">표 형태 고정 · 카드형 비교 UI 사용 안 함 · 프리뷰 더미 3건</p>
  `;
}

function getSampleItems(kind) {
  const pool = kind === 'study_room' ? EXPOSURE_STUDY_ROOMS : EXPOSURE_TUTORS;
  return pool.filter((p) => p.compare_eligible !== false).slice(0, COMPARE_MAX);
}

/**
 * @param {'study_room' | 'tutor'} kind
 */
export function openCompareModal(kind) {
  const existing = document.getElementById('compare-modal-root');
  if (existing) existing.remove();

  const items = getSampleItems(kind);
  const rows = kind === 'study_room' ? STUDY_ROOM_COMPARE_ROWS : TUTOR_COMPARE_ROWS;
  const title = kind === 'study_room' ? '공부방 비교검색' : '과외쌤 비교검색';
  const sub =
    kind === 'tutor'
      ? '8장 설계 필드 · 실DB 미생성 · 경량 비교'
      : '5장 실DB 필드 기준 · 최대 3개';

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
        ${renderCompareTable(items, rows)}
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
  root.querySelectorAll('[data-action="compare-open"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const kind = btn.dataset.compareKind || 'study_room';
      if (!promptCompareLogin(isLoggedIn, kind)) {
        const go = confirm('로그인 화면으로 이동할까요?');
        if (go) window.open(`${LOGIN_URL}?from=compare&kind=${kind}`, '_blank', 'noopener');
        return;
      }
      openCompareModal(kind);
    });
  });
}
