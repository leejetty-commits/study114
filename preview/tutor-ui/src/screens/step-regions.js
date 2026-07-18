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

/**
 * 활동지역 = 시 단위만 (구·동·광역 입력 금지)
 * region 마스터 라벨에서 시·도만 추출해 옵션화
 */
function cityOptionsFromRegions(selected) {
  const seen = new Map();
  getRegions().forEach((r) => {
    const sido = String(r.label || '')
      .trim()
      .split(/\s+/)[0];
    if (!sido || seen.has(sido)) return;
    seen.set(sido, { id: String(r.id), label: sido });
  });
  if (!seen.size) {
    seen.set('서울특별시', { id: '1', label: '서울특별시' });
  }
  return [...seen.values()]
    .map(
      (c) =>
        `<option value="${c.id}" ${String(selected) === String(c.id) ? 'selected' : ''}>${c.label}</option>`,
    )
    .join('');
}

function renderSlot(slot, idx) {
  const cls = slot.is_primary ? 'register-region-slot is-primary' : 'register-region-slot';
  return `
    <div class="${cls}" data-region-slot="${idx}">
      <div class="form-row" style="align-items:center;margin-bottom:var(--space-2);">
        <strong>활동 시 ${idx + 1}${idx === 0 ? ' (필수)' : ' (선택)'}</strong>
        <label class="form-check" style="margin-left:auto;">
          <input type="radio" name="is_primary" value="${idx}" ${slot.is_primary ? 'checked' : ''} />
          <span class="form-check__label">대표</span>
        </label>
      </div>
      <div class="form-group">
        <label class="form-label">활동 시</label>
        <span class="field-db-name">tutor_regions.region_id · scope_type=city</span>
        <select class="form-input" data-field="region_id">
          <option value="">선택</option>
          ${cityOptionsFromRegions(slot.region_id)}
        </select>
        <input type="hidden" data-field="scope_type" value="city" />
      </div>
      <p class="register-hint">시 단위만 등록합니다. 더 좁은 범위는 받지 않으며, 광역 확장은 검색·마이페이지에서 처리합니다.</p>
    </div>`;
}

export function renderRegions() {
  const content = `
    ${renderTempNotice('활동 지역 · 시 단위만 · 최대 3 · 대표 1')}
    <form data-form="regions">
      ${renderSectionTitle('활동 지역 (tutor_regions · city only)')}
      ${registerState.saved_regions.map((slot, i) => renderSlot(slot, i)).join('')}
      ${renderNavButtons('/register/basic', '다음: 과목·가격')}
    </form>`;
  return renderRegisterShell(content, {
    step: 2,
    title: '활동 지역',
    subtitle: '시 기준 1필수 + 추가 2 · 홈 상단 전환',
  });
}

export function bindRegionsEvents(root) {
  bindGlobalEvents(root);
  const nextBtn = root.querySelector('[data-action="next"]');
  const prevBtn = root.querySelector('[data-action="prev"]');
  prevBtn?.addEventListener('click', () => navigate('/register/basic'));
  nextBtn?.addEventListener('click', () => {
    withSaving(nextBtn, async () => {
      syncRegionsFromForm(root, registerState);
      registerState.saved_regions = registerState.saved_regions.map((s) => ({
        ...s,
        scope_type: 'city',
      }));
      const filled = registerState.saved_regions.filter((s) => s.region_id);
      if (!filled.length) {
        alert('활동 시를 1곳 이상 선택해 주세요.');
        return;
      }
      await saveAndNavigate(registerState, 'regions', '/register/lesson');
    });
  });
}
