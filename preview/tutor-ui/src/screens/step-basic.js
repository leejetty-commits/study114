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
import { bindDraggableDialog } from '../../../shared/draggable-dialog.js';

let basicEditOpen = false;
/** @type {string} */
let basicEditFocus = '';

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

function optionLabel(options, value) {
  const current = String(value ?? '').trim();
  return options.find((o) => String(o.value) === current)?.label || current;
}

function regionOverviewValue(units) {
  const slots = Array.isArray(registerState.saved_regions) ? registerState.saved_regions : [];
  return slots
    .map((slot) => {
      const id = String(slot?.region_id || '').trim();
      if (!id) return '';
      return units.find((unit) => unit.id === id)?.label || '';
    })
    .filter(Boolean)
    .join('\n');
}

/** 현황에 보이는 8개. 항목을 더하거나 빼지 않는다. */
function overviewRows(units) {
  const s = registerState;
  const fee = wonToCheonwonInput(s.preferred_fee_amount);
  return [
    { label: '표시명', value: s.tutor_display_name, focus: 'tutor_display_name' },
    { label: '대상', value: optionLabel(SCHOOL_LEVEL_FORM_OPTIONS, s.school_level), focus: 'school_level' },
    { label: '주력과목', value: s.main_subject_note, focus: 'main_subject_note' },
    { label: '월 과외비', value: fee ? `${fee}천원` : '', focus: 'preferred_fee_amount' },
    { label: '주 회수', value: optionLabel(lessonWeeklyOptions(s.lessons_per_week), lessonWeeklySelectValue(s.lessons_per_week)), focus: 'lessons_per_week' },
    { label: '1회 시간', value: optionLabel(lessonDurationOptions(s.minutes_per_lesson), lessonDurationSelectValue(s.minutes_per_lesson)), focus: 'minutes_per_lesson' },
    { label: '슬로건', value: s.slogan, focus: 'slogan' },
    { label: '과외지역', value: regionOverviewValue(units), focus: 'tutor-region-0', multiline: true },
  ];
}

function overviewRowHtml(row) {
  const empty = !String(row.value ?? '').trim();
  const valueHtml = row.multiline ? esc(row.value).replace(/\n/g, '<br />') : esc(row.value);
  return `
    <div class="register-overview__row${empty ? ' is-empty' : ' is-filled'}" data-action="edit-basic" data-focus="${esc(row.focus)}" role="button" tabindex="0">
      <dt>${esc(row.label)}</dt>
      <dd><span>${valueHtml || '—'}</span></dd>
    </div>`;
}

function renderBasicFields(units) {
  const s = registerState;
  return `
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
    </div>`;
}

function renderOverview(units) {
  const rows = overviewRows(units).map(overviewRowHtml).join('');
  return `
    <div class="register-overview">
      <div class="register-basic-complete-gate" data-basic-complete-gate>
        <p class="register-basic-complete-gate__msg">기본정보는 모두 입력되어 있습니다. 수정이 필요하면 버튼을 눌러 주세요.</p>
        <div class="register-basic-complete-gate__actions">
          <button type="button" class="btn btn--secondary" data-action="edit-basic">기본정보 수정하기</button>
          <button type="button" class="btn btn--primary" data-action="to-detail">상세정보로 이동</button>
        </div>
      </div>
      <details class="register-overview__fold">
        <summary>기본정보 현황 보기</summary>
        <dl class="register-overview__dl">${rows}</dl>
      </details>
    </div>`;
}

function renderBasicEditModal(units) {
  return `
    <div class="register-edit-overlay" data-basic-edit-overlay>
      <div class="register-edit-dialog register-edit-dialog--wide" role="dialog" aria-modal="true" aria-labelledby="basic-edit-title">
        <div class="register-edit-dialog__head">
          <h2 id="basic-edit-title" class="register-edit-dialog__title">기본정보 수정</h2>
          <button type="button" class="register-edit-dialog__close" data-action="cancel-edit" aria-label="닫기">×</button>
        </div>
        <form data-form="basic" class="register-edit-dialog__body">
          ${renderBasicFields(units)}
        </form>
        <div class="register-edit-dialog__foot">
          <button type="button" class="btn btn--secondary" data-action="cancel-edit">취소</button>
          <button type="button" class="btn btn--primary" data-action="save-basic">저장</button>
        </div>
      </div>
    </div>`;
}

function renderBasicForm(editing, units) {
  return `
    <form data-form="basic">
      ${renderGuideNotice(
        editing
          ? '기본정보와 과외지역을 한 화면에서 수정합니다. 저장하면 마이페이지로 돌아갑니다.'
          : '베이직카드에 나오는 기본정보와 과외지역을 함께 등록합니다. 광역시는 시 전체, 도는 시·군까지 선택합니다.',
      )}
      ${renderBasicFields(units)}
      ${
        editing
          ? ''
          : `<a class="register-mypage-link" href="${mypageRegistrationsUrl()}">이미 등록한 내용을 수정하려면 마이페이지 · 내 등록</a>`
      }
      ${renderNavButtons(null, editing ? '저장하고 돌아가기' : '다음: 수업·가격')}
    </form>`;
}

/** 기본등록 8개(shared/tutor-basic-fields.js) 한 화면. 끝난 사람은 현황, 안 끝난 사람은 입력 폼. */
export function renderBasic() {
  const editing = isRegisterEditMode();
  ensureThreeSlots();
  const units = getCityUnits(getTutorUnits());
  const showOverview = registerState.basicComplete && !editing;
  document.body.classList.toggle('register-edit-open', showOverview && basicEditOpen);
  const content = showOverview
    ? `${renderOverview(units)}${basicEditOpen ? renderBasicEditModal(units) : ''}`
    : renderBasicForm(editing, units);
  return renderRegisterShell(content, {
    stepKey: 'basic',
    title: showOverview ? '과외쌤 기본정보' : editing ? '기본정보' : '과외쌤 기본등록',
    subtitle: showOverview ? '저장된 기본정보를 확인하고, 필요한 항목만 수정합니다.' : '기본정보와 과외지역을 한 화면에서 입력합니다.',
  });
}

function onEditEscape(e) {
  if (e.key === 'Escape') closeBasicEdit();
}

function closeBasicEdit() {
  document.removeEventListener('keydown', onEditEscape);
  basicEditOpen = false;
  basicEditFocus = '';
  document.body.classList.remove('register-edit-open');
  window.dispatchEvent(new Event('hashchange'));
}

function openBasicEdit(focus) {
  basicEditFocus = focus || '';
  basicEditOpen = true;
  window.dispatchEvent(new Event('hashchange'));
}

async function saveBasicForm(root) {
  const form = root.querySelector('[data-form="basic"]');
  syncBasicFromForm(form, registerState);
  registerState.saved_regions = collectTutorRegionSlots(root);
  const checked = validateTutorActivityRegions(registerState.saved_regions);
  if (!checked.ok) {
    alert(checked.message);
    return false;
  }
  const missing = tutorBasicMissing({ ...registerState, has_primary_region: true });
  if (missing.length) {
    alert(tutorBasicMissingMessage(missing));
    return false;
  }
  await saveAndNavigate(registerState, 'basic', null);
  registerState.basicComplete = true;
  return true;
}

export function bindBasicEvents(root) {
  bindGlobalEvents(root);
  const units = getCityUnits(getTutorUnits());
  bindTutorRegionSlotEvents(root, units);
  bindInputFill(root.querySelector('[data-form="basic"]'));

  root.querySelectorAll('[data-action="to-detail"]').forEach((btn) => {
    btn.addEventListener('click', () => navigate('/register/lesson'));
  });

  root.querySelectorAll('[data-action="edit-basic"]').forEach((el) => {
    const open = () => openBasicEdit(el.getAttribute('data-focus') || '');
    el.addEventListener('click', open);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });
  });

  const nextBtn = root.querySelector('[data-action="next"]');
  nextBtn?.addEventListener('click', () => {
    withSaving(nextBtn, async () => {
      const ok = await saveBasicForm(root);
      if (!ok) return;
      if (isRegisterEditMode()) {
        if (!returnFromEdit()) navigate('/register/lesson');
        return;
      }
      navigate('/register/lesson');
    });
  });

  const overlay = root.querySelector('[data-basic-edit-overlay]');
  if (!overlay) return;

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeBasicEdit();
  });
  overlay.querySelectorAll('[data-action="cancel-edit"]').forEach((btn) => {
    btn.addEventListener('click', () => closeBasicEdit());
  });
  bindDraggableDialog(
    overlay.querySelector('.register-edit-dialog'),
    overlay.querySelector('.register-edit-dialog__head'),
  );
  document.removeEventListener('keydown', onEditEscape);
  document.addEventListener('keydown', onEditEscape);
  if (basicEditFocus === 'tutor-region-0') {
    root.querySelector('[data-region-slot="0"] select')?.focus();
  } else if (basicEditFocus) {
    root.querySelector(`#${CSS.escape(basicEditFocus)}`)?.focus();
  }

  const saveBtn = overlay.querySelector('[data-action="save-basic"]');
  saveBtn?.addEventListener('click', () => {
    withSaving(saveBtn, async () => {
      const ok = await saveBasicForm(root);
      if (!ok) return;
      closeBasicEdit();
    }).catch(() => {
      /* withSaving이 이미 알린다. 실패하면 창을 닫지 않는다. */
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
