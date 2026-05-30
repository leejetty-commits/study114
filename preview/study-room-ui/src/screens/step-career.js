import { registerState } from '../state.js';
import {
  renderRegisterShell,
  renderNavButtons,
  bindGlobalEvents,
  bindFormNav,
} from '../layout.js';

export function renderCareer() {
  const s = registerState;
  const content = `
    <form data-form="career">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="career_years">교습 경력 (년)</label>
          <span class="field-db-name">career_years</span>
          <input class="form-input" type="number" id="career_years" name="career_years" value="${s.career_years}" />
        </div>
        <div class="form-group">
          <label class="form-label" for="academy_career_years">학원 경력 (년)</label>
          <span class="field-db-name">academy_career_years</span>
          <input class="form-input" type="number" id="academy_career_years" name="academy_career_years" value="${s.academy_career_years}" />
        </div>
      </div>

      <div class="form-group">
        <label class="form-check">
          <input class="form-check__input" type="checkbox" name="franchise_flag" ${s.franchise_flag ? 'checked' : ''} />
          <span class="form-check__label">프랜차이즈</span>
          <span class="field-db-name">franchise_flag</span>
        </label>
      </div>
      <div class="form-group">
        <label class="form-label" for="franchise_name">프랜차이즈명</label>
        <span class="field-db-name">franchise_name</span>
        <input class="form-input" id="franchise_name" name="franchise_name" value="${s.franchise_name}" />
      </div>

      <div class="form-group">
        <label class="form-check">
          <input class="form-check__input" type="checkbox" name="education_office_registered" ${s.education_office_registered ? 'checked' : ''} />
          <span class="form-check__label">교육청 등록</span>
          <span class="field-db-name">education_office_registered</span>
        </label>
      </div>
      <div class="form-group">
        <label class="form-label" for="education_office_reg_no">교육청 등록번호</label>
        <span class="field-db-name">education_office_reg_no</span>
        <input class="form-input" id="education_office_reg_no" name="education_office_reg_no" value="${s.education_office_reg_no}" />
      </div>

      <div class="form-group">
        <label class="form-label" for="feature_1">특징 1</label>
        <span class="field-db-name">feature_1</span>
        <input class="form-input" id="feature_1" name="feature_1" value="${s.feature_1}" />
      </div>
      <div class="form-group">
        <label class="form-label" for="feature_2">특징 2</label>
        <span class="field-db-name">feature_2</span>
        <input class="form-input" id="feature_2" name="feature_2" value="${s.feature_2}" />
      </div>
      <div class="form-group">
        <label class="form-label" for="feature_3">특징 3</label>
        <span class="field-db-name">feature_3</span>
        <input class="form-input" id="feature_3" name="feature_3" value="${s.feature_3}" />
      </div>

      ${renderNavButtons('/register/lesson', '다음: 시설·연락·사진')}
    </form>
  `;
  return renderRegisterShell(content, {
    step: 4,
    title: '경력 · 교육청 · 특징',
    subtitle: '5장 §4 — 신뢰 판단 항목',
  });
}

export function bindCareerEvents(root) {
  bindGlobalEvents(root);
  bindFormNav(root, '/register/lesson', '/register/facility');
}
