import { registerState, getRegions, getComplexes } from './state.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function regionOptions(selected) {
  return [
    '<option value="">행정동 선택</option>',
    ...getRegions().map(
      (r) =>
        `<option value="${esc(r.id)}" ${String(selected) === String(r.id) ? 'selected' : ''}>${esc(r.label)}</option>`,
    ),
  ].join('');
}

function complexOptions(selected) {
  return [
    '<option value="">아파트단지 선택</option>',
    ...getComplexes().map((c) => {
      const addr = c.address ? ` — ${c.address}` : '';
      return `<option value="${esc(c.id)}" data-region-id="${esc(c.region_id)}" data-address="${esc(c.address || '')}" ${String(selected) === String(c.id) ? 'selected' : ''}>${esc(c.label)}${esc(addr)}</option>`;
    }),
  ].join('');
}

export function resolveBasis(s) {
  if (s.region_basis_type === 'dong' || s.region_basis_type === 'complex') return s.region_basis_type;
  if (s.complex_id) return 'complex';
  return 'dong';
}

export function promoSlots(s) {
  const slots = Array.isArray(s.saved_regions) ? s.saved_regions.map((row) => ({ ...row })) : [];
  while (slots.length < 3) {
    slots.push({
      region_id: '',
      complex_id: '',
      region_basis_type: '',
      is_primary: false,
    });
  }
  return slots.slice(0, 3);
}

export function slotIsFilled(slot, basis) {
  if (basis === 'complex') return Boolean(String(slot?.complex_id || '').trim());
  return Boolean(String(slot?.region_id || '').trim());
}

function renderSavedRegion(slot, idx, basis) {
  const cls = slot.is_primary ? 'register-region-slot is-primary' : 'register-region-slot';
  if (basis === 'complex') {
    return `
    <div class="${cls}" data-region-slot="${idx}" data-slot-basis="complex">
      <div class="form-row" style="align-items:center;margin-bottom:var(--space-2);">
        <strong>홍보지역 ${idx + 1} · 단지</strong>
        <label class="form-check" style="margin-left:auto;">
          <input class="form-check__input" type="radio" name="is_primary" value="${idx}" ${slot.is_primary ? 'checked' : ''} data-field="is_primary" />
          <span class="form-check__label">대표지역</span>
        </label>
      </div>
      <div class="form-group">
        <label class="form-label">아파트단지</label>
        <select class="form-input" data-field="complex_id">${complexOptions(slot.complex_id)}</select>
        <input type="hidden" data-field="region_id" value="${esc(slot.region_id || '')}" />
        <input type="hidden" data-field="region_basis_type" value="complex" />
        <p class="register-hint" data-slot-address>${esc(getComplexes().find((c) => String(c.id) === String(slot.complex_id))?.address || '단지 선택 시 주소 표시')}</p>
      </div>
    </div>`;
  }
  return `
    <div class="${cls}" data-region-slot="${idx}" data-slot-basis="dong">
      <div class="form-row" style="align-items:center;margin-bottom:var(--space-2);">
        <strong>홍보지역 ${idx + 1} · 행정동</strong>
        <label class="form-check" style="margin-left:auto;">
          <input class="form-check__input" type="radio" name="is_primary" value="${idx}" ${slot.is_primary ? 'checked' : ''} data-field="is_primary" />
          <span class="form-check__label">대표지역</span>
        </label>
      </div>
      <div class="form-group">
        <label class="form-label">행정동</label>
        <select class="form-input" data-field="region_id">${regionOptions(slot.region_id)}</select>
        <input type="hidden" data-field="complex_id" value="" />
        <input type="hidden" data-field="region_basis_type" value="dong" />
      </div>
    </div>`;
}

/** 현재위치 + 홍보지역 + 주소 요약 필드 */
export function renderLocationFields(s = registerState) {
  const allowComplex = getComplexes().length > 0;
  let basis = resolveBasis(s);
  if (!allowComplex) basis = 'dong';
  const slots = promoSlots(s);

  return `
      <h2 class="register-section-title register-section-title--bar">현재위치</h2>
      <p class="register-hint mb-4">행정동 또는 아파트단지 중 <strong>하나만</strong> 선택합니다. 슬롯 전체는 같은 기준을 씁니다.</p>
      <div class="chip-group" data-basis-group>
        <label class="chip">
          <input type="radio" name="region_basis_type" value="dong" class="chip__input" ${basis === 'dong' ? 'checked' : ''} />
          <span class="chip__label">행정동 기준</span>
        </label>
        ${
          allowComplex
            ? `<label class="chip">
          <input type="radio" name="region_basis_type" value="complex" class="chip__input" ${basis === 'complex' ? 'checked' : ''} />
          <span class="chip__label">아파트단지 기준</span>
        </label>`
            : '<p class="register-hint">등록된 아파트단지가 없어 행정동 기준만 사용합니다.</p>'
        }
      </div>

      <div data-primary-panel="dong" ${basis === 'complex' ? 'hidden' : ''}>
        <div class="form-group">
          <label class="form-label form-label--required" for="region_id">행정동</label>
          <select class="form-input" id="region_id" name="region_id">${regionOptions(s.region_id)}</select>
        </div>
      </div>
      <div data-primary-panel="complex" ${basis === 'complex' ? '' : 'hidden'}>
        <div class="form-group">
          <label class="form-label form-label--required" for="complex_id">아파트단지</label>
          <select class="form-input" id="complex_id" name="complex_id">${complexOptions(s.complex_id)}</select>
          <p class="register-hint" data-primary-address>${esc(getComplexes().find((c) => String(c.id) === String(s.complex_id))?.address || '단지 선택 시 주소 표시')}</p>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="address_text">주소 요약 (선택)</label>
        <input class="form-input" id="address_text" name="address_text" value="${esc(s.address_text || '')}" />
      </div>

      <h2 class="register-section-title register-section-title--bar">홍보지역</h2>
      <p class="register-hint mb-4">3칸을 유지합니다. <strong>1곳은 필수</strong>, 2·3곳은 선택입니다. 빈 칸은 그대로 두고, 선택한 곳 중 대표는 1곳만 지정하세요.</p>
      <div data-saved-regions>
        ${slots.map((slot, i) => renderSavedRegion(slot, i, basis)).join('')}
      </div>
  `;
}

/**
 * @param {HTMLElement} root
 * @returns {{ currentBasis: () => string }}
 */
export function bindLocationFieldEvents(root) {
  function currentBasis() {
    return root.querySelector('input[name="region_basis_type"]:checked')?.value || 'dong';
  }

  function rerenderSlots() {
    const basis = currentBasis();
    registerState.region_basis_type = basis;
    if (basis === 'dong') registerState.complex_id = '';
    root.querySelectorAll('[data-primary-panel]').forEach((p) => {
      p.toggleAttribute('hidden', p.getAttribute('data-primary-panel') !== basis);
    });
    const wrap = root.querySelector('[data-saved-regions]');
    if (wrap) {
      const prevPrimary = promoSlots(registerState).findIndex((s) => s.is_primary);
      const slots = promoSlots(registerState).map((s, i) => ({
        region_id: basis === 'dong' ? s.region_id : '',
        complex_id: basis === 'complex' ? s.complex_id : '',
        region_basis_type: basis,
        is_primary: false,
      }));
      const filled = slots.map((s, i) => (slotIsFilled(s, basis) ? i : -1)).filter((i) => i >= 0);
      const keep = filled.includes(prevPrimary) ? prevPrimary : filled[0];
      if (keep >= 0) slots[keep].is_primary = true;
      registerState.saved_regions = slots;
      wrap.innerHTML = slots.map((slot, i) => renderSavedRegion(slot, i, basis)).join('');
      bindSlotAddressHints(root);
    }
  }

  function bindSlotAddressHints(scope) {
    scope.querySelectorAll('[data-region-slot] [data-field="complex_id"]').forEach((sel) => {
      sel.addEventListener('change', () => {
        const slot = sel.closest('[data-region-slot]');
        const opt = sel.selectedOptions?.[0];
        const regionHidden = slot?.querySelector('[data-field="region_id"]');
        if (regionHidden && opt?.dataset?.regionId) regionHidden.value = opt.dataset.regionId;
        const hint = slot?.querySelector('[data-slot-address]');
        if (hint) hint.textContent = opt?.dataset?.address || '단지 선택 시 주소 표시';
      });
    });
  }

  root.querySelectorAll('input[name="region_basis_type"]').forEach((el) => {
    el.addEventListener('change', rerenderSlots);
  });

  root.querySelector('#complex_id')?.addEventListener('change', (e) => {
    const opt = e.target.selectedOptions?.[0];
    registerState.complex_id = e.target.value;
    if (opt?.dataset?.regionId) {
      registerState.region_id = opt.dataset.regionId;
    }
    const hint = root.querySelector('[data-primary-address]');
    if (hint) hint.textContent = opt?.dataset?.address || '단지 선택 시 주소 표시';
  });

  bindSlotAddressHints(root);

  return { currentBasis };
}

/**
 * @param {HTMLElement} root
 * @returns {string|null} 오류 메시지
 */
export function validateLocationFields(root, state) {
  const basis =
    root.querySelector('input[name="region_basis_type"]:checked')?.value || state.region_basis_type || 'dong';
  state.region_basis_type = basis;
  if (basis === 'dong') {
    state.complex_id = '';
    if (!state.region_id) return '현재위치(행정동)를 선택해 주세요.';
  } else if (!state.complex_id) {
    return '현재위치(아파트단지)를 선택해 주세요.';
  } else {
    const c = getComplexes().find((x) => String(x.id) === String(state.complex_id));
    if (c) state.region_id = String(c.region_id);
  }
  const slots = promoSlots({ saved_regions: state.saved_regions }).map((s) => ({
    ...s,
    region_basis_type: basis,
    complex_id: basis === 'complex' ? s.complex_id : '',
    region_id: basis === 'dong' ? s.region_id : s.region_id,
  }));
  const filledIdx = slots.map((s, i) => (slotIsFilled(s, basis) ? i : -1)).filter((i) => i >= 0);
  if (!filledIdx.length) {
    return '홍보지역을 1곳 이상 선택해 주세요.';
  }
  let primaryIdx = slots.findIndex((s) => s.is_primary);
  if (!filledIdx.includes(primaryIdx)) {
    primaryIdx = filledIdx[0];
  }
  state.saved_regions = slots.map((s, i) => ({
    ...s,
    is_primary: i === primaryIdx,
  }));
  return null;
}
