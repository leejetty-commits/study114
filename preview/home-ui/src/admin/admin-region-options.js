import { adminFetch } from './admin-fetch.js';
import { isAdminApiMode } from './admin-backend.js';
import { esc } from './a28-screens-shared.js';
import { s114Alert } from '../../../shared/confirm-dialog.js';

/** @type {any[]|null} */
let cities = null;
/** @type {Promise<any[]>|null} */
let loading = null;
let alerted = false;

function escAttr(value) {
  return esc(value).replace(/"/g, '&quot;');
}

function sortedCities() {
  return [...(cities || [])].sort((a, b) =>
    String(a?.official_code || '').localeCompare(String(b?.official_code || '')),
  );
}

function isSejongOnly(rows) {
  return rows.length === 1 && rows[0]?.kind === 'sejong';
}

/**
 * 지역 목록을 한 번만 불러 모듈에 둔다.
 * 미리보기에서는 호출하지 않고 「전체」만 쓴다.
 * @returns {Promise<any[]>}
 */
export function loadRegionOptions() {
  if (!isAdminApiMode()) {
    cities = [];
    return Promise.resolve(cities);
  }
  if (cities) return Promise.resolve(cities);
  if (loading) return loading;
  loading = adminFetch('/api/auth/regions.php?action=cities', { method: 'GET' })
    .then(async (res) => {
      const data = await res.json().catch(() => null);
      if (!data || data.ok !== true || !Array.isArray(data.cities)) {
        throw new Error('지역 목록을 불러오지 못했습니다.');
      }
      cities = data.cities;
      return cities;
    })
    .catch(() => {
      cities = [];
      if (!alerted) {
        alerted = true;
        void s114Alert('지역 목록을 불러오지 못했습니다.');
      }
      return cities;
    });
  return loading;
}

/**
 * @param {{ sido?: string, region?: string, namePrefix?: string, sidoLabel?: string, sigunguLabel?: string }} [opts]
 */
export function renderRegionSelects(opts = {}) {
  const sido = String(opts.sido || '');
  const region = String(opts.region || '');
  const prefix = String(opts.namePrefix || '');
  const rows = sortedCities();
  /** @type {any[]} */
  const sidos = [];
  const seen = new Set();
  for (const row of rows) {
    const code = String(row?.sido_code || '');
    if (!/^[0-9]{2}$/.test(code) || seen.has(code)) continue;
    seen.add(code);
    sidos.push(row);
  }
  const sidoOptions = ['<option value="">광역시/도 전체</option>'];
  for (const row of sidos) {
    const code = String(row.sido_code);
    sidoOptions.push(
      `<option value="${escAttr(code)}"${code === sido ? ' selected' : ''}>${esc(row.sido_name || code)}</option>`,
    );
  }
  const guRows = rows.filter((row) => String(row?.sido_code || '') === sido);
  const lock = isSejongOnly(guRows);
  const guOptions = ['<option value="">시군구 전체</option>'];
  if (!lock) {
    for (const row of guRows) {
      const id = String(row.id ?? '');
      if (!/^[1-9][0-9]*$/.test(id)) continue;
      guOptions.push(
        `<option value="${escAttr(id)}"${id === region ? ' selected' : ''}>${esc(row.label || '')}</option>`,
      );
    }
  }
  const sidoHtml = `<select class="admin-input--sm" name="${escAttr(`${prefix}sido`)}" data-region-sido>${sidoOptions.join('')}</select>`;
  const guHtml = `<select class="admin-input--sm" name="${escAttr(`${prefix}region`)}" data-region-sigungu${lock ? ' disabled' : ''}>${guOptions.join('')}</select>`;
  if (opts.sidoLabel || opts.sigunguLabel) {
    return `<label class="a28-help">${esc(opts.sidoLabel || '')}${sidoHtml}</label><label class="a28-help">${esc(opts.sigunguLabel || '')}${guHtml}</label>`;
  }
  return `${sidoHtml}${guHtml}`;
}

/**
 * @param {HTMLSelectElement} select
 * @param {string} sidoCode
 */
function refillSigungu(select, sidoCode) {
  const rows = sortedCities().filter((row) => String(row?.sido_code || '') === String(sidoCode));
  const lock = isSejongOnly(rows);
  const options = ['<option value="">시군구 전체</option>'];
  if (!lock) {
    for (const row of rows) {
      const id = String(row.id ?? '');
      if (!/^[1-9][0-9]*$/.test(id)) continue;
      options.push(`<option value="${escAttr(id)}">${esc(row.label || '')}</option>`);
    }
  }
  select.innerHTML = options.join('');
  select.disabled = lock;
  select.value = '';
}

/**
 * @param {ParentNode|null} root
 * @param {() => void} [onReady]
 */
export function bindRegionSelects(root, onReady) {
  if (!(root instanceof HTMLElement)) return;
  const sidoSel = root.querySelector('[data-region-sido]');
  const guSel = root.querySelector('[data-region-sigungu]');
  if (sidoSel instanceof HTMLSelectElement && guSel instanceof HTMLSelectElement) {
    sidoSel.addEventListener('change', () => {
      refillSigungu(guSel, sidoSel.value);
    });
  }
  if (!isAdminApiMode() || cities !== null) return;
  void loadRegionOptions().then(() => {
    if (typeof onReady === 'function') onReady();
  });
}
