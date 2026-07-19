import { registerState, getRegions, getComplexes } from '../state.js';
import { syncLocationFromForm } from '../form-collect.js';
import { saveAndNavigate, withSaving } from '../save-flow.js';
import {
  renderRegisterShell,
  renderSectionTitle,
  renderNavButtons,
  renderTempNotice,
  bindGlobalEvents,
  navigate,
} from '../layout.js';

function regionOptions(selected) {
  return [
    '<option value="">행정동 선택</option>',
    ...getRegions().map(
      (r) =>
        `<option value="${r.id}" ${String(selected) === String(r.id) ? 'selected' : ''}>${r.label}</option>`,
    ),
  ].join('');
}

function complexOptions(selected) {
  return [
    '<option value="">아파트단지 선택</option>',
    ...getComplexes().map((c) => {
      const addr = c.address ? ` — ${c.address}` : '';
      return `<option value="${c.id}" data-region-id="${c.region_id}" data-address="${c.address || ''}" ${String(selected) === String(c.id) ? 'selected' : ''}>${c.label}${addr}</option>`;
    }),
  ].join('');
}

function resolveBasis(s) {
  if (s.region_basis_type === 'dong' || s.region_basis_type === 'complex') return s.region_basis_type;
  if (s.complex_id) return 'complex';
  return 'dong';
}

function renderSavedRegion(slot, idx, basis) {
  const cls = slot.is_primary ? 'register-region-slot is-primary' : 'register-region-slot';
  if (basis === 'complex') {
    return `
    <div class="${cls}" data-region-slot="${idx}" data-slot-basis="complex">
      <div class="form-row" style="align-items:center;margin-bottom:var(--space-2);">
        <strong>저장 지역 ${idx + 1} · 단지</strong>
        <label class="form-check" style="margin-left:auto;">
          <input class="form-check__input" type="radio" name="is_primary" value="${idx}" ${slot.is_primary ? 'checked' : ''} data-field="is_primary" />
          <span class="form-check__label">대표지역</span>
        </label>
      </div>
      <div class="form-group">
        <label class="form-label">아파트단지</label>
        <span class="field-db-name">study_room_regions.complex_id</span>
        <select class="form-input" data-field="complex_id">${complexOptions(slot.complex_id)}</select>
        <input type="hidden" data-field="region_id" value="${slot.region_id || ''}" />
        <input type="hidden" data-field="region_basis_type" value="complex" />
        <p class="register-hint" data-slot-address>${getComplexes().find((c) => String(c.id) === String(slot.complex_id))?.address || '단지 선택 시 주소 표시'}</p>
      </div>
    </div>`;
  }
  return `
    <div class="${cls}" data-region-slot="${idx}" data-slot-basis="dong">
      <div class="form-row" style="align-items:center;margin-bottom:var(--space-2);">
        <strong>저장 지역 ${idx + 1} · 행정동</strong>
        <label class="form-check" style="margin-left:auto;">
          <input class="form-check__input" type="radio" name="is_primary" value="${idx}" ${slot.is_primary ? 'checked' : ''} data-field="is_primary" />
          <span class="form-check__label">대표지역</span>
        </label>
      </div>
      <div class="form-group">
        <label class="form-label">행정동</label>
        <span class="field-db-name">study_room_regions.region_id</span>
        <select class="form-input" data-field="region_id">${regionOptions(slot.region_id)}</select>
        <input type="hidden" data-field="complex_id" value="" />
        <input type="hidden" data-field="region_basis_type" value="dong" />
      </div>
    </div>`;
}

export function renderLocation() {
  const s = registerState;
  const basis = resolveBasis(s);
  const allowComplex = getComplexes().length > 0;
  const effectiveBasis = allowComplex ? basis : 'dong';
  if (!allowComplex && s.region_basis_type === 'complex') {
    s.region_basis_type = 'dong';
  }

  const content = `
    ${renderTempNotice('지역·단지는 API 마스터 연동 · 단지 주소 포함 · 지도 좌표는 추후')}
    <form data-form="location">
      ${renderSectionTitle('노출·기본 위치 기준')}
      <p class="register-hint mb-4">가입 기본주소와 분리 · 행정동 또는 아파트단지 중 <strong>하나만</strong> 선택 · 슬롯 전체 동일 기준</p>
      <div class="chip-group" data-basis-group>
        <label class="chip">
          <input type="radio" name="region_basis_type" value="dong" class="chip__input" ${effectiveBasis === 'dong' ? 'checked' : ''} />
          <span class="chip__label">행정동 기준</span>
        </label>
        ${
          allowComplex
            ? `<label class="chip">
          <input type="radio" name="region_basis_type" value="complex" class="chip__input" ${effectiveBasis === 'complex' ? 'checked' : ''} />
          <span class="chip__label">아파트단지 기준</span>
        </label>`
            : '<p class="register-hint">등록된 아파트단지가 없어 행정동 기준만 사용합니다.</p>'
        }
      </div>

      <div data-primary-panel="dong" ${effectiveBasis === 'complex' ? 'hidden' : ''}>
        ${renderSectionTitle('기본 위치 · 행정동')}
        <div class="form-group">
          <label class="form-label form-label--required" for="region_id">행정동</label>
          <span class="field-db-name">region_id</span>
          <select class="form-input" id="region_id" name="region_id">${regionOptions(s.region_id)}</select>
        </div>
      </div>
      <div data-primary-panel="complex" ${effectiveBasis === 'complex' ? '' : 'hidden'}>
        ${renderSectionTitle('기본 위치 · 아파트단지')}
        <div class="form-group">
          <label class="form-label form-label--required" for="complex_id">아파트단지</label>
          <span class="field-db-name">complex_id</span>
          <select class="form-input" id="complex_id" name="complex_id">${complexOptions(s.complex_id)}</select>
          <p class="register-hint" data-primary-address>${getComplexes().find((c) => String(c.id) === String(s.complex_id))?.address || '단지 선택 시 주소 표시'}</p>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="address_text">주소 요약 (선택)</label>
        <span class="field-db-name">address_text</span>
        <input class="form-input" id="address_text" name="address_text" value="${s.address_text || ''}" />
      </div>

      ${renderSectionTitle('노출 지역 (최대 3 · 대표 1 · 1필수+추가2)')}
      <p class="register-hint mb-4">기본등록 seed와 같은 기준·필드를 확장합니다. 행정동과 단지를 섞지 않습니다.</p>
      <div data-saved-regions>
        ${s.saved_regions.map((slot, i) => renderSavedRegion(slot, i, effectiveBasis)).join('')}
      </div>

      ${renderNavButtons('/register/basic', '다음: 수업·가격')}
    </form>
  `;
  return renderRegisterShell(content, {
    step: 2,
    title: '위치 · 저장 지역',
    subtitle: '기준 선선택 후 일관 유지 (10-6)',
  });
}

export function bindLocationEvents(root) {
  bindGlobalEvents(root);
  const nextBtn = root.querySelector('[data-action="next"]');
  const prevBtn = root.querySelector('[data-action="prev"]');
  prevBtn?.addEventListener('click', () => navigate('/register/basic'));

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
      const slots = registerState.saved_regions.map((s, i) => ({
        region_id: basis === 'dong' ? s.region_id : '',
        complex_id: basis === 'complex' ? s.complex_id : '',
        region_basis_type: basis,
        is_primary: i === 0 ? true : !!s.is_primary && i === 0,
      }));
      // keep first primary only
      slots.forEach((s, i) => {
        s.is_primary = i === 0;
      });
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

  nextBtn?.addEventListener('click', () => {
    withSaving(nextBtn, async () => {
      const basis = currentBasis();
      registerState.region_basis_type = basis;
      syncLocationFromForm(root, registerState);
      registerState.region_basis_type = basis;
      if (basis === 'dong') {
        registerState.complex_id = '';
        if (!registerState.region_id) {
          alert('행정동을 선택해 주세요.');
          return;
        }
      } else {
        if (!registerState.complex_id) {
          alert('아파트단지를 선택해 주세요.');
          return;
        }
        const c = getComplexes().find((x) => String(x.id) === String(registerState.complex_id));
        if (c) registerState.region_id = String(c.region_id);
      }
      registerState.saved_regions = (registerState.saved_regions || []).map((s) => ({
        ...s,
        region_basis_type: basis,
        complex_id: basis === 'complex' ? s.complex_id : '',
        region_id: basis === 'dong' ? s.region_id : s.region_id || registerState.region_id,
      }));
      await saveAndNavigate(registerState, 'location', '/register/lesson');
    });
  });
}
