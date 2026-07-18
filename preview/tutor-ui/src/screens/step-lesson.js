import {
  registerState,
  SCHOOL_LEVELS,
  FEE_BASIS_OPTIONS,
  TUTOR_PLACE_OPTIONS,
  GENDER_GROUP_OPTIONS,
  STUDENT_COUNT_OPTIONS,
  AGE_BAND_OPTIONS,
  emptySubject,
} from '../state.js';
import { syncLessonFromForm } from '../form-collect.js';
import { saveAndNavigate, withSaving } from '../save-flow.js';
import { renderRegisterShell, renderNavButtons, bindGlobalEvents, navigate } from '../layout.js';

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
  const levels = SCHOOL_LEVELS.map(
    (l) => `<option value="${l.value}" ${sub.school_level === l.value ? 'selected' : ''}>${l.label}</option>`,
  ).join('');
  return `
    <div class="register-subject-row" data-subject-idx="${idx}">
      <select class="form-input" data-field="school_level">${levels}</select>
      <input class="form-input" data-field="grade_band" value="${sub.grade_band}" placeholder="학년대" />
      <input class="form-input" data-field="subject_name" value="${sub.subject_name}" placeholder="과목명" />
      <label class="form-check"><input type="checkbox" data-field="is_primary" ${sub.is_primary ? 'checked' : ''} /> 주력</label>
    </div>`;
}

export function renderLesson() {
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

  const content = `
    <form data-form="lesson">
      <p class="register-hint mb-4">상세등록 본체 · 기본등록 seed(표시명·주력과목)는 같은 필드를 이어서 편집합니다.</p>
      <div class="form-group">
        <label class="form-label form-label--required" for="main_subject_note">주력과목 요약</label>
        <span class="field-db-name">main_subject_note</span>
        <input class="form-input" id="main_subject_note" name="main_subject_note" value="${s.main_subject_note}" />
      </div>
      <div class="form-group">
        <span class="form-label form-label--required">지도 대상 성별</span>
        <span class="field-db-name">student_gender_group</span>
        <div class="form-radio-group">${radios('student_gender_group', GENDER_GROUP_OPTIONS, s.student_gender_group)}</div>
      </div>
      <div class="form-group">
        <span class="form-label form-label--required">수업인원</span>
        <span class="field-db-name">student_count_group</span>
        <div class="form-radio-group">${radios('student_count_group', STUDENT_COUNT_OPTIONS, s.student_count_group)}</div>
      </div>
      <div class="form-group">
        <span class="form-label">연령대</span>
        <span class="field-db-name">age_band</span>
        <div class="form-radio-group">${radios('age_band', AGE_BAND_OPTIONS, s.age_band)}</div>
      </div>
      <div data-subjects-list>${s.subjects.map(subjectRow).join('')}</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label form-label--required" for="preferred_fee_amount">월 대표 과외비</label>
          <span class="field-db-name">preferred_fee_amount</span>
          <input class="form-input" type="number" id="preferred_fee_amount" name="preferred_fee_amount" value="${s.preferred_fee_amount}" />
        </div>
        <div class="form-group">
          <span class="form-label form-label--required">산정방식</span>
          <span class="field-db-name">fee_basis_type</span>
          <div class="form-radio-group">${feeBasis}</div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">주 횟수</label><input class="form-input" name="lessons_per_week" value="${s.lessons_per_week}" /></div>
        <div class="form-group"><label class="form-label">월 총 횟수</label><input class="form-input" name="monthly_session_count" value="${s.monthly_session_count}" /></div>
        <div class="form-group"><label class="form-label">1회(분)</label><input class="form-input" name="minutes_per_lesson" value="${s.minutes_per_lesson}" /></div>
      </div>
      <div class="form-group">
        <label class="form-label" for="fee_description">가격 설명</label>
        <textarea class="form-input form-textarea" name="fee_description" rows="2">${s.fee_description}</textarea>
      </div>
      <div class="form-group">
        <span class="form-label form-label--required">강의장소</span>
        <span class="field-db-name">tutor_lesson_places</span>
        <div class="register-check-grid">${places}</div>
      </div>
      ${renderNavButtons('/register/regions', '다음: 학력·경력')}
    </form>`;
  return renderRegisterShell(content, { step: 3, title: '과목 · 가격 · 장소', subtitle: '8장 §4 · 카드 월금액+주횟수+1회시간' });
}

export function bindLessonEvents(root) {
  bindGlobalEvents(root);
  const nextBtn = root.querySelector('[data-action="next"]');
  root.querySelector('[data-action="prev"]')?.addEventListener('click', () => navigate('/register/regions'));
  nextBtn?.addEventListener('click', () => {
    withSaving(nextBtn, async () => {
      syncLessonFromForm(root.querySelector('[data-form="lesson"]'), registerState);
      await saveAndNavigate(registerState, 'lesson', '/register/career');
    });
  });
}
