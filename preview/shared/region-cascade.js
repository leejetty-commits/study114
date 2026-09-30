/**
 * 과외·학생 희망지역 선택. 서버 cities 응답만 사용한다.
 * 1차 시도 → 2차 시·군 또는 구·군 → 일반구가 있으면 3차 구.
 * 선택이 끝나기 전에는 region_id를 비운다.
 */

export const REGION_LIST_ERROR = '지역 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
export const REGION_RESELECT = '지역을 다시 선택해 주세요';

/**
 * @typedef {object} CityUnit
 * @property {string} id
 * @property {string} label
 * @property {string} sido_code
 * @property {string} sido_name
 * @property {string} official_code
 * @property {string} city_name
 * @property {string} gu_name
 * @property {string} kind
 */

/** @param {unknown} list @returns {CityUnit[]} */
export function normalizeCities(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((raw) => {
      const c = raw && typeof raw === 'object' ? raw : {};
      const gu = c.gu_name == null ? '' : String(c.gu_name).trim();
      return {
        id: String(c.id ?? '').trim(),
        label: String(c.label || '').trim(),
        sido_code: c.sido_code != null ? String(c.sido_code) : '',
        sido_name: String(c.sido_name || '').trim(),
        official_code: c.official_code != null ? String(c.official_code) : '',
        city_name: String(c.city_name || '').trim(),
        gu_name: gu,
        kind: String(c.kind || ''),
      };
    })
    .filter((c) => /^\d+$/.test(c.id) && c.sido_name);
}

/** @param {CityUnit[]} units @returns {Array<{sido_name: string, sido_code: string, official_code: string}>} */
export function listSidoOptions(units) {
  /** @type {Map<string, {sido_name: string, sido_code: string, official_code: string}>} */
  const map = new Map();
  units.forEach((row) => {
    const prev = map.get(row.sido_name);
    if (!prev || row.official_code < prev.official_code) {
      map.set(row.sido_name, {
        sido_name: row.sido_name,
        sido_code: row.sido_code,
        official_code: row.official_code,
      });
    }
  });
  return [...map.values()].sort((a, b) => a.official_code.localeCompare(b.official_code));
}

/** @param {CityUnit[]} units @param {string} sidoName */
export function listCityNames(units, sidoName) {
  /** @type {Map<string, string>} */
  const map = new Map();
  units
    .filter((row) => row.sido_name === sidoName && row.city_name)
    .forEach((row) => {
      const prev = map.get(row.city_name);
      if (!prev || row.official_code < prev) map.set(row.city_name, row.official_code);
    });
  return [...map.entries()]
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([name]) => name);
}

/** @param {CityUnit[]} units @param {string} sidoName @param {string} cityName @returns {CityUnit[]} */
export function listGuRows(units, sidoName, cityName) {
  return units
    .filter(
      (row) =>
        row.sido_name === sidoName &&
        row.city_name === cityName &&
        row.kind === 'city_gu' &&
        row.gu_name,
    )
    .sort((a, b) => a.official_code.localeCompare(b.official_code));
}

/** @param {CityUnit} row */
export function activityLabelForUnit(row) {
  if (!row) return '';
  if (row.kind === 'sejong') return row.sido_name || row.city_name || row.label;
  if (row.kind === 'city_gu') {
    return [row.sido_name, row.city_name, row.gu_name].filter(Boolean).join(' ');
  }
  return [row.sido_name, row.city_name].filter(Boolean).join(' ');
}

/**
 * @param {CityUnit[]} units
 * @param {{ sidoName?: string, cityName?: string, guName?: string }} pick
 */
export function resolveCascade(units, pick) {
  const sidoName = String(pick.sidoName || '');
  const cityName = String(pick.cityName || '');
  const guName = String(pick.guName || '');
  const sidoRows = units.filter((row) => row.sido_name === sidoName);
  const empty = {
    regionId: '',
    label: '',
    complete: false,
    showCity: false,
    showGu: false,
    cityLabel: '시·군',
    row: null,
  };
  if (!sidoName || !sidoRows.length) return empty;

  const sejongRows = sidoRows.filter((row) => row.kind === 'sejong');
  if (sejongRows.length === sidoRows.length && sejongRows.length === 1) {
    const row = sejongRows[0];
    return {
      regionId: row.id,
      label: activityLabelForUnit(row),
      complete: true,
      showCity: false,
      showGu: false,
      cityLabel: '시·군',
      row,
    };
  }

  const cityLabel = sidoRows.some((row) => row.kind === 'metro_gu' || row.kind === 'metro_gun')
    ? '구·군'
    : '시·군';
  if (!cityName) {
    return { ...empty, showCity: true, cityLabel };
  }

  const cityRows = sidoRows.filter((row) => row.city_name === cityName);
  const gus = listGuRows(units, sidoName, cityName);
  if (gus.length) {
    if (!guName) {
      return { ...empty, showCity: true, showGu: true, cityLabel };
    }
    const row = gus.find((item) => item.gu_name === guName) || null;
    if (!row) return { ...empty, showCity: true, showGu: true, cityLabel };
    return {
      regionId: row.id,
      label: activityLabelForUnit(row),
      complete: true,
      showCity: true,
      showGu: true,
      cityLabel,
      row,
    };
  }

  if (cityRows.length !== 1) {
    return { ...empty, showCity: true, cityLabel };
  }
  const row = cityRows[0];
  return {
    regionId: row.id,
    label: activityLabelForUnit(row),
    complete: true,
    showCity: true,
    showGu: false,
    cityLabel,
    row,
  };
}

/**
 * @param {string|number} regionId
 * @param {CityUnit[]} units
 */
export function selectionFromRegionId(regionId, units) {
  const id = String(regionId ?? '').trim();
  const row = units.find((item) => item.id === id) || null;
  if (!row) {
    return { sidoName: '', cityName: '', guName: '', stale: id !== '', row: null };
  }
  if (row.kind === 'sejong') {
    return { sidoName: row.sido_name, cityName: '', guName: '', stale: false, row };
  }
  if (row.kind === 'city_gu') {
    return { sidoName: row.sido_name, cityName: row.city_name, guName: row.gu_name, stale: false, row };
  }
  return { sidoName: row.sido_name, cityName: row.city_name, guName: '', stale: false, row };
}

/** @param {string} activityLabel @param {Array<Record<string, unknown>>|CityUnit[]} units */
export function regionIdFromActivityLabel(activityLabel, units) {
  const text = String(activityLabel || '').trim();
  if (!text) return '';
  const list = normalizeCities(units);
  const hits = list.filter((row) => activityLabelForUnit(row) === text);
  return hits.length === 1 ? hits[0].id : '';
}

/** @param {string|number} regionId @param {Array<Record<string, unknown>>|CityUnit[]} units */
export function activityLabelFromRegionId(regionId, units) {
  const list = normalizeCities(units);
  const row = list.find((item) => item.id === String(regionId ?? '').trim());
  return row ? activityLabelForUnit(row) : '';
}

/**
 * @param {string} sidoName
 * @param {string} cityName
 * @param {string} guName
 * @param {Array<Record<string, unknown>>|CityUnit[]} units
 */
export function regionIdFromSelection(sidoName, cityName, guName, units) {
  return resolveCascade(normalizeCities(units), { sidoName, cityName, guName }).regionId;
}

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function optionHtml(value, label, selected) {
  return `<option value="${esc(value)}" ${selected ? 'selected' : ''}>${esc(label)}</option>`;
}

/**
 * @param {{
 *   idPrefix?: string,
 *   units?: Array<Record<string, unknown>>,
 *   regionId?: string|number,
 *   stale?: boolean,
 *   selectClass?: string,
 *   required?: boolean,
 *   hiddenName?: string,
 *   hiddenLabelName?: string,
 * }} opts
 */
export function renderRegionCascade(opts = {}) {
  const units = normalizeCities(opts.units || []);
  const selectClass = opts.selectClass || 'form-input';
  const prefix = opts.idPrefix || 'region';
  if (!units.length) {
    const nameAttr = opts.hiddenName ? ` name="${esc(opts.hiddenName)}"` : '';
    return `
      <p class="form-note form-note--error" data-region-list-error>${esc(REGION_LIST_ERROR)}</p>
      <input type="hidden" data-field="region_id"${nameAttr} value="" />
    `;
  }

  const picked = selectionFromRegionId(opts.regionId, units);
  const stale = Boolean(opts.stale) || picked.stale;
  const sidoName = stale ? '' : picked.sidoName;
  const cityName = stale ? '' : picked.cityName;
  const guName = stale ? '' : picked.guName;
  const resolved = resolveCascade(units, { sidoName, cityName, guName });
  const sidos = listSidoOptions(units);
  const cities = sidoName ? listCityNames(units, sidoName) : [];
  const gus = sidoName && cityName ? listGuRows(units, sidoName, cityName) : [];

  return `
    <div data-region-cascade>
      ${
        stale
          ? `<p class="form-note p19-field__hint" data-region-stale>${esc(REGION_RESELECT)}</p>`
          : '<p class="form-note p19-field__hint" data-region-stale hidden></p>'
      }
      <div class="form-group">
        <label class="form-label" for="${esc(prefix)}_sido">시·도</label>
        <select class="${esc(selectClass)}" id="${esc(prefix)}_sido" data-field="region_sido" ${opts.required ? 'required' : ''}>
          ${optionHtml('', '시·도 선택', !sidoName)}
          ${sidos.map((s) => optionHtml(s.sido_name, s.sido_name, s.sido_name === sidoName)).join('')}
        </select>
      </div>
      <div class="form-group" data-city-wrap ${resolved.showCity ? '' : 'hidden'}>
        <label class="form-label" for="${esc(prefix)}_city" data-city-label>${esc(resolved.cityLabel)}</label>
        <select class="${esc(selectClass)}" id="${esc(prefix)}_city" data-field="region_city">
          ${optionHtml('', `${resolved.cityLabel} 선택`, !cityName)}
          ${cities.map((name) => optionHtml(name, name, name === cityName)).join('')}
        </select>
      </div>
      <div class="form-group" data-gu-wrap ${resolved.showGu ? '' : 'hidden'}>
        <label class="form-label" for="${esc(prefix)}_gu">구</label>
        <select class="${esc(selectClass)}" id="${esc(prefix)}_gu" data-field="region_gu">
          ${optionHtml('', '구 선택', !guName)}
          ${gus.map((row) => optionHtml(row.gu_name, row.gu_name, row.gu_name === guName)).join('')}
        </select>
      </div>
      <input type="hidden" data-field="region_id" ${opts.hiddenName ? `name="${esc(opts.hiddenName)}"` : ''} value="${esc(resolved.regionId)}" />
      <input type="hidden" data-field="region_activity_label" ${opts.hiddenLabelName ? `name="${esc(opts.hiddenLabelName)}"` : ''} value="${esc(resolved.label)}" />
    </div>`;
}

/** @param {Element} el @param {CityUnit[]} units */
export function syncRegionCascade(el, units) {
  const list = normalizeCities(units);
  const sidoSel = el.querySelector('[data-field="region_sido"]');
  const citySel = el.querySelector('[data-field="region_city"]');
  const guSel = el.querySelector('[data-field="region_gu"]');
  const cityWrap = el.querySelector('[data-city-wrap]');
  const guWrap = el.querySelector('[data-gu-wrap]');
  const cityLabelEl = el.querySelector('[data-city-label]');
  const hiddenId = el.querySelector('[data-field="region_id"]');
  const hiddenLabel = el.querySelector('[data-field="region_activity_label"]');
  if (!(sidoSel instanceof HTMLSelectElement)) return;

  const sidoName = sidoSel.value || '';
  const draftCity = citySel instanceof HTMLSelectElement ? citySel.value : '';
  const draftGu = guSel instanceof HTMLSelectElement ? guSel.value : '';
  const cityNames = sidoName ? listCityNames(list, sidoName) : [];
  const preview = resolveCascade(list, { sidoName, cityName: draftCity, guName: '' });
  if (citySel instanceof HTMLSelectElement) {
    const keep = cityNames.includes(draftCity) ? draftCity : '';
    citySel.innerHTML = [
      optionHtml('', `${preview.cityLabel} 선택`, !keep),
      ...cityNames.map((name) => optionHtml(name, name, name === keep)),
    ].join('');
    citySel.value = keep;
  }
  const cityName = citySel instanceof HTMLSelectElement ? citySel.value : '';
  const gus = sidoName && cityName ? listGuRows(list, sidoName, cityName) : [];
  if (guSel instanceof HTMLSelectElement) {
    const keep = gus.some((row) => row.gu_name === draftGu) ? draftGu : '';
    guSel.innerHTML = [
      optionHtml('', '구 선택', !keep),
      ...gus.map((row) => optionHtml(row.gu_name, row.gu_name, row.gu_name === keep)),
    ].join('');
    guSel.value = keep;
  }
  const guName = guSel instanceof HTMLSelectElement ? guSel.value : '';
  const resolved = resolveCascade(list, { sidoName, cityName, guName });
  if (cityWrap instanceof HTMLElement) cityWrap.hidden = !resolved.showCity;
  if (guWrap instanceof HTMLElement) guWrap.hidden = !resolved.showGu;
  if (cityLabelEl) cityLabelEl.textContent = resolved.cityLabel;
  if (hiddenId instanceof HTMLInputElement) hiddenId.value = resolved.regionId;
  if (hiddenLabel instanceof HTMLInputElement) hiddenLabel.value = resolved.label;
  const stale = el.querySelector('[data-region-stale]');
  if (stale instanceof HTMLElement && (sidoName || cityName || guName)) {
    stale.hidden = true;
    stale.textContent = '';
  }
}

/** @param {ParentNode} root @param {Array<Record<string, unknown>>|CityUnit[]} units */
export function bindRegionCascades(root, units) {
  const list = normalizeCities(units);
  root.querySelectorAll('[data-region-cascade]').forEach((el) => {
    const sync = () => syncRegionCascade(el, list);
    el.querySelector('[data-field="region_sido"]')?.addEventListener('change', () => {
      const citySel = el.querySelector('[data-field="region_city"]');
      const guSel = el.querySelector('[data-field="region_gu"]');
      if (citySel instanceof HTMLSelectElement) citySel.value = '';
      if (guSel instanceof HTMLSelectElement) guSel.value = '';
      sync();
    });
    el.querySelector('[data-field="region_city"]')?.addEventListener('change', () => {
      const guSel = el.querySelector('[data-field="region_gu"]');
      if (guSel instanceof HTMLSelectElement) guSel.value = '';
      sync();
    });
    el.querySelector('[data-field="region_gu"]')?.addEventListener('change', sync);
  });
}
