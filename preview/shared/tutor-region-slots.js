/**
 * 과외지역 슬롯 UI — 광역시 단독 / 도→시 캐스케이드
 */

import {
  buildCityUnitOptions,
  resolveCitySelection,
  renderRegionParentOptions,
  renderProvinceCityOptions,
  regionIdFromSelection,
} from './korea-sidos.js';

/**
 * @param {Array<{id: number|string, label: string, sido_code?: string, sido_name?: string, kind?: string}>} apiCities
 */
export function getCityUnits(apiCities) {
  return buildCityUnitOptions(apiCities || []);
}

/**
 * @param {{ region_id?: string|number, is_primary?: boolean }} slot
 * @param {number} idx
 * @param {ReturnType<typeof buildCityUnitOptions>} units
 * @param {{ namePrefix?: string }} [opts]
 */
export function renderTutorRegionSlot(slot, idx, units, opts = {}) {
  const prefix = opts.namePrefix || '';
  const sel = resolveCitySelection(slot.region_id || '', units);
  const isProv = String(sel.parent).startsWith('prov:');
  const provCode = isProv ? sel.parent.slice(5) : '';
  const required = idx === 0 ? 'required' : '';

  return `
    <div class="register-region-slot${slot.is_primary ? ' is-primary' : ''}" data-region-slot="${idx}">
      <div class="form-row register-region-slot__head">
        <strong>지역 ${idx + 1}${idx === 0 ? ' (필수)' : ' (선택)'}</strong>
        <label class="form-check" style="margin-left:auto;">
          <input type="radio" name="${prefix}is_primary" value="${idx}" ${slot.is_primary ? 'checked' : ''} />
          <span class="form-check__label">대표</span>
        </label>
      </div>
      <div class="register-region-slot__fields">
        <div class="form-group">
          <label class="form-label" for="${prefix}region_parent_${idx}">광역시 / 도</label>
          <select class="form-input" id="${prefix}region_parent_${idx}" data-field="region_parent" data-slot="${idx}" ${required}>
            ${renderRegionParentOptions(sel.parent)}
          </select>
        </div>
        <div class="form-group" data-city-wrap ${isProv ? '' : 'hidden'}>
          <label class="form-label" for="${prefix}region_city_${idx}">시</label>
          <select class="form-input" id="${prefix}region_city_${idx}" data-field="region_city" data-slot="${idx}">
            ${isProv ? renderProvinceCityOptions(provCode, sel.cityLabel, units) : '<option value="">시 선택</option>'}
          </select>
        </div>
      </div>
      <input type="hidden" data-field="region_id" value="${slot.region_id || ''}" />
      <input type="hidden" data-field="scope_type" value="city" />
    </div>`;
}

/**
 * @param {ParentNode} root
 * @param {ReturnType<typeof buildCityUnitOptions>} units
 */
export function bindTutorRegionSlotEvents(root, units) {
  root.querySelectorAll('[data-region-slot]').forEach((slotEl) => {
    const parentSel = slotEl.querySelector('[data-field="region_parent"]');
    const citySel = slotEl.querySelector('[data-field="region_city"]');
    const cityWrap = slotEl.querySelector('[data-city-wrap]');
    const hiddenId = slotEl.querySelector('[data-field="region_id"]');

    const sync = () => {
      const parent = parentSel?.value || '';
      const isProv = parent.startsWith('prov:');
      if (cityWrap) cityWrap.hidden = !isProv;
      if (isProv && citySel) {
        const code = parent.slice(5);
        const prev = citySel.value;
        citySel.innerHTML = renderProvinceCityOptions(code, prev, units);
      } else if (citySel) {
        citySel.innerHTML = '<option value="">시 선택</option>';
      }
      const cityLabel = isProv ? citySel?.value || '' : '';
      if (hiddenId) {
        hiddenId.value = regionIdFromSelection(parent, cityLabel, units);
      }
    };

    parentSel?.addEventListener('change', sync);
    citySel?.addEventListener('change', sync);
  });
}

/**
 * @param {ParentNode} root
 * @returns {Array<{region_id: string, scope_type: string, is_primary: boolean}>}
 */
export function collectTutorRegionSlots(root) {
  const primaryIdx = Number(root.querySelector('input[name$="is_primary"]:checked')?.value ?? 0);
  const slots = [];
  root.querySelectorAll('[data-region-slot]').forEach((slotEl, idx) => {
    slots.push({
      region_id: slotEl.querySelector('[data-field="region_id"]')?.value ?? '',
      scope_type: 'city',
      is_primary: idx === primaryIdx,
    });
  });
  while (slots.length < 3) {
    slots.push({ region_id: '', scope_type: 'city', is_primary: false });
  }
  return slots.slice(0, 3);
}
