import { registerState, UNIVERSITY_STATUS_OPTIONS, CAREER_YEAR_BAND_OPTIONS, TEACHING_STYLE_OPTIONS } from '../state.js';
import { syncCareerFromForm } from '../form-collect.js';
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

export function renderCareer() {
  const s = registerState;
  const badges = TEACHING_STYLE_OPTIONS.map(
    (b) => `
    <label class="form-check">
      <input type="checkbox" name="teaching_style_badges" value="${b.id}" ${s.teaching_style_badges.includes(b.id) ? 'checked' : ''} />
      <span class="form-check__label">${b.label}</span>
    </label>`,
  ).join('');

  const content = `
    <form data-form="career">
      <div class="form-row">
        <div class="form-group"><label class="form-label">출신대학</label><input class="form-input" name="university_name" value="${s.university_name}" /></div>
        <div class="form-group"><label class="form-label">전공</label><input class="form-input" name="major_name" value="${s.major_name}" /></div>
      </div>
      <div class="form-group">
        <span class="form-label">학적상태</span>
        <div class="form-radio-group">${radios('university_status', UNIVERSITY_STATUS_OPTIONS, s.university_status)}</div>
      </div>
      <div class="form-group">
        <span class="form-label">경력구간</span>
        <div class="form-radio-group">${radios('career_year_band', CAREER_YEAR_BAND_OPTIONS, s.career_year_band)}</div>
      </div>
      <div class="form-group"><label class="form-label">주교재</label><input class="form-input" name="main_material_note" value="${s.main_material_note}" /></div>
      <div class="form-group"><label class="form-label">특징 1</label><input class="form-input" name="feature_1" value="${s.feature_1}" /></div>
      <div class="form-group"><label class="form-label">특징 2</label><input class="form-input" name="feature_2" value="${s.feature_2}" /></div>
      <div class="form-group">
        <label class="form-check">
          <input type="checkbox" name="proof_document_available" ${s.proof_document_available ? 'checked' : ''} />
          <span class="form-check__label">증빙서류 제출 가능</span>
        </label>
      </div>
      <div class="form-group">
        <span class="form-label">강의스타일 배지</span>
        <div class="register-check-grid">${badges}</div>
      </div>
      ${renderNavButtons('/register/lesson', '다음: 연락·사진')}
    </form>`;
  return renderRegisterShell(content, { step: 4, title: '학력 · 경력 · 특징', subtitle: '8장 §4 · tutor_teaching_style_badges' });
}

export function bindCareerEvents(root) {
  bindGlobalEvents(root);
  const nextBtn = root.querySelector('[data-action="next"]');
  root.querySelector('[data-action="prev"]')?.addEventListener('click', () => navigate('/register/lesson'));
  nextBtn?.addEventListener('click', () => {
    withSaving(nextBtn, async () => {
      syncCareerFromForm(root.querySelector('[data-form="career"]'), registerState);
      await saveAndNavigate(registerState, 'career', '/register/contact');
    });
  });
}
