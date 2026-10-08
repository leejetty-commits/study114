import { registerState, getTutorUnits } from '../state.js';
import { syncBasicFromForm } from '../form-collect.js';
import { saveAndNavigate, withSaving } from '../save-flow.js';
import { SCHOOL_LEVEL_FORM_OPTIONS } from '../../../shared/school-grade.js';
import { wonToCheonwonInput } from '../../../shared/fee-cheonwon.js';
import { lessonDurationOptions, lessonDurationSelectValue } from '../../../shared/lesson-duration-options.js';
import { lessonWeeklyOptions, lessonWeeklySelectValue } from '../../../shared/lesson-weekly-options.js';
import { TUTOR_SLOGAN_MAX, tutorBasicMissing, tutorBasicMissingMessage } from '../../../shared/tutor-basic-fields.js';
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

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function renderSelect(options, selected) {
  const current = String(selected ?? '');
  return [
    '<option value="">선택해 주세요</option>',
    ...options.map(
      (o) => `<option value="${o.value}" ${current === String(o.value) ? 'selected' : ''}>${o.label}</option>`,
    ),
  ].join('');
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

/** 기본등록 8개(shared/tutor-basic-fields.js) 한 화면. 과외지역 2·3번만 선택 */
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
          : '베이직카드에 나오는 기본정보와 과외지역을 함께 등록합니다. 광역시는 시 전체, 도는 시·군까지 선택합니다.',
      )}
      <div class="register-grid-2">
        <div class="register-basic-col">
          ${renderSectionTitle('기본정보')}
          <div class="register-basic-fields">
            <div class="form-group">
              <label class="form-label" for="tutor_display_name">표시명</label>
              <input class="form-input" id="tutor_display_name" name="tutor_display_name" value="${esc(s.tutor_display_name)}" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="school_level">대상(학교급)</label>
              <select class="form-input" id="school_level" name="school_level" required>${renderSelect(SCHOOL_LEVEL_FORM_OPTIONS, s.school_level)}</select>
            </div>
            <div class="form-group">
              <label class="form-label" for="main_subject_note">주력과목 1개</label>
              <select class="form-input" id="main_subject_note" name="main_subject_note" required>
                ${renderMainSubjectSelect(s.main_subject_note)}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="preferred_fee_amount">월 과외비 (천원)</label>
              <input class="form-input" type="number" id="preferred_fee_amount" name="preferred_fee_amount" value="${wonToCheonwonInput(s.preferred_fee_amount)}" min="1" step="1" inputmode="numeric" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="lessons_per_week">주 회수</label>
              <select class="form-input" id="lessons_per_week" name="lessons_per_week" required>${renderSelect(lessonWeeklyOptions(s.lessons_per_week), lessonWeeklySelectValue(s.lessons_per_week))}</select>
            </div>
            <div class="form-group">
              <label class="form-label" for="minutes_per_lesson">1회 수업시간</label>
              <select class="form-input" id="minutes_per_lesson" name="minutes_per_lesson" required>${renderSelect(lessonDurationOptions(s.minutes_per_lesson), lessonDurationSelectValue(s.minutes_per_lesson))}</select>
            </div>
            <div class="form-group form-group--full">
              <label class="form-label" for="slogan">슬로건</label>
              <input class="form-input" id="slogan" name="slogan" maxlength="${TUTOR_SLOGAN_MAX}" value="${esc(s.slogan)}" placeholder="한 줄로 소개해 주세요" required />
            </div>
          </div>
        </div>
        <div class="register-basic-col">
          ${renderSectionTitle('과외지역')}
          <p class="form-note" style="margin-top:0;">최대 3곳 · 지역 1이 대표입니다. 광역시는 시 전체, 도는 시·군 단위입니다.</p>
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

      registerState.saved_regions = collectTutorRegionSlots(root);
      const checked = validateTutorActivityRegions(registerState.saved_regions);
      if (!checked.ok) {
        alert(checked.message);
        return;
      }

      const missing = tutorBasicMissing({ ...registerState, has_primary_region: true });
      if (missing.length) {
        alert(tutorBasicMissingMessage(missing));
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
