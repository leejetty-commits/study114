import { registerState, DUMMY_REGIONS, DUMMY_COMPLEXES } from '../state.js';
import {
  renderRegisterShell,
  renderSectionTitle,
  renderNavButtons,
  renderTempNotice,
  bindGlobalEvents,
  bindFormNav,
} from '../layout.js';

function regionOptions(selected) {
  return DUMMY_REGIONS.map(
    (r) => `<option value="${r.id}" ${String(selected) === String(r.id) ? 'selected' : ''}>${r.label}</option>`
  ).join('');
}

function complexOptions(regionId, selected) {
  const list = DUMMY_COMPLEXES.filter((c) => String(c.region_id) === String(regionId));
  return `<option value="">— 동 기준 —</option>${list
    .map(
      (c) =>
        `<option value="${c.id}" ${String(selected) === String(c.id) ? 'selected' : ''}>${c.label}</option>`
    )
    .join('')}`;
}

function renderSavedRegion(slot, idx) {
  const cls = slot.is_primary ? 'register-region-slot is-primary' : 'register-region-slot';
  return `
    <div class="${cls}" data-region-slot="${idx}">
      <div class="form-row" style="align-items:center;margin-bottom:var(--space-2);">
        <strong>저장 지역 ${idx + 1}</strong>
        <label class="form-check" style="margin-left:auto;">
          <input class="form-check__input" type="radio" name="is_primary" value="${idx}" ${slot.is_primary ? 'checked' : ''} data-field="is_primary" />
          <span class="form-check__label">대표지역</span>
        </label>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">동</label>
          <span class="field-db-name">study_room_regions.region_id</span>
          <select class="form-input" data-field="region_id">${regionOptions(slot.region_id)}</select>
        </div>
        <div class="form-group">
          <label class="form-label">단지 (선택)</label>
          <span class="field-db-name">study_room_regions.complex_id</span>
          <select class="form-input" data-field="complex_id">${complexOptions(slot.region_id, slot.complex_id)}</select>
        </div>
      </div>
      <p class="register-hint">단지 있음 → 단지 우선 · 없으면 동(빌라 포함)</p>
    </div>
  `;
}

export function renderLocation() {
  const s = registerState;
  const content = `
    ${renderTempNotice('지역 검색 API · 지도 좌표는 추후 연동')}
    <form data-form="location">
      ${renderSectionTitle('공부방 기본 위치')}
      <p class="register-hint mb-4">study_rooms.region_id / complex_id — 공부방 기본 위치 (5장 §7)</p>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label form-label--required" for="region_id">동</label>
          <span class="field-db-name">region_id</span>
          <select class="form-input" id="region_id" name="region_id">${regionOptions(s.region_id)}</select>
        </div>
        <div class="form-group">
          <label class="form-label" for="complex_id">단지</label>
          <span class="field-db-name">complex_id</span>
          <select class="form-input" id="complex_id" name="complex_id">${complexOptions(s.region_id, s.complex_id)}</select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="address_text">주소 요약</label>
        <span class="field-db-name">address_text</span>
        <input class="form-input" id="address_text" name="address_text" value="${s.address_text}" />
      </div>

      ${renderSectionTitle('노출/활동 저장 지역 (최대 3 · 대표 1)')}
      <p class="register-hint mb-4">study_room_regions — 로그인 후 지도/핀/메인 노출 기준</p>
      ${s.saved_regions.map((slot, i) => renderSavedRegion(slot, i)).join('')}

      ${renderNavButtons('/register/basic', '다음: 수업·가격')}
    </form>
  `;
  return renderRegisterShell(content, {
    step: 2,
    title: '위치 · 저장 지역',
    subtitle: '기본 위치와 노출 지역은 분리 (5장 §7)',
  });
}

export function bindLocationEvents(root) {
  bindGlobalEvents(root);
  bindFormNav(root, '/register/basic', '/register/lesson');

  root.querySelector('#region_id')?.addEventListener('change', (e) => {
    registerState.region_id = e.target.value;
    const complexEl = root.querySelector('#complex_id');
    if (complexEl) {
      complexEl.innerHTML = complexOptions(registerState.region_id, '');
    }
  });
}
