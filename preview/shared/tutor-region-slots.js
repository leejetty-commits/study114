/**
 * 과외지역 슬롯 — 서버 cities 기준 2~3단계. 대표는 1번.
 */

import {
  bindRegionCascades,
  normalizeCities,
  renderRegionCascade,
  syncRegionCascade,
} from './region-cascade.js';

/** @param {Array<Record<string, unknown>>} apiCities */
export function getCityUnits(apiCities) {
  return normalizeCities(apiCities || []);
}

/**
 * @param {{ region_id?: string|number, is_primary?: boolean, needsReselect?: boolean, region_selectable?: boolean }} slot
 * @param {number} idx
 * @param {ReturnType<typeof getCityUnits>} units
 * @param {{ namePrefix?: string, showPrimary?: boolean, labelPrefix?: string, selectClass?: string }} [opts]
 */
export function renderTutorRegionSlot(slot, idx, units, opts = {}) {
  const prefix = opts.namePrefix || '';
  const showPrimary = opts.showPrimary !== false;
  const labelPrefix = opts.labelPrefix || '지역';
  const id = String(slot.region_id || '').trim();
  const known = !id || units.some((row) => row.id === id);
  const needsReselect = Boolean(slot.needsReselect) || slot.region_selectable === false || (Boolean(id) && !known);
  const primaryUi =
    showPrimary && idx === 0
      ? `<span class="register-region-slot__badge" style="margin-left:auto;">대표</span>`
      : '';
  const warnBadge = (needsReselect && id)
    ? `<span class="mypage-badge mypage-badge--warn" style="${primaryUi ? 'margin-left:auto;margin-right:0.5rem;' : 'margin-left:auto;'}">다시 선택 필요</span>`
    : '';

  return `
    <div class="register-region-slot${slot.is_primary ? ' is-primary' : ''}" data-region-slot="${idx}">
      <div class="form-row register-region-slot__head">
        <strong>${labelPrefix} ${idx + 1}${idx === 0 ? ' (필수)' : ' (선택)'}</strong>
        ${warnBadge}
        ${primaryUi}
      </div>
      <div class="register-region-slot__fields">
        ${renderRegionCascade({
          idPrefix: `${prefix}region_${idx}`,
          units,
          regionId: known ? id : '',
          stale: needsReselect,
          selectClass: opts.selectClass,
          required: idx === 0 && units.length > 0,
        })}
      </div>
      <input type="hidden" data-field="scope_type" value="city" />
      <p class="form-note form-note--error" data-field-error hidden></p>
    </div>`;
}

/**
 * @param {ParentNode} root
 * @param {ReturnType<typeof getCityUnits>} units
 */
export function bindTutorRegionSlotEvents(root, units) {
  root.querySelectorAll('[data-region-slot]').forEach((slotEl) => {
    bindRegionCascades(slotEl, units);
    const clear = () => clearTutorRegionSlotError(slotEl);
    slotEl.querySelectorAll('select').forEach((sel) => sel.addEventListener('change', clear));
  });
}

/**
 * @param {Element} slotEl
 * @param {string} [msg]
 */
export function setTutorRegionSlotError(slotEl, msg) {
  const err = slotEl?.querySelector('[data-field-error]');
  if (!err) return;
  if (msg) {
    err.hidden = false;
    err.textContent = msg;
  } else {
    err.hidden = true;
    err.textContent = '';
  }
}

/** @param {Element} slotEl */
export function clearTutorRegionSlotError(slotEl) {
  setTutorRegionSlotError(slotEl, '');
}

/**
 * @param {ParentNode} root
 * @param {ReturnType<typeof getCityUnits>} units
 */
export function syncTutorRegionSlotIds(root, units) {
  root.querySelectorAll('[data-region-slot] [data-region-cascade]').forEach((el) => {
    syncRegionCascade(el, units);
  });
}

/**
 * @param {ParentNode} root
 * @returns {Array<{region_id: string, scope_type: string, is_primary: boolean, partial: boolean}>}
 */
export function collectTutorRegionSlots(root) {
  const slots = [];
  root.querySelectorAll('[data-region-slot]').forEach((slotEl, idx) => {
    const regionId = slotEl.querySelector('[data-field="region_id"]')?.value ?? '';
    const sido = slotEl.querySelector('[data-field="region_sido"]')?.value || '';
    const city = slotEl.querySelector('[data-field="region_city"]')?.value || '';
    const gu = slotEl.querySelector('[data-field="region_gu"]')?.value || '';
    const started = Boolean(sido || city || gu);
    slots.push({
      region_id: regionId,
      scope_type: 'city',
      is_primary: idx === 0,
      partial: started && !String(regionId).trim(),
    });
  });
  while (slots.length < 3) {
    slots.push({ region_id: '', scope_type: 'city', is_primary: false, partial: false });
  }
  if (slots[0]) slots[0].is_primary = true;
  slots[1].is_primary = false;
  slots[2].is_primary = false;
  return slots.slice(0, 3);
}

/**
 * 숫자 region_id만 유효. 정적 가짜 id는 거부.
 * @param {Array<{region_id?: string, is_primary?: boolean, partial?: boolean}>} slots
 * @returns {{ ok: true, slots: Array<{region_id: string, scope_type: string, is_primary: boolean}> } | { ok: false, index: number, message: string }}
 */
export function validateTutorActivityRegions(slots) {
  const list = Array.isArray(slots) ? slots.slice(0, 3) : [];
  while (list.length < 3) {
    list.push({ region_id: '', scope_type: 'city', is_primary: false, partial: false });
  }

  for (let i = 0; i < 3; i += 1) {
    if (list[i]?.partial) {
      return { ok: false, index: i, message: `과외지역 ${i + 1}을 끝까지 선택해 주세요.` };
    }
  }

  // 1번이 비면 2·3번만 있어도 거부한다. 나중 슬롯을 대표로 올리지 않는다.
  const slot0 = String(list[0]?.region_id || '').trim();
  if (!slot0) {
    return { ok: false, index: 0, message: '과외지역 1을 선택해 주세요.' };
  }
  if (!/^\d+$/.test(slot0)) {
    return {
      ok: false,
      index: 0,
      message: '과외지역 1: 지역 목록을 다시 불러온 뒤 선택해 주세요.',
    };
  }

  const seen = new Map();
  /** @type {Array<{region_id: string, scope_type: string, is_primary: boolean}>} */
  const filled = [];
  for (let i = 0; i < 3; i += 1) {
    const id = String(list[i]?.region_id || '').trim();
    if (!id) continue;
    if (!/^\d+$/.test(id)) {
      return {
        ok: false,
        index: i,
        message: `과외지역 ${i + 1}: 지역 목록을 다시 불러온 뒤 선택해 주세요.`,
      };
    }
    if (seen.has(id)) {
      return {
        ok: false,
        index: i,
        message: `과외지역 ${i + 1}: 이미 선택한 지역입니다.`,
      };
    }
    seen.set(id, i);
    filled.push({
      region_id: id,
      scope_type: 'city',
      is_primary: i === 0,
    });
  }

  return { ok: true, slots: filled };
}
