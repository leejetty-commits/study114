import {
  registerState,
  FEE_BASIS_OPTIONS,
  TUTOR_PLACE_OPTIONS,
  GENDER_GROUP_OPTIONS,
  STUDENT_COUNT_OPTIONS,
  AGE_BAND_OPTIONS,
  emptySubject,
} from '../state.js';
import { syncLessonFromForm, validateLessonState } from '../form-collect.js';
import { SCHOOL_LEVEL_FORM_OPTIONS, gradeOptionHtml, bindSchoolGradePairs } from '../../../shared/school-grade.js';
import { lessonWeeklyLabel } from '../../../shared/lesson-weekly-options.js';
import { lessonMonthlyOptions, lessonMonthlySelectValue, lessonMonthlyOmitUntilTouched } from '../../../shared/lesson-monthly-options.js';
import { TUTOR_DETAIL_GROUP_LESSON } from '../../../shared/tutor-detail-fields.js';
import { saveAndNavigate, withSaving } from '../save-flow.js';
import { bindInputFill } from '../../../shared/input-fill.js';
import { s114Alert } from '../../../shared/confirm-dialog.js';
import {
  renderRegisterShell,
  renderSectionTitle,
  renderNavButtons,
  renderGuideNotice,
  mypageRegistrationsUrl,
  bindGlobalEvents,
  navigate,
  skipDetailRegistration,
} from '../layout.js';

function feeCountBox(s, embed) {
  const weeklyMode = s.fee_basis_type !== 'monthly_by_total_sessions';
  if (weeklyMode) {
    const shown = lessonWeeklyLabel(s.lessons_per_week) || '선택';
    const hint = embed ? '기본정보 탭에서 수정' : '마이페이지에서 수정';
    return `
      <div class="form-group" data-trc-field="lessons_per_week">
        <span class="form-label">주 회수</span>
        <p class="form-input form-input--readonly" aria-readonly="true">${shown}</p>
        <p class="form-hint">${hint}</p>
      </div>`;
  }
  const selected = lessonMonthlySelectValue(s.monthly_session_count);
  const omit = lessonMonthlyOmitUntilTouched(s.monthly_session_count) ? ' data-monthly-omit="1"' : '';
  const options = lessonMonthlyOptions()
    .map((o) => `<option value="${o.value}" ${o.value === selected ? 'selected' : ''}>${o.label}</option>`)
    .join('');
  return `
    <div class="form-group" data-trc-field="monthly_session_count">
      <label class="form-label" for="monthly_session_count">월 총 횟수</label>
      <select class="form-input" id="monthly_session_count" name="monthly_session_count"${omit}>${options}</select>
    </div>`;
}

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

function subjectRow(sub, idx) {
  const levels = SCHOOL_LEVEL_FORM_OPTIONS.map(
    (l) => `<option value="${l.value}" ${sub.school_level === l.value ? 'selected' : ''}>${l.label}</option>`,
  ).join('');
  const grade = gradeOptionHtml(sub.school_level, sub.grade_band);
  return `
    <div class="register-subject-row" data-subject-idx="${idx}" data-school-grade-pair>
      <label class="form-group">
        <span class="form-label">지도 학교급</span>
        <select class="form-input" data-field="school_level">${levels}</select>
      </label>
      <label class="form-group">
        <span class="form-label">지도 학년</span>
        <select class="form-input" data-field="grade_band"${grade.disabled ? ' disabled' : ''}>${grade.html}</select>
      </label>
      <input class="form-input" data-field="subject_name" value="${sub.subject_name}" placeholder="예: 미적분2, 확률과 통계" />
    </div>`;
}

/**
 * @param {{ includeStepNav?: boolean, includeFooterActions?: boolean, embed?: boolean }} [opts]
 * includeStepNav 기본값 true — 상세등록 화면과 같은 HTML.
 * embed 일 때만 가입 안내·마이페이지 링크를 숨긴다.
 */
export function renderLessonFormHtml(opts = {}) {
  const includeStepNav = opts.includeStepNav !== false;
  const includeFooterActions = opts.includeFooterActions ?? !includeStepNav;
  const embed = opts.embed === true;
  const s = registerState;
  const places = TUTOR_PLACE_OPTIONS.map(
    (p) => `
    <label class="form-check">
      <input type="checkbox" name="lesson_places" value="${p.value}" ${s.lesson_places.includes(p.value) ? 'checked' : ''} />
      <span class="form-check__label">${p.label}</span>
    </label>`,
  ).join('');
  const feeBasis = FEE_BASIS_OPTIONS.map(
    (o) => `
    <label class="form-radio">
      <input type="radio" name="fee_basis_type" value="${o.value}" ${s.fee_basis_type === o.value ? 'checked' : ''} />
      <span class="form-radio__label">${o.label}</span>
    </label>`,
  ).join('');

  const prevPath = s.basicComplete ? '/register/basic' : '/register/regions';
  const content = `
    <form data-form="lesson" class="tutor-lesson-step">
      ${embed ? '' : renderGuideNotice('상세등록 1단계입니다. 필수 항목을 채운 뒤 다음으로 진행하세요. 나중에 해도 됩니다.')}
      ${renderSectionTitle(TUTOR_DETAIL_GROUP_LESSON)}
      ${s.main_subject_note ? `<p class="form-hint">주력과목(기본등록): <strong>${s.main_subject_note}</strong>${embed ? ' · 기본정보 탭에서 수정' : ' · 마이페이지에서 수정'}</p>` : ''}
      <div class="register-grid-2">
        <div class="form-group" data-trc-field="student_target">
          <span class="form-label">지도 대상 성별</span>
          <div class="form-radio-group">${radios('student_gender_group', GENDER_GROUP_OPTIONS, s.student_gender_group)}</div>
        </div>
        <div class="form-group" data-trc-field="student_count_group">
          <span class="form-label">수업인원</span>
          <div class="form-radio-group">${radios('student_count_group', STUDENT_COUNT_OPTIONS, s.student_count_group)}</div>
        </div>
      </div>
      <div class="form-group" data-trc-field="age_band">
        <span class="form-label">과외쌤 연령대</span>
        <div class="form-radio-group">${radios('age_band', AGE_BAND_OPTIONS, s.age_band)}</div>
      </div>
      <div data-trc-field="subjects">
        <p class="form-hint">추가 과목 (선택)</p>
        <div data-subjects-list>${s.subjects.map(subjectRow).join('')}</div>
        <button type="button" class="btn btn--secondary btn--sm" data-action="add-subject">+ 과목 추가</button>
      </div>
      <div class="register-grid-2" style="margin-top:var(--space-4);">
        <div class="form-group" data-trc-field="fee_basis">
          <span class="form-label form-label--required">산정방식</span>
          <div class="form-radio-group">${feeBasis}</div>
        </div>
        ${feeCountBox(s, embed)}
      </div>
      <div class="form-group" data-trc-field="fee_description">
        <label class="form-label" for="fee_description">가격 설명</label>
        <textarea class="form-input form-textarea" name="fee_description" rows="2">${s.fee_description}</textarea>
      </div>
      <div class="form-group" data-trc-field="lesson_places">
        <span class="form-label">강의장소</span>
        <div class="register-check-grid">${places}</div>
      </div>
      ${embed ? '' : `<a class="register-mypage-link" href="${mypageRegistrationsUrl()}">표시명·과외지역·월 과외비·주 회수·1회 수업시간 등 기본정보는 마이페이지에서 수정</a>`}
      ${
        includeStepNav
          ? renderNavButtons(prevPath, '다음: 학력·연락', { skipLabel: '다음에 하기', showSave: true })
          : includeFooterActions
            ? `<div class="register-embed-actions">
              <button type="button" class="btn btn--primary" data-action="save">저장</button>
            </div>`
            : ''
      }
    </form>`;
  return content;
}

export function renderLesson() {
  const content = renderLessonFormHtml({ includeStepNav: true });
  return renderRegisterShell(content, {
    stepKey: 'lesson',
    title: '수업 · 가격',
    subtitle: '상세등록 1/2 · 학생에게 보이는 수업 정보를 적어 주세요.',
  });
}

/**
 * @param {HTMLElement} root
 * @param {{ embed?: boolean, onSaved?: () => void|Promise<void>, onRefresh?: () => void }} [opts]
 */
export function bindLessonEvents(root, opts = {}) {
  bindSchoolGradePairs(root);
  if (!opts.embed) bindGlobalEvents(root);
  const lessonForm = () => root.querySelector('[data-form="lesson"]');
  bindInputFill(lessonForm());
  root.querySelector('[data-form="lesson"] [data-action="prev"]')?.addEventListener('click', () => {
    syncLessonFromForm(lessonForm(), registerState);
    navigate(registerState.basicComplete ? '/register/basic' : '/register/regions');
  });
  root.querySelector('[data-form="lesson"] [data-action="skip-detail"]')?.addEventListener('click', () => skipDetailRegistration());
  lessonForm()?.querySelectorAll('[name="fee_basis_type"]').forEach((el) => {
    el.addEventListener('change', () => {
      syncLessonFromForm(lessonForm(), registerState);
      if (opts.onRefresh) opts.onRefresh();
      else window.dispatchEvent(new Event('hashchange'));
    });
  });
  lessonForm()?.querySelector('[name="monthly_session_count"]')?.addEventListener('change', (ev) => {
    if (ev.currentTarget instanceof HTMLSelectElement) ev.currentTarget.removeAttribute('data-monthly-omit');
  });
  root.querySelector('[data-form="lesson"] [data-action="add-subject"]')?.addEventListener('click', () => {
    if (opts.embed) syncLessonFromForm(lessonForm(), registerState);
    registerState.subjects.push(emptySubject());
    if (opts.onRefresh) opts.onRefresh();
    else window.dispatchEvent(new Event('hashchange'));
  });
  const nextBtn = root.querySelector('[data-form="lesson"] [data-action="next"]');
  nextBtn?.addEventListener('click', () => {
    withSaving(nextBtn, async () => {
      syncLessonFromForm(lessonForm(), registerState);
      const err = validateLessonState(registerState);
      if (err) {
        void s114Alert(err);
        return;
      }
      await saveAndNavigate(registerState, 'lesson', '/register/contact');
    });
  });
  const saveBtn = root.querySelector('[data-form="lesson"] [data-action="save"]');
  saveBtn?.addEventListener('click', () => {
    withSaving(saveBtn, async () => {
      syncLessonFromForm(lessonForm(), registerState);
      const err = validateLessonState(registerState);
      if (err) {
        void s114Alert(err);
        return;
      }
      await saveAndNavigate(registerState, 'lesson', null);
      if (opts.onSaved) await opts.onSaved();
    });
  });
}
