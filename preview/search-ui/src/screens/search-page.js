import { PAID_GATE_MESSAGE } from '@home-visibility';
import { collectFiltersFromForm, searchApi } from '../search-api.js';
import { OPTION_LABELS } from '../search-enums.js';
import { MOCK_REGIONS, MOCK_SUBJECTS, SEARCH_TABS } from '../search-schema.js';
import {
  canShowStudentTab,
  getCurrentTab,
  navigateTab,
  previewState,
  VIEWER_ROLE_LABELS,
} from '../state.js';
import { bindGlobalEvents, renderSearchShell } from '../layout.js';

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function renderOptions(optionsKey, emptyLabel = '선택') {
  const labels = OPTION_LABELS[optionsKey] || {};
  const opts = Object.entries(labels)
    .map(([value, label]) => `<option value="${esc(value)}">${esc(label)}</option>`)
    .join('');
  return `<option value="">${esc(emptyLabel)}</option>${opts}`;
}

function renderChips(optionsKey, name) {
  const labels = OPTION_LABELS[optionsKey] || {};
  return Object.entries(labels)
    .map(
      ([value, label]) => `
        <label class="search-chip">
          <input type="checkbox" name="${esc(name)}" value="${esc(value)}" />
          <span>${esc(label)}</span>
        </label>`,
    )
    .join('');
}

/** @param {import('../search-schema.js').SEARCH_TABS.room.fields[0]} field */
function renderField(field) {
  if (field.groupOnly && previewState.studentLessonFormat !== 'group') {
    return '';
  }

  const dbHint = `<span class="search-field__db" title="DB">${esc(field.db)}</span>`;
  const name = `f_${field.key}`;

  if (field.input === 'select') {
    const selected =
      field.key === 'lesson_format' && field.optionsKey === 'lesson_format'
        ? previewState.studentLessonFormat
        : '';
    const opts = Object.entries(OPTION_LABELS[field.optionsKey] || {})
      .map(
        ([value, label]) =>
          `<option value="${esc(value)}" ${selected === value ? 'selected' : ''}>${esc(label)}</option>`,
      )
      .join('');
    return `
      <label class="search-field">
        <span class="search-field__label">${esc(field.label)} ${dbHint}</span>
        <select class="search-field__control" name="${esc(name)}" ${field.key === 'lesson_format' ? 'data-lesson-format-select' : ''}>
          <option value="">선택</option>${opts}
        </select>
      </label>`;
  }

  if (field.input === 'chips') {
    return `
      <fieldset class="search-field search-field--chips">
        <legend class="search-field__label">${esc(field.label)} ${dbHint}</legend>
        <div class="search-chip-group">${renderChips(field.optionsKey, name)}</div>
      </fieldset>`;
  }

  if (field.input === 'toggle') {
    return `
      <label class="search-field search-field--toggle">
        <span class="search-field__label">${esc(field.label)} ${dbHint}</span>
        <input type="checkbox" class="search-field__toggle" name="${esc(name)}" />
      </label>`;
  }

  if (field.input === 'range') {
    return `
      <div class="search-field search-field--range">
        <span class="search-field__label">${esc(field.label)} ${dbHint}</span>
        <div class="search-range">
          <input type="number" class="search-field__control" name="${esc(name)}_min" placeholder="최소(원)" min="0" step="10000" />
          <span class="search-range__sep">~</span>
          <input type="number" class="search-field__control" name="${esc(name)}_max" placeholder="최대(원)" min="0" step="10000" />
        </div>
      </div>`;
  }

  if (field.input === 'subject') {
    return `
      <label class="search-field">
        <span class="search-field__label">${esc(field.label)} ${dbHint}</span>
        <select class="search-field__control" name="${esc(name)}">
          <option value="">과목 선택</option>
          ${MOCK_SUBJECTS.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join('')}
        </select>
      </label>`;
  }

  const placeholders = {
    region: '동/행정동 · 단지',
    complex: '단지명',
    city: '시/구',
    text: '입력',
  };

  return `
    <label class="search-field">
      <span class="search-field__label">${esc(field.label)} ${dbHint}</span>
      <input type="text" class="search-field__control" name="${esc(name)}" placeholder="${esc(placeholders[field.input] || '')}" />
    </label>`;
}

function renderBasicRows(fields) {
  const row1 = fields.filter((f) => f.basicRow === 1);
  const row2 = fields.filter((f) => f.basicRow === 2);
  return `
    <p class="search-row-label">1줄 · 핵심</p>
    <div class="search-grid">${row1.map((f) => renderField(f)).join('')}</div>
    ${
      row2.length
        ? `<p class="search-row-label">2줄 · 보조</p><div class="search-grid">${row2.map((f) => renderField(f)).join('')}</div>`
        : ''
    }`;
}

function renderTabButtons(activeTab) {
  return Object.entries(SEARCH_TABS)
    .map(([id, meta]) => {
      const hidden = id === 'student' && !canShowStudentTab(previewState.role);
      const cls = ['search-tab', id === activeTab ? 'is-active' : '', hidden ? 'is-hidden' : '']
        .filter(Boolean)
        .join(' ');
      return `<button type="button" class="${cls}" data-tab="${id}" ${hidden ? 'hidden' : ''}>${esc(meta.label)}</button>`;
    })
    .join('');
}

function renderStudentGate() {
  if (canShowStudentTab(previewState.role)) return '';
  return `
    <div class="search-gate" role="note">
      <strong>13장 §10-5</strong> — 학부모 역할에서는 <em>학생찾기</em> 탭을 노출하지 않습니다.
    </div>`;
}

function renderSubscriptionNote(tab) {
  if (tab !== 'student') return '';
  const msg =
    previewState.subscription === 'paid'
      ? '유료 공급자 — 요청문/특이요청은 학생이 paid_only일 때 상세에서만 열람'
      : `무료 공급자 — 메모 접근 시 ${PAID_GATE_MESSAGE}`;
  return `<p class="search-note">${esc(msg)}</p>`;
}

function renderPreviewControls() {
  return `
    <div class="search-preview-controls">
      <label>
        <span>열람 역할</span>
        <select data-preview="role">
          ${Object.entries(VIEWER_ROLE_LABELS)
            .map(
              ([value, label]) =>
                `<option value="${value}" ${previewState.role === value ? 'selected' : ''}>${esc(label)}</option>`,
            )
            .join('')}
        </select>
      </label>
      <label>
        <span>공급자 등록</span>
        <select data-preview="subscription">
          <option value="free" ${previewState.subscription === 'free' ? 'selected' : ''}>무료</option>
          <option value="paid" ${previewState.subscription === 'paid' ? 'selected' : ''}>유료</option>
        </select>
      </label>
    </div>`;
}

function renderFilterBar(tab) {
  if (!previewState.searchExecuted) return '';
  const meta = SEARCH_TABS[tab];
  const region = MOCK_REGIONS[tab === 'room' ? 'room' : tab === 'tutor' ? 'tutor' : 'student'];
  const countLabel = previewState.searchLoading
    ? '검색 중…'
    : `${previewState.searchTotal}건`;
  return `
    <div class="search-filter-bar" aria-live="polite">
      <span class="search-filter-bar__chip">${esc(meta.label)}</span>
      <span class="search-filter-bar__chip">${esc(region)}</span>
      <span class="search-filter-bar__count">${esc(countLabel)}</span>
      <button type="button" class="search-filter-bar__reset btn btn--secondary btn--sm" data-action="reset-filters">기본값으로 초기화</button>
    </div>`;
}

function renderResultSection(tab) {
  const meta = SEARCH_TABS[tab];

  if (!previewState.searchExecuted) {
    return `
      <section class="search-results search-results--home-ref">
        <h2 class="search-section__title">하단 참고 (검색 전)</h2>
        <p class="search-results__hint">§8-2-1 — 검색 실행 전에는 홈 Prime/Pick 참고형 노출 가능. <strong>검색 실행 후 전용 결과로 교체</strong>.</p>
      </section>`;
  }

  if (previewState.searchError) {
    return `
      <section class="search-results search-results--executed">
        <h2 class="search-section__title">검색 결과</h2>
        <p class="search-results__hint search-results__hint--error">${esc(previewState.searchError)}</p>
      </section>`;
  }

  const rows = previewState.searchRows;

  const mapNote = meta.mapEnabled
    ? '<p class="search-results__hint">§8-2-2 — 공부방: 리스트와 지도 핀이 동일 필터 결과를 공유합니다.</p>'
    : tab === 'student'
      ? '<p class="search-results__hint">§8-2-2 — 학생찾기: 지도 핀 비사용 · 블라인드 리스트 · 비교검색 없음</p>'
      : '<p class="search-results__hint">§8-2-2 — 과외쌤: 조건형 리스트 중심 (지도 비사용)</p>';

  const emptyNote =
    rows.length === 0 && !previewState.searchLoading
      ? '<p class="search-results__hint">조건에 맞는 결과가 없습니다.</p>'
      : '';

  return `
    <section class="search-results search-results--executed">
      <h2 class="search-section__title">검색 결과</h2>
      ${mapNote}
      ${emptyNote}
      <ul class="search-result-rows">
        ${rows
          .map(
            (r) => `
          <li class="search-result-row">
            <div class="search-result-row__col search-result-row__col--left">${esc(r.left).replace(/\n/g, '<br>')}</div>
            <div class="search-result-row__col search-result-row__col--center">${esc(r.center).replace(/\n/g, '<br>')}</div>
            <div class="search-result-row__col search-result-row__col--right">${esc(r.right).replace(/\n/g, '<br>')}</div>
          </li>`,
          )
          .join('')}
      </ul>
    </section>`;
}

function renderSearchForm(tab) {
  const meta = SEARCH_TABS[tab];
  const regionKey = tab === 'room' ? 'room' : tab === 'tutor' ? 'tutor' : 'student';
  const basicFields = meta.fields.filter((f) => f.tier === 'basic');
  const expandedFields = meta.fields.filter((f) => f.tier === 'expanded');

  return `
    ${renderStudentGate()}
    ${renderPreviewControls()}
    <header class="search-header">
      <h1 class="auth-heading">통합 검색</h1>
      <p class="auth-subheading">13장 §8-1 — 기본검색 1·2줄 + 확장검색</p>
    </header>
    <nav class="search-tabs" aria-label="검색 탭">${renderTabButtons(tab)}</nav>
    <div class="search-region-auto">
      <span class="search-region-auto__badge">자동</span>
      <span>${esc(meta.defaultRegionHint)}</span>
      <strong>${esc(MOCK_REGIONS[regionKey])}</strong>
      <button type="button" class="btn btn--secondary btn--sm" data-action="change-region">지역 변경 · 광역</button>
    </div>
    ${renderSubscriptionNote(tab)}
    ${renderFilterBar(tab)}
    <form class="search-form" data-search-form>
      <section class="search-section">
        <h2 class="search-section__title">기본검색</h2>
        ${renderBasicRows(basicFields)}
      </section>
      <div class="search-expand">
        <button type="button" class="search-expand__toggle" data-action="toggle-expanded" aria-expanded="${previewState.expanded}">
          ${previewState.expanded ? '확장검색 접기' : '확장검색 열기 (§8-2 · 기본 접힘)'}
        </button>
      </div>
      ${
        previewState.expanded
          ? `
      <section class="search-section search-section--expanded">
        <h2 class="search-section__title">확장검색</h2>
        <div class="search-grid">${expandedFields.map((f) => renderField(f)).join('')}</div>
        <div class="search-actions search-actions--inline">
          <button type="button" class="btn btn--secondary btn--sm" data-action="apply-expanded">적용</button>
        </div>
      </section>`
          : ''
      }
      <div class="search-actions">
        <button type="reset" class="btn btn--secondary">초기화</button>
        <button type="submit" class="btn btn--primary">검색</button>
      </div>
    </form>
    ${renderResultSection(tab)}`;
}

export function renderSearchPage() {
  const tab = getCurrentTab();
  if (tab === 'student' && !canShowStudentTab(previewState.role)) {
    navigateTab('room');
  }
  return renderSearchShell(renderSearchForm(getCurrentTab()));
}

export function bindSearchPageEvents(root, rerender) {
  bindGlobalEvents(root);

  root.querySelectorAll('[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      previewState.searchExecuted = false;
      previewState.searchRows = [];
      previewState.searchTotal = 0;
      previewState.searchError = null;
      navigateTab(/** @type {import('../state.js').SearchTab} */ (btn.dataset.tab));
    });
  });

  const roleSelect = root.querySelector('[data-preview="role"]');
  if (roleSelect) {
    roleSelect.addEventListener('change', () => {
      previewState.role = /** @type {import('../state.js').ViewerRole} */ (roleSelect.value);
      previewState.searchExecuted = false;
      if (!canShowStudentTab(previewState.role) && getCurrentTab() === 'student') {
        navigateTab('room');
        return;
      }
      rerender();
    });
  }

  const subSelect = root.querySelector('[data-preview="subscription"]');
  if (subSelect) {
    subSelect.addEventListener('change', () => {
      previewState.subscription = /** @type {import('../state.js').ProviderSubscription} */ (subSelect.value);
      rerender();
    });
  }

  const expandBtn = root.querySelector('[data-action="toggle-expanded"]');
  if (expandBtn) {
    expandBtn.addEventListener('click', () => {
      previewState.expanded = !previewState.expanded;
      rerender();
    });
  }

  const lessonFormatSelect = root.querySelector('[data-lesson-format-select]');
  if (lessonFormatSelect) {
    lessonFormatSelect.addEventListener('change', () => {
      previewState.studentLessonFormat = lessonFormatSelect.value || 'one_on_one';
      rerender();
    });
  }

  root.querySelector('[data-action="reset-filters"]')?.addEventListener('click', () => {
    previewState.searchExecuted = false;
    previewState.expanded = false;
    previewState.searchRows = [];
    previewState.searchTotal = 0;
    previewState.searchError = null;
    rerender();
  });

  root.querySelector('[data-action="apply-expanded"]')?.addEventListener('click', () => {
    const form = root.querySelector('[data-search-form]');
    if (form instanceof HTMLFormElement) {
      runSearch(form, rerender);
    }
  });

  const regionBtn = root.querySelector('[data-action="change-region"]');
  if (regionBtn) {
    regionBtn.addEventListener('click', () => {
      window.alert('§8-3 광역 검색 — 인근 동 → 구군 → 시/도 단계 확장 (추후 UI)');
    });
  }

  const form = root.querySelector('[data-search-form]');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      runSearch(form, rerender);
    });
    form.addEventListener('reset', () => {
      previewState.searchExecuted = false;
      previewState.searchLoading = false;
      previewState.searchError = null;
      previewState.searchRows = [];
      previewState.searchTotal = 0;
      previewState.studentLessonFormat = 'one_on_one';
      setTimeout(rerender, 0);
    });
  }
}

/** @param {HTMLFormElement} form @param {() => void} rerender */
async function runSearch(form, rerender) {
  const tab = getCurrentTab();
  previewState.searchExecuted = true;
  previewState.searchLoading = true;
  previewState.searchError = null;
  rerender();

  try {
    const filters = collectFiltersFromForm(form, tab);
    const result = await searchApi(tab, filters);
    previewState.searchRows = result.rows || [];
    previewState.searchTotal = result.total ?? 0;
  } catch (err) {
    previewState.searchRows = [];
    previewState.searchTotal = 0;
    previewState.searchError = err instanceof Error ? err.message : '검색에 실패했습니다.';
  } finally {
    previewState.searchLoading = false;
    rerender();
  }
}
