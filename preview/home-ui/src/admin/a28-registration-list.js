import { esc, renderPanel } from './a28-screens-shared.js';
import { fetchRegistrationList } from './registration-list-api.js';
import {
  REGISTRATION_COLUMNS,
  REGISTRATION_EMPTY,
  REGISTRATION_LEAD,
  REGISTRATION_REGION_WORD,
  REGISTRATION_TABS,
  REGISTRATION_TITLE,
} from './a28-registration-list-copy.js';

/** @type {{ key: string, data: Record<string, unknown>|null, error: string }} */
let view = { key: '', data: null, error: '' };

/** @returns {{ role: string, from: string, to: string, region: string, page: number }} */
export function readRegistrationQuery() {
  const raw = String(window.location.hash || '').replace(/^#/, '');
  const q = raw.includes('?') ? raw.slice(raw.indexOf('?') + 1) : '';
  const params = new URLSearchParams(q);
  const role = params.get('role') || 'study_room';
  const safeRole = REGISTRATION_TABS.some((tab) => tab.role === role) ? role : 'study_room';
  const page = Math.max(1, Number(params.get('page') || 1) || 1);

  return {
    role: safeRole,
    from: params.get('from') || '',
    to: params.get('to') || '',
    region: params.get('region') || '',
    page,
  };
}

/** @param {{ role: string, from: string, to: string, region: string, page: number }} query */
export function registrationHash(query) {
  const params = new URLSearchParams();
  params.set('role', query.role);
  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);
  if (query.region) params.set('region', query.region);
  params.set('page', String(query.page || 1));
  return `/admin/registrations?${params}`;
}

function cacheKey(query) {
  return registrationHash(query);
}

export function renderRegistrationList() {
  const query = readRegistrationQuery();
  const regionWord = REGISTRATION_REGION_WORD[query.role] || REGISTRATION_REGION_WORD.study_room;
  const current = view.key === cacheKey(query) ? view.data : null;
  const fromValue = query.from || String(current?.from || '');
  const toValue = query.to || String(current?.to || '');
  const tabs = REGISTRATION_TABS.map((tab) => {
    const pressed = tab.role === query.role ? 'true' : 'false';
    const cls = tab.role === query.role ? 'btn btn--primary btn--sm' : 'btn btn--secondary btn--sm';
    return `<button type="button" class="${cls}" data-reg-role="${esc(tab.role)}" aria-pressed="${pressed}">${esc(tab.label)}</button>`;
  }).join('');
  const items = Array.isArray(current?.items) ? current.items : [];
  const rows = items
    .map((item) => {
      const row = /** @type {Record<string, string>} */ (item);
      return `<tr>
        <td>${esc(row.name || '')}</td>
        <td>${esc(row.region || '')}</td>
        <td>${esc(row.registered_at || '')}</td>
        <td>${esc(row.status || '')}</td>
      </tr>`;
    })
    .join('');
  const total = Number(current?.total || 0);
  const perPage = Number(current?.per_page || 50);
  const pages = Math.max(1, Math.ceil(total / (perPage || 50)));
  const body = `
    <div class="admin-actions" data-reg-tabs>${tabs}</div>
    <form class="admin-actions" data-reg-filters>
      <label class="a28-help">${esc(regionWord)}
        <input class="admin-input" name="region" inputmode="numeric" value="${esc(query.region)}" />
      </label>
      <label class="a28-help">시작일
        <input class="admin-input" type="date" name="from" value="${esc(fromValue)}" />
      </label>
      <label class="a28-help">종료일
        <input class="admin-input" type="date" name="to" value="${esc(toValue)}" />
      </label>
      <button type="submit" class="btn btn--primary btn--sm">조회</button>
    </form>
    ${view.error ? `<p class="a28-help" role="alert">${esc(view.error)}</p>` : ''}
    <table class="a28-reg-table">
      <thead>
        <tr>
          <th>${esc(REGISTRATION_COLUMNS.name)}</th>
          <th>${esc(regionWord)}</th>
          <th>${esc(REGISTRATION_COLUMNS.date)}</th>
          <th>${esc(REGISTRATION_COLUMNS.status)}</th>
        </tr>
      </thead>
      <tbody>
        ${rows || `<tr><td colspan="4">${esc(REGISTRATION_EMPTY)}</td></tr>`}
      </tbody>
    </table>
    <div class="admin-actions" data-reg-pager>
      <button type="button" class="btn btn--secondary btn--sm" data-reg-page="${query.page - 1}" ${query.page <= 1 ? 'disabled' : ''}>이전</button>
      <span class="a28-help">${query.page} / ${pages}</span>
      <button type="button" class="btn btn--secondary btn--sm" data-reg-page="${query.page + 1}" ${query.page >= pages ? 'disabled' : ''}>다음</button>
    </div>`;

  return renderPanel(REGISTRATION_TITLE, 'A28-159c', body, { lead: REGISTRATION_LEAD });
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindRegistrationList(root, rerender) {
  const query = readRegistrationQuery();
  const key = cacheKey(query);
  if (view.key !== key) {
    view = { key, data: null, error: '' };
    void fetchRegistrationList({
      role: query.role,
      from: query.from,
      to: query.to,
      region: query.region,
      page: query.page,
      perPage: 50,
    })
      .then((data) => {
        if (view.key !== key) return;
        view = { key, data, error: '' };
        rerender();
      })
      .catch((err) => {
        if (view.key !== key) return;
        view = { key, data: null, error: err instanceof Error ? err.message : '등록 목록을 불러오지 못했습니다.' };
        rerender();
      });
  }

  root.querySelectorAll('[data-reg-role]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const role = btn.getAttribute('data-reg-role') || 'study_room';
      window.location.hash = registrationHash({ ...query, role, page: 1 });
    });
  });

  const form = root.querySelector('[data-reg-filters]');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!(form instanceof HTMLFormElement)) return;
    const fd = new FormData(form);
    window.location.hash = registrationHash({
      role: query.role,
      from: String(fd.get('from') || ''),
      to: String(fd.get('to') || ''),
      region: String(fd.get('region') || '').trim(),
      page: 1,
    });
  });

  root.querySelectorAll('[data-reg-page]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.hasAttribute('disabled')) return;
      const page = Math.max(1, Number(btn.getAttribute('data-reg-page') || 1));
      window.location.hash = registrationHash({ ...query, page });
    });
  });
}
