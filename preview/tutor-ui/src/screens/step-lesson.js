import {
  registerState,
  SCHOOL_LEVELS,
  GRADE_BAND_OPTIONS,
  FEE_BASIS_OPTIONS,
  TUTOR_PLACE_OPTIONS,
  GENDER_GROUP_OPTIONS,
  STUDENT_COUNT_OPTIONS,
  AGE_BAND_OPTIONS,
  emptySubject,
} from '../state.js';
import { syncLessonFromForm, validateLessonState } from '../form-collect.js';
import { saveAndNavigate, withSaving } from '../save-flow.js';
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
  const grades = [
    `<option value="">학년대</option>`,
    ...GRADE_BAND_OPTIONS.map(
      (g) => `<option value="${g.value}" ${sub.grade_band === g.value ? 'selected' : ''}>${g.label}</option>`,
    ),
  ].join('');
  return `
    <div class="register-subject-row" data-subject-idx="${idx}">
      <select class="form-input" data-field="school_level">${levels}</select>
      <select class="form-input" data-field="grade_band">${grades}</select>
      <input class="form-input" data-field="subject_name" value="${sub.subject_name}" placeholder="예: 미적분2, 확률과 통계" />
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

  const prevPath = s.basicComplete ? null : '/register/regions';
  const content = `
    <form data-form="lesson">
      ${renderGuideNotice('상세등록 1단계입니다. 필수 항목을 채운 뒤 다음으로 진행하세요. 나중에 해도 됩니다.')}
      ${renderSectionTitle('수업 · 과목 · 가격')}
      ${s.main_subject_note ? `<p class="form-hint">주력과목(기본등록): <strong>${s.main_subject_note}</strong> · 마이페이지에서 수정</p>` : ''}
      <div class="register-grid-2">
        <div class="form-group">
          <span class="form-label form-label--required">지도 대상 성별</span>
          <div class="form-radio-group">${radios('student_gender_group', GENDER_GROUP_OPTIONS, s.student_gender_group)}</div>
        </div>
        <div class="form-group">
          <span class="form-label form-label--required">수업인원</span>
          <div class="form-radio-group">${radios('student_count_group', STUDENT_COUNT_OPTIONS, s.student_count_group)}</div>
        </div>
      </div>
      <div class="form-group">
        <span class="form-label">과외쌤 연령대</span>
        <div class="form-radio-group">${radios('age_band', AGE_BAND_OPTIONS, s.age_band)}</div>
      </div>
      <div data-subjects-list>${s.subjects.map(subjectRow).join('')}</div>
      <button type="button" class="btn btn--secondary btn--sm" data-action="add-subject">+ 과목 추가</button>
      <div class="register-grid-2" style="margin-top:var(--space-4);">
        <div class="form-group">
          <label class="form-label form-label--required" for="preferred_fee_amount">월 대표 과외비</label>
          <input class="form-input" type="number" id="preferred_fee_amount" name="preferred_fee_amount" value="${s.preferred_fee_amount}" min="1" />
        </div>
        <div class="form-group">
          <span class="form-label form-label--required">산정방식</span>
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
        <div class="register-check-grid">${places}</div>
      </div>
      <a class="register-mypage-link" href="${mypageRegistrationsUrl()}">표시명·주력과목·과외지역 등 기본정보는 마이페이지에서 수정</a>
      ${renderNavButtons(prevPath, '다음: 학력·연락', { skipLabel: '나중에 하기' })}
    </form>`;
  return renderRegisterShell(content, {
    stepKey: 'lesson',
    title: '수업 · 가격',
    subtitle: '상세등록 1/2 · 학생에게 보이는 수업 정보를 적어 주세요.',
  });
}

export function bindLessonEvents(root) {
  bindGlobalEvents(root);
  const nextBtn = root.querySelector('[data-action="next"]');
  root.querySelector('[data-action="prev"]')?.addEventListener('click', () => navigate('/register/regions'));
  root.querySelector('[data-action="skip-detail"]')?.addEventListener('click', () => skipDetailRegistration());
  root.querySelector('[data-action="add-subject"]')?.addEventListener('click', () => {
    registerState.subjects.push(emptySubject());
    window.dispatchEvent(new Event('hashchange'));
  });
  nextBtn?.addEventListener('click', () => {
    withSaving(nextBtn, async () => {
      syncLessonFromForm(root.querySelector('[data-form="lesson"]'), registerState);
      const err = validateLessonState(registerState);
      if (err) {
        alert(err);
        return;
      }
      await saveAndNavigate(registerState, 'lesson', '/register/contact');
    });
  });
}
