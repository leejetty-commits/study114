/**
 * 과외 단위 선택(정본 72 · 2026-10-08 잠금). 서버 /api/auth/regions.php?action=tutor_units 만 쓴다.
 * 1단계 시·도 → 특별시·광역시·세종이면 끝, 도·전남광주통합특별시면 2단계 시·군. 구 단계는 없다.
 * 서버 짝: src/Region/TutorRegionUnit.php
 */

import { refreshInputFill } from './input-fill.js';

export const TUTOR_UNIT_LIST_ERROR = '과외지역 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';

/**
 * @typedef {object} TutorUnit
 * @property {string} id
 * @property {string} label 공식 전체 이름
 * @property {string} sido_code
 * @property {string} sido_name
 * @property {string} unit_name 특별시·광역시·세종은 ''
 * @property {string} kind metro | city | county | gwangju
 */

/** @param {unknown} list @returns {TutorUnit[]} */
export function normalizeTutorUnits(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((raw) => {
      const u = raw && typeof raw === 'object' ? raw : {};
      return {
        id: String(u.id ?? '').trim(),
        label: String(u.label || '').trim(),
        sido_code: u.sido_code != null ? String(u.sido_code) : '',
        sido_name: String(u.sido_name || '').trim(),
        unit_name: String(u.unit_name || '').trim(),
        kind: String(u.kind || ''),
      };
    })
    .filter((u) => /^\d+$/.test(u.id) && u.sido_name && u.label);
}

/** @param {TutorUnit[]} units @returns {Array<{sido_name: string, sido_code: string, single: boolean}>} */
export function listTutorSidoOptions(units) {
  /** @type {Map<string, {sido_name: string, sido_code: string, single: boolean}>} */
  const map = new Map();
  units.forEach((u) => {
    const prev = map.get(u.sido_name);
    if (prev) {
      prev.single = prev.single && !u.unit_name;
      return;
    }
    map.set(u.sido_name, { sido_name: u.sido_name, sido_code: u.sido_code, single: !u.unit_name });
  });
  return [...map.values()].sort((a, b) => a.sido_code.localeCompare(b.sido_code));
}

/** @param {TutorUnit[]} units @param {string} sidoName */
export function listTutorUnitsInSido(units, sidoName) {
  return units.filter((u) => u.sido_name === sidoName && u.unit_name);
}

/**
 * @param {TutorUnit[]} units
 * @param {{ sidoName?: string, unitName?: string }} pick
 */
export function resolveTutorCascade(units, pick) {
  const sidoName = String(pick.sidoName || '');
  const unitName = String(pick.unitName || '');
  const empty = { regionId: '', label: '', complete: false, showUnit: false, row: null };
  const rows = units.filter((u) => u.sido_name === sidoName);
  if (!sidoName || !rows.length) return empty;

  const metro = rows.find((u) => !u.unit_name) || null;
  if (metro && rows.length === 1) {
    return { regionId: metro.id, label: metro.label, complete: true, showUnit: false, row: metro };
  }
  if (!unitName) return { ...empty, showUnit: true };
  const row = rows.find((u) => u.unit_name === unitName) || null;
  if (!row) return { ...empty, showUnit: true };
  return { regionId: row.id, label: row.label, complete: true, showUnit: true, row };
}

/** @param {string|number} regionId @param {TutorUnit[]} units */
export function tutorSelectionFromRegionId(regionId, units) {
  const id = String(regionId ?? '').trim();
  const row = units.find((u) => u.id === id) || null;
  if (!row) return { sidoName: '', unitName: '', row: null };
  return { sidoName: row.sido_name, unitName: row.unit_name, row };
}

/** @param {string|number} regionId @param {Array<Record<string, unknown>>|TutorUnit[]} units */
export function tutorUnitLabelFromId(regionId, units) {
  const id = String(regionId ?? '').trim();
  if (!id) return '';
  return normalizeTutorUnits(units).find((u) => u.id === id)?.label || '';
}

/** @param {string} label @param {Array<Record<string, unknown>>|TutorUnit[]} units */
export function tutorUnitIdFromLabel(label, units) {
  const text = String(label || '').trim();
  if (!text) return '';
  const hits = normalizeTutorUnits(units).filter((u) => u.label === text);
  return hits.length === 1 ? hits[0].id : '';
}

/** 주소 검색·GPS 가 주는 시도 약칭 → 정식 시도 이름. */
const SIDO_ALIASES = {
  서울: '서울특별시',
  서울시: '서울특별시',
  부산: '부산광역시',
  부산시: '부산광역시',
  대구: '대구광역시',
  대구시: '대구광역시',
  인천: '인천광역시',
  인천시: '인천광역시',
  대전: '대전광역시',
  대전시: '대전광역시',
  울산: '울산광역시',
  울산시: '울산광역시',
  세종: '세종특별자치시',
  세종시: '세종특별자치시',
  경기: '경기도',
  충북: '충청북도',
  충남: '충청남도',
  경북: '경상북도',
  경남: '경상남도',
  제주: '제주특별자치도',
  제주도: '제주특별자치도',
  강원: '강원특별자치도',
  강원도: '강원특별자치도',
  전북: '전북특별자치도',
  전라북도: '전북특별자치도',
  전남광주: '전남광주통합특별시',
  광주: '전남광주통합특별시',
  광주광역시: '전남광주통합특별시',
  전남: '전남광주통합특별시',
  전라남도: '전남광주통합특별시',
};

const GWANGJU_SIDO = '전남광주통합특별시';

/**
 * 주소의 시도·시군구 글자 → 과외 단위 id. 구는 버리고 단위로 올린다.
 * 「서울 강남구」→ 서울특별시, 「경기 수원시 영통구」→ 경기도 수원시, 「경기 광주시」→ 경기도 광주시,
 * 「광주 광산구」→ 전남광주통합특별시 광주. 못 찾으면 ''.
 *
 * @param {string} sido
 * @param {string} sigungu
 * @param {Array<Record<string, unknown>>|TutorUnit[]} units
 */
export function tutorUnitIdForAddress(sido, sigungu, units) {
  const list = normalizeTutorUnits(units);
  const rawSido = String(sido || '').trim();
  const sidoName = SIDO_ALIASES[rawSido] || rawSido;
  const rows = list.filter((u) => u.sido_name === sidoName);
  if (!rows.length) return '';
  const metro = rows.find((u) => !u.unit_name);
  if (metro && rows.length === 1) return metro.id;

  const first = String(sigungu || '').trim().split(/\s+/)[0] || '';
  if (!first) return '';
  const direct = rows.find((u) => u.unit_name === first);
  if (direct) return direct.id;
  if (sidoName === GWANGJU_SIDO && /구$/.test(first)) {
    return rows.find((u) => u.kind === 'gwangju')?.id || '';
  }
  return '';
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
 * 저장 값은 hidden region_id 하나. 칸 이름(data-field)은 예전 선택칸과 같다.
 *
 * @param {{
 *   idPrefix?: string,
 *   units?: Array<Record<string, unknown>>|TutorUnit[],
 *   regionId?: string|number,
 *   selectClass?: string,
 *   required?: boolean,
 *   hiddenName?: string,
 *   hiddenLabelName?: string,
 * }} opts
 */
export function renderTutorUnitCascade(opts = {}) {
  const units = normalizeTutorUnits(opts.units || []);
  const selectClass = opts.selectClass || 'form-input';
  const prefix = opts.idPrefix || 'tutor_unit';
  const nameAttr = opts.hiddenName ? ` name="${esc(opts.hiddenName)}"` : '';
  if (!units.length) {
    return `
      <p class="form-note form-note--error" data-region-list-error>${esc(TUTOR_UNIT_LIST_ERROR)}</p>
      <input type="hidden" data-field="region_id"${nameAttr} value="" />
    `;
  }

  const picked = tutorSelectionFromRegionId(opts.regionId, units);
  const resolved = resolveTutorCascade(units, picked);
  const sidos = listTutorSidoOptions(units);
  const inSido = picked.sidoName ? listTutorUnitsInSido(units, picked.sidoName) : [];

  return `
    <div data-region-cascade="tutor_unit">
      <div class="form-group">
        <label class="form-label" for="${esc(prefix)}_sido">시·도</label>
        <select class="${esc(selectClass)}" id="${esc(prefix)}_sido" data-field="region_sido" ${opts.required ? 'required' : ''}>
          ${optionHtml('', '시·도 선택', !picked.sidoName)}
          ${sidos.map((s) => optionHtml(s.sido_name, s.sido_name, s.sido_name === picked.sidoName)).join('')}
        </select>
      </div>
      <div class="form-group" data-city-wrap ${resolved.showUnit ? '' : 'hidden'}>
        <label class="form-label" for="${esc(prefix)}_city">시·군</label>
        <select class="${esc(selectClass)}" id="${esc(prefix)}_city" data-field="region_city">
          ${optionHtml('', '시·군 선택', !picked.unitName)}
          ${inSido.map((u) => optionHtml(u.unit_name, u.unit_name, u.unit_name === picked.unitName)).join('')}
        </select>
      </div>
      <input type="hidden" data-field="region_id"${nameAttr} value="${esc(resolved.regionId)}" />
      <input type="hidden" data-field="region_activity_label" ${opts.hiddenLabelName ? `name="${esc(opts.hiddenLabelName)}"` : ''} value="${esc(resolved.label)}" />
    </div>`;
}

/** @param {Element} el @param {Array<Record<string, unknown>>|TutorUnit[]} units */
export function syncTutorUnitCascade(el, units) {
  const list = normalizeTutorUnits(units);
  const sidoSel = el.querySelector('[data-field="region_sido"]');
  const citySel = el.querySelector('[data-field="region_city"]');
  const cityWrap = el.querySelector('[data-city-wrap]');
  const hiddenId = el.querySelector('[data-field="region_id"]');
  const hiddenLabel = el.querySelector('[data-field="region_activity_label"]');
  if (!(sidoSel instanceof HTMLSelectElement)) return;

  const sidoName = sidoSel.value || '';
  const draft = citySel instanceof HTMLSelectElement ? citySel.value : '';
  const inSido = sidoName ? listTutorUnitsInSido(list, sidoName) : [];
  if (citySel instanceof HTMLSelectElement) {
    const keep = inSido.some((u) => u.unit_name === draft) ? draft : '';
    citySel.innerHTML = [
      optionHtml('', '시·군 선택', !keep),
      ...inSido.map((u) => optionHtml(u.unit_name, u.unit_name, u.unit_name === keep)),
    ].join('');
    citySel.value = keep;
  }
  const unitName = citySel instanceof HTMLSelectElement ? citySel.value : '';
  const resolved = resolveTutorCascade(list, { sidoName, unitName });
  if (cityWrap instanceof HTMLElement) cityWrap.hidden = !resolved.showUnit;
  if (hiddenId instanceof HTMLInputElement) hiddenId.value = resolved.regionId;
  if (hiddenLabel instanceof HTMLInputElement) hiddenLabel.value = resolved.label;
  refreshInputFill(el);
}

/** @param {ParentNode} root @param {Array<Record<string, unknown>>|TutorUnit[]} units */
export function bindTutorUnitCascades(root, units) {
  const list = normalizeTutorUnits(units);
  root.querySelectorAll('[data-region-cascade="tutor_unit"]').forEach((el) => {
    const sync = () => syncTutorUnitCascade(el, list);
    el.querySelector('[data-field="region_sido"]')?.addEventListener('change', () => {
      const citySel = el.querySelector('[data-field="region_city"]');
      if (citySel instanceof HTMLSelectElement) citySel.value = '';
      sync();
    });
    el.querySelector('[data-field="region_city"]')?.addEventListener('change', sync);
  });
}
