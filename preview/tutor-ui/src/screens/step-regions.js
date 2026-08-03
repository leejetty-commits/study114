import { registerState, getCities, getRegions } from '../state.js';
import { syncRegionsFromForm } from '../form-collect.js';
import { saveAndNavigate, withSaving } from '../save-flow.js';
import {
  renderRegisterShell,
  renderSectionTitle,
  renderNavButtons,
  renderGuideNotice,
  mypageRegistrationsUrl,
  bindGlobalEvents,
  navigate,
  isRegisterEditMode,
  getHashQuery,
} from '../layout.js';
import { buildSidoCityOptions, cityOptionsFromRegionLabels } from '../../../shared/korea-sidos.js';

function citySelectOptions(selected) {
  let cities = buildSidoCityOptions(getCities());
  if (!cities.length) {
    cities = cityOptionsFromRegionLabels(getRegions());
  }
  if (!cities.length) {
    cities = [{ id: '1', label: '서울특별시' }];
  }
  return [
    '<option value="">시·도 선택</option>',
    ...cities.map(
      (c) =>
        `<option value="${c.id}" ${String(selected) === String(c.id) ? 'selected' : ''}>${c.label}</option>`,
    ),
  ].join('');
}

function renderSlot(slot, idx) {
  const cls = slot.is_primary ? 'register-region-slot is-primary' : 'register-region-slot';
  return `
    <div class="${cls}" data-region-slot="${idx}">
      <div class="form-row" style="align-items:center;margin-bottom:var(--space-2);">
        <strong>과외지역 ${idx + 1}${idx === 0 ? ' (필수)' : ' (선택)'}</strong>
        <label class="form-check" style="margin-left:auto;">
          <input type="radio" name="is_primary" value="${idx}" ${slot.is_primary ? 'checked' : ''} />
          <span class="form-check__label">대표</span>
        </label>
      </div>
      <div class="form-group">
        <label class="form-label">과외지역 (시·도)</label>
        <select class="form-input" data-field="region_id">
          ${citySelectOptions(slot.region_id)}
        </select>
        <input type="hidden" data-field="scope_type" value="city" />
      </div>
      <p class="register-hint">시·도 단위로 등록합니다. 더 좁은 범위는 검색·마이페이지에서 다룹니다.</p>
    </div>`;
}

function returnFromEdit() {
  const raw = getHashQuery().get('return_to');
  if (raw) {
    window.location.assign(decodeURIComponent(raw));
    return true;
  }
  return false;
}

export function renderRegions() {
  const editing = isRegisterEditMode();
  const content = `
    ${renderGuideNotice(
      editing
        ? '과외지역을 수정한 뒤 저장하면 마이페이지로 돌아갑니다.'
        : '과외지역은 최대 3곳까지 고를 수 있습니다. 대표 지역 1곳은 꼭 지정해 주세요.',
    )}
    <form data-form="regions">
      ${renderSectionTitle('과외지역')}
      ${registerState.saved_regions.map((slot, i) => renderSlot(slot, i)).join('')}
      ${
        editing
          ? ''
          : `<a class="register-mypage-link" href="${mypageRegistrationsUrl()}">이미 등록한 내용을 수정하려면 마이페이지 · 내 등록</a>`
      }
      ${renderNavButtons('/register/basic', editing ? '저장하고 돌아가기' : '다음: 수업·가격')}
    </form>`;
  return renderRegisterShell(content, {
    stepKey: 'regions',
    title: editing ? '과외지역 수정' : '과외지역',
    subtitle: '전국 시·도 목록에서 1곳 이상 선택합니다.',
  });
}

export function bindRegionsEvents(root) {
  bindGlobalEvents(root);
  const nextBtn = root.querySelector('[data-action="next"]');
  const prevBtn = root.querySelector('[data-action="prev"]');
  prevBtn?.addEventListener('click', () => {
    const ret = getHashQuery().get('return_to') || '';
    const q = isRegisterEditMode() ? `?edit=1&return_to=${encodeURIComponent(ret)}` : '';
    navigate(`/register/basic${q}`);
  });
  nextBtn?.addEventListener('click', () => {
    withSaving(nextBtn, async () => {
      syncRegionsFromForm(root, registerState);
      registerState.saved_regions = registerState.saved_regions.map((s) => ({
        ...s,
        scope_type: 'city',
      }));
      const filled = registerState.saved_regions.filter((s) => s.region_id);
      if (!filled.length) {
        alert('과외지역을 1곳 이상 선택해 주세요.');
        return;
      }
      if (isRegisterEditMode()) {
        await saveAndNavigate(registerState, 'regions', null);
        registerState.basicComplete = true;
        if (!returnFromEdit()) {
          navigate('/register/lesson');
        }
        return;
      }
      await saveAndNavigate(registerState, 'regions', '/register/lesson');
      registerState.basicComplete = true;
    });
  });
}
