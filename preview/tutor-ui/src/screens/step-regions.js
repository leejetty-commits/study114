import { registerState, getRegions } from '../state.js';
import { syncRegionsFromForm } from '../form-collect.js';
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
  return getRegions()
    .map((r) => `<option value="${r.id}" ${String(selected) === String(r.id) ? 'selected' : ''}>${r.label}</option>`)
    .join('');
}

function renderSlot(slot, idx) {
  const cls = slot.is_primary ? 'register-region-slot is-primary' : 'register-region-slot';
  return `
    <div class="${cls}" data-region-slot="${idx}">
      <div class="form-row" style="align-items:center;margin-bottom:var(--space-2);">
        <strong>활동 지역 ${idx + 1}</strong>
        <label class="form-check" style="margin-left:auto;">
          <input type="radio" name="is_primary" value="${idx}" ${slot.is_primary ? 'checked' : ''} />
          <span class="form-check__label">대표지역</span>
        </label>
      </div>
      <div class="form-group">
        <label class="form-label">지역</label>
        <span class="field-db-name">tutor_regions.region_id</span>
        <select class="form-input" data-field="region_id">${regionOptions(slot.region_id)}</select>
      </div>
      <div class="form-group">
        <label class="form-label">범위</label>
        <span class="field-db-name">tutor_regions.scope_type</span>
        <select class="form-input" data-field="scope_type">
          <option value="city" ${slot.scope_type === 'city' ? 'selected' : ''}>시</option>
          <option value="district" ${slot.scope_type === 'district' ? 'selected' : ''}>구군</option>
          <option value="metro" ${slot.scope_type === 'metro' ? 'selected' : ''}>광역</option>
        </select>
      </div>
    </div>`;
}

export function renderRegions() {
  const content = `
    ${renderTempNotice('활동 지역 API 마스터 연동 · 최대 3 · 대표 1')}
    <form data-form="regions">
      ${renderSectionTitle('활동 지역 (tutor_regions)')}
      ${registerState.saved_regions.map((slot, i) => renderSlot(slot, i)).join('')}
      ${renderNavButtons('/register/basic', '다음: 과목·가격')}
    </form>`;
  return renderRegisterShell(content, { step: 2, title: '활동 지역', subtitle: '8장 §6 · 홈 상단 시 탭 기준' });
}

export function bindRegionsEvents(root) {
  bindGlobalEvents(root);
  const nextBtn = root.querySelector('[data-action="next"]');
  const prevBtn = root.querySelector('[data-action="prev"]');
  prevBtn?.addEventListener('click', () => navigate('/register/basic'));
  nextBtn?.addEventListener('click', () => {
    withSaving(nextBtn, async () => {
      syncRegionsFromForm(root, registerState);
      await saveAndNavigate(registerState, 'regions', '/register/lesson');
    });
  });
}
