import { registerState, PERSONAL_GENDER_OPTIONS, getTutorUnits } from '../state.js';
import { syncBasicFromForm } from '../form-collect.js';
import { saveAndNavigate, withSaving } from '../save-flow.js';
import {
  renderRegisterShell,
  renderSectionTitle,
  renderNavButtons,
  renderGuideNotice,
  mypageRegistrationsUrl,
  bindGlobalEvents,
  isRegisterEditMode,
  getHashQuery,
  navigate,
} from '../layout.js';
import { renderMainSubjectSelect } from '../../../shared/main-subjects.js';
import {
  getCityUnits,
  renderTutorRegionSlot,
  bindTutorRegionSlotEvents,
  collectTutorRegionSlots,
  validateTutorActivityRegions,
} from '../../../shared/tutor-region-slots.js';
import { bindInputFill } from '../../../shared/input-fill.js';

function radios(name, options, selected) {
  return options
    .map(
      (o) => `
    <label class="form-radio">
      <input type="radio" name="${name}" value="${o.value}" ${selected === o.value ? 'checked' : ''} />
      <span class="form-radio__label">${o.label}</span>
    </label>`,
    )
    .join('');
}

function returnFromEdit() {
  const raw = getHashQuery().get('return_to');
  if (raw) {
    window.location.assign(decodeURIComponent(raw));
    return true;
  }
  return false;
}

function ensureThreeSlots() {
  const slots = Array.isArray(registerState.saved_regions) ? [...registerState.saved_regions] : [];
  while (slots.length < 3) {
    slots.push({ region_id: '', scope_type: 'city', is_primary: slots.length === 0 });
  }
  if (!slots.some((s) => s.is_primary)) slots[0].is_primary = true;
  registerState.saved_regions = slots.slice(0, 3);
}

/** 기본등록 = 표시명·과목·성별 + 과외지역(광역시 / 도의 시·군) 한 화면 */
export function renderBasic() {
  const s = registerState;
  const editing = isRegisterEditMode();
  ensureThreeSlots();
  const units = getCityUnits(getTutorUnits());

  const content = `
    <form data-form="basic">
      ${renderGuideNotice(
        editing
          ? '기본정보와 과외지역을 한 화면에서 수정합니다. 저장하면 마이페이지로 돌아갑니다.'
          : '표시명·주력과목과 과외지역을 함께 등록합니다. 광역시는 시 전체, 도는 시·군까지 선택합니다.',
      )}
      <div class="register-grid-2">
        <div class="register-basic-col">
          ${renderSectionTitle('기본정보')}
          <div class="register-basic-fields">
            <div class="form-group">
              <label class="form-label form-label--required" for="tutor_display_name">표시명</label>
              <input class="form-input" id="tutor_display_name" name="tutor_display_name" value="${s.tutor_display_name}" required />
            </div>
            <div class="form-group">
              <label class="form-label form-label--required" for="main_subject_note">주력과목 1개</label>
              <select class="form-input" id="main_subject_note" name="main_subject_note" required>
                ${renderMainSubjectSelect(s.main_subject_note)}
              </select>
            </div>
            <div class="form-group form-group--full">
              <span class="form-label form-label--required">과외쌤 성별</span>
              <div class="form-radio-group">${radios('gender', PERSONAL_GENDER_OPTIONS, s.gender || 'male')}</div>
            </div>
          </div>
        </div>
        <div class="register-basic-col">
          ${renderSectionTitle('과외지역')}
          <p class="form-note" style="margin-top:0;">최대 3곳 · 대표 1곳 필수. 광역시는 시 전체, 도는 시·군 단위입니다.</p>
          ${s.saved_regions.map((slot, i) => renderTutorRegionSlot(slot, i, units)).join('')}
        </div>
      </div>
      ${
        editing
          ? ''
          : `<a class="register-mypage-link" href="${mypageRegistrationsUrl()}">이미 등록한 내용을 수정하려면 마이페이지 · 내 등록</a>`
      }
      ${renderNavButtons(null, editing ? '저장하고 돌아가기' : '다음: 수업·가격')}
    </form>`;
  return renderRegisterShell(content, {
    stepKey: 'basic',
    title: editing ? '기본정보' : '과외쌤 기본등록',
    subtitle: '기본정보와 과외지역을 한 화면에서 입력합니다.',
  });
}

export function bindBasicEvents(root) {
  bindGlobalEvents(root);
  const units = getCityUnits(getTutorUnits());
  bindTutorRegionSlotEvents(root, units);
  bindInputFill(root.querySelector('[data-form="basic"]'));

  const nextBtn = root.querySelector('[data-action="next"]');
  nextBtn?.addEventListener('click', () => {
    withSaving(nextBtn, async () => {
      const form = root.querySelector('[data-form="basic"]');
      syncBasicFromForm(form, registerState);
      if (!String(registerState.main_subject_note || '').trim()) {
        alert('주력과목을 선택해 주세요.');
        return;
      }

      registerState.saved_regions = collectTutorRegionSlots(root);
      const checked = validateTutorActivityRegions(registerState.saved_regions);
      if (!checked.ok) {
        alert(checked.message);
        return;
      }

      await saveAndNavigate(registerState, 'basic', null);
      registerState.basicComplete = true;

      if (isRegisterEditMode()) {
        if (!returnFromEdit()) navigate('/register/lesson');
        return;
      }
      navigate('/register/lesson');
    });
  });
}

/** @deprecated regions 단독 화면 — basic으로 통합 */
export function renderRegions() {
  const q = window.location.hash.includes('?')
    ? window.location.hash.slice(window.location.hash.indexOf('?'))
    : '';
  navigate(`/register/basic${q}`);
  return renderBasic();
}

export function bindRegionsEvents(root) {
  bindBasicEvents(root);
}
