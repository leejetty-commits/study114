/**
 * 찾기결과·Basic 리스트 정렬 SSOT (1차)
 * — Prime/Pick 비적용 · 지역 필터 이후 · URL ?sort= 유지
 * — SKY 우선(과외쌤만): isSkyUniversityName(university_name)
 *   · 그룹 내부 2차=추천순 · 3차=최신순 · 비SKY 제외하지 않음
 *   · university_note / 대학원 문구 / sky_flag 미사용
 */

import { parseHashQuery } from './preview-links.js';
import { isSkyUniversityName } from './korean-universities.js';

/** @typedef {'latest'|'recommend'|'review'|'price_asc'|'price_desc'|'budget_asc'|'budget_desc'|'sky'} ListSortKey */
/** @typedef {'study_room'|'tutor'|'student'|'room'} ListSortKind */

export const DEFAULT_LIST_SORT = /** @type {ListSortKey} */ ('latest');

/** @type {Record<ListSortKey, string>} */
export const LIST_SORT_LABELS = {
  latest: '최신순',
  recommend: '추천순',
  review: '후기순',
  price_asc: '낮은 가격순',
  price_desc: '높은 가격순',
  budget_asc: '낮은 예산순',
  budget_desc: '높은 예산순',
  sky: 'SKY 우선',
};

/**
 * @param {ListSortKind} kind
 * @returns {{ value: ListSortKey, label: string }[]}
 */
export function sortOptionsForKind(kind) {
  const k = kind === 'room' ? 'study_room' : kind;
  if (k === 'student') {
    return [
      { value: 'latest', label: LIST_SORT_LABELS.latest },
      { value: 'budget_asc', label: LIST_SORT_LABELS.budget_asc },
      { value: 'budget_desc', label: LIST_SORT_LABELS.budget_desc },
    ];
  }
  if (k === 'tutor') {
    return [
      { value: 'latest', label: LIST_SORT_LABELS.latest },
      { value: 'recommend', label: LIST_SORT_LABELS.recommend },
      { value: 'review', label: LIST_SORT_LABELS.review },
      { value: 'price_asc', label: LIST_SORT_LABELS.price_asc },
      { value: 'price_desc', label: LIST_SORT_LABELS.price_desc },
      { value: 'sky', label: LIST_SORT_LABELS.sky },
    ];
  }
  return [
    { value: 'latest', label: LIST_SORT_LABELS.latest },
    { value: 'recommend', label: LIST_SORT_LABELS.recommend },
    { value: 'review', label: LIST_SORT_LABELS.review },
    { value: 'price_asc', label: LIST_SORT_LABELS.price_asc },
    { value: 'price_desc', label: LIST_SORT_LABELS.price_desc },
  ];
}

/**
 * @param {ListSortKind} kind
 * @param {string | null | undefined} raw
 * @returns {ListSortKey}
 */
export function normalizeListSort(kind, raw) {
  const allowed = new Set(sortOptionsForKind(kind).map((o) => o.value));
  const key = String(raw || '').trim();
  if (allowed.has(/** @type {ListSortKey} */ (key))) return /** @type {ListSortKey} */ (key);
  // 학생 탭에서 price_* 별칭 허용
  if (kind === 'student' || kind === 'room') {
    /* no-op */
  }
  if ((kind === 'student') && key === 'price_asc') return 'budget_asc';
  if ((kind === 'student') && key === 'price_desc') return 'budget_desc';
  return DEFAULT_LIST_SORT;
}

/** @param {ListSortKind} kind */
export function sortQueryParamForKind(kind) {
  const k = kind === 'room' ? 'study_room' : kind;
  if (k === 'study_room') return 'sort_room';
  if (k === 'tutor') return 'sort_tutor';
  if (k === 'student') return 'sort_student';
  return 'sort';
}

/**
 * 검색(단일 결과)은 sort, 홈 Basic(복수 리스트)은 sort_room|tutor|student
 * @param {ListSortKind} kind
 * @param {{ mode?: 'search'|'home' }} [opts]
 */
export function readListSortFromHash(kind, opts = {}) {
  const q = parseHashQuery();
  const mode = opts.mode || 'search';
  if (mode === 'search') {
    return normalizeListSort(kind, q.sort);
  }
  const param = sortQueryParamForKind(kind);
  return normalizeListSort(kind, q[param] || q.sort);
}

/**
 * @param {string} param
 * @param {string} value
 * @param {{ fireHashChange?: boolean }} [opts]
 */
export function patchHashQueryParam(param, value, opts = {}) {
  const hash = window.location.hash.slice(1) || '/';
  const qIdx = hash.indexOf('?');
  const path = qIdx === -1 ? hash : hash.slice(0, qIdx);
  const params = new URLSearchParams(qIdx === -1 ? '' : hash.slice(qIdx + 1));
  params.set(param, value || DEFAULT_LIST_SORT);
  const qs = params.toString();
  const next = qs ? `${path}?${qs}` : path;
  const withHash = next.startsWith('/') ? `#${next}` : `#/${next}`;
  if (window.location.hash === withHash) return;
  // 정렬 변경은 hashchange 풀리렌더 대신 replace — 검색 결과 상태 유지
  if (opts.fireHashChange === false) {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${withHash}`);
    return;
  }
  window.location.hash = withHash;
}

/**
 * @param {ListSortKind} kind
 * @param {ListSortKey} sort
 * @param {{ mode?: 'search'|'home', fireHashChange?: boolean }} [opts]
 */
export function writeListSortToHash(kind, sort, opts = {}) {
  const mode = opts.mode || 'search';
  const param = mode === 'search' ? 'sort' : sortQueryParamForKind(kind);
  const fireHashChange =
    opts.fireHashChange !== undefined ? opts.fireHashChange : mode === 'home';
  patchHashQueryParam(param, normalizeListSort(kind, sort), { fireHashChange });
}

/** @param {object} item */
function latestKey(item) {
  return String(item.published_at || item.created_at || item.registered_at || item.starts_at || '');
}

/** @param {unknown} raw */
function isMissingPrice(raw) {
  if (raw == null || raw === '') return true;
  if (raw === '—' || raw === '-') return true;
  const n = Number(raw);
  return !Number.isFinite(n) || n === 0;
}

/**
 * @param {object} item
 * @param {ListSortKind} kind
 */
function priceValue(item, kind) {
  const k = kind === 'room' ? 'study_room' : kind;
  if (k === 'student') {
    const v = item.preferred_fee_amount ?? item.preferred_studyroom_fee_amount ?? item.budget_amount;
    return isMissingPrice(v) ? null : Number(v);
  }
  if (k === 'tutor') {
    const v = item.preferred_fee_amount ?? item.price_amount;
    return isMissingPrice(v) ? null : Number(v);
  }
  const v = item.price_amount;
  return isMissingPrice(v) ? null : Number(v);
}

/**
 * 지역 등으로 이미 좁혀진 배열만 정렬 (Prime/Pick 풀에는 쓰지 말 것)
 * @param {object[]} items
 * @param {ListSortKind} kind
 * @param {string | null | undefined} sortRaw
 */
export function sortListItems(items, kind, sortRaw) {
  const sort = normalizeListSort(kind, sortRaw);
  const rows = [...items];

  const byLatest = (a, b) => {
    const da = latestKey(a);
    const db = latestKey(b);
    if (da !== db) return db.localeCompare(da);
    return Number(b.id || 0) - Number(a.id || 0);
  };

  rows.sort((a, b) => {
    if (sort === 'latest') return byLatest(a, b);

    if (sort === 'sky') {
      // university_name 만 — note 필드는 읽지 않음
      const sa = isSkyUniversityName(a.university_name) ? 0 : 1;
      const sb = isSkyUniversityName(b.university_name) ? 0 : 1;
      if (sa !== sb) return sa - sb;
      const ra = Number(a.recommend_count ?? 0);
      const rb = Number(b.recommend_count ?? 0);
      if (ra !== rb) return rb - ra;
      return byLatest(a, b);
    }

    if (sort === 'recommend') {
      const ra = Number(a.recommend_count ?? 0);
      const rb = Number(b.recommend_count ?? 0);
      if (ra !== rb) return rb - ra;
      return byLatest(a, b);
    }

    if (sort === 'review') {
      const ra = Number(a.review_count ?? 0);
      const rb = Number(b.review_count ?? 0);
      if (ra !== rb) return rb - ra;
      return byLatest(a, b);
    }

    if (
      sort === 'price_asc' ||
      sort === 'price_desc' ||
      sort === 'budget_asc' ||
      sort === 'budget_desc'
    ) {
      const asc = sort === 'price_asc' || sort === 'budget_asc';
      const pa = priceValue(a, kind);
      const pb = priceValue(b, kind);
      const aMissing = pa == null;
      const bMissing = pb == null;
      if (aMissing && bMissing) return byLatest(a, b);
      if (aMissing) return 1;
      if (bMissing) return -1;
      if (pa !== pb) return asc ? pa - pb : pb - pa;
      return byLatest(a, b);
    }

    return byLatest(a, b);
  });

  return rows;
}

/**
 * @param {ListSortKind} kind
 * @param {ListSortKey} current
 * @param {{ listId?: string, mode?: 'search'|'home' }} [opts]
 */
export function renderListSortSelect(kind, current, opts = {}) {
  const sort = normalizeListSort(kind, current);
  const listId = opts.listId || '';
  const mode = opts.mode || 'search';
  const options = sortOptionsForKind(kind)
    .map(
      (o) =>
        `<option value="${o.value}"${o.value === sort ? ' selected' : ''}>${o.label}</option>`,
    )
    .join('');

  return `
    <div class="list-sort-bar" data-list-sort-bar>
      <label class="list-sort-bar__label">
        <span class="list-sort-bar__text">정렬</span>
        <select
          class="list-sort-bar__select"
          data-list-sort
          data-list-sort-kind="${kind === 'room' ? 'study_room' : kind}"
          data-list-sort-mode="${mode}"
          ${listId ? `data-list-sort-list="${listId}"` : ''}
          aria-label="목록 정렬"
        >${options}</select>
      </label>
    </div>`;
}

/**
 * @param {HTMLElement} root
 * @param {() => void} rerender
 * @param {{ onSortChange?: (kind: string, sort: string, listId: string) => void }} [hooks]
 */
export function bindListSortControls(root, rerender, hooks = {}) {
  root.querySelectorAll('[data-list-sort]').forEach((el) => {
    if (!(el instanceof HTMLSelectElement)) return;
    el.addEventListener('change', () => {
      const kind = /** @type {ListSortKind} */ (el.dataset.listSortKind || 'study_room');
      const mode = /** @type {'search'|'home'} */ (el.dataset.listSortMode || 'search');
      const sort = normalizeListSort(kind, el.value);
      const listId = el.dataset.listSortList || '';
      writeListSortToHash(kind, sort, {
        mode,
        fireHashChange: mode === 'home',
      });
      const handled = hooks.onSortChange?.(kind, sort, listId);
      if (handled === false) return;
      rerender();
    });
  });
}
