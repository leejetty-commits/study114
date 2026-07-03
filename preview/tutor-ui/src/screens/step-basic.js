import { registerState, GENDER_GROUP_OPTIONS, PERSONAL_GENDER_OPTIONS, STUDENT_COUNT_OPTIONS, AGE_BAND_OPTIONS } from '../state.js';
import { syncBasicFromForm } from '../form-collect.js';
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

export function renderBasic() {
  const s = registerState;
  const content = `
    <form data-form="basic">
      <div class="form-group">
        <label class="form-label form-label--required" for="tutor_display_name">표시명</label>
        <span class="field-db-name">tutor_display_name</span>
        <input class="form-input" id="tutor_display_name" name="tutor_display_name" value="${s.tutor_display_name}" required />
      </div>
      <div class="form-group">
        <label class="form-label" for="slogan">슬로건</label>
        <span class="field-db-name">slogan</span>
        <input class="form-input" id="slogan" name="slogan" value="${s.slogan}" />
      </div>
      <div class="form-group">
        <label class="form-label" for="intro_short">짧은 소개</label>
        <span class="field-db-name">intro_short</span>
        <input class="form-input" id="intro_short" name="intro_short" value="${s.intro_short}" />
      </div>
      <div class="form-group">
        <label class="form-label" for="intro_long">상세 소개</label>
        <span class="field-db-name">intro_long</span>
        <textarea class="form-input form-textarea" id="intro_long" name="intro_long" rows="3">${s.intro_long}</textarea>
      </div>
      <div class="form-group">
        <span class="form-label form-label--required">과외쌤 성별</span>
        <span class="field-db-name">user_profiles.gender</span>
        <p class="register-hint">매칭·검색 needs에 사용</p>
        <div class="form-radio-group">${radios('gender', PERSONAL_GENDER_OPTIONS, s.gender || 'male')}</div>
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
      ${renderNavButtons(null, '다음: 활동지역')}
    </form>`;
  return renderRegisterShell(content, { step: 1, title: '과외쌤 기본정보', subtitle: '8장 §4 · 노출 식별 정보' });
}

export function bindBasicEvents(root) {
  bindGlobalEvents(root);
  const nextBtn = root.querySelector('[data-action="next"]');
  nextBtn?.addEventListener('click', () => {
    withSaving(nextBtn, async () => {
      syncBasicFromForm(root.querySelector('[data-form="basic"]'), registerState);
      await saveAndNavigate(registerState, 'basic', '/register/regions');
    });
  });
}
