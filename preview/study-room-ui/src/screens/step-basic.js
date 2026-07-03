import { registerState, LESSON_PLACE_TYPES, PERSONAL_GENDER_OPTIONS } from '../state.js';
import { syncBasicFromForm } from '../form-collect.js';
import { saveAndNavigate, withSaving } from '../save-flow.js';
import {
  renderRegisterShell,
  renderNavButtons,
  bindGlobalEvents,
  bindFormNav,
  navigate,
} from '../layout.js';

export function renderBasic() {
  const s = registerState;
  const content = `
    <form data-form="basic">
      <div class="form-group">
        <label class="form-label form-label--required" for="study_room_name">공부방명</label>
        <span class="field-db-name">study_room_name</span>
        <input class="form-input" id="study_room_name" name="study_room_name" value="${s.study_room_name}" required />
      </div>
      <div class="form-group">
        <span class="form-label form-label--required">원장 성별</span>
        <span class="field-db-name">user_profiles.gender</span>
        <p class="register-hint">매칭·검색 needs에 사용</p>
        <div class="form-radio-group" role="radiogroup">
          ${PERSONAL_GENDER_OPTIONS.map(
            (t) => `
          <label class="form-radio">
            <input type="radio" name="gender" value="${t.value}" ${s.gender === t.value ? 'checked' : ''} required />
            <span class="form-radio__label">${t.label}</span>
          </label>`,
          ).join('')}
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="slogan">슬로건</label>
        <span class="field-db-name">slogan</span>
        <input class="form-input" id="slogan" name="slogan" maxlength="255" value="${s.slogan}" placeholder="한줄 캐치프레이즈" />
      </div>
      <div class="form-group">
        <label class="form-label" for="operator_display_name">운영자 표시명</label>
        <span class="field-db-name">operator_display_name</span>
        <input class="form-input" id="operator_display_name" name="operator_display_name" value="${s.operator_display_name}" />
      </div>
      <div class="form-group">
        <label class="form-label" for="intro_short">짧은 소개</label>
        <span class="field-db-name">intro_short</span>
        <input class="form-input" id="intro_short" name="intro_short" maxlength="255" value="${s.intro_short}" />
      </div>
      <div class="form-group">
        <label class="form-label" for="intro_long">상세 소개</label>
        <span class="field-db-name">intro_long</span>
        <textarea class="form-input form-textarea" id="intro_long" name="intro_long" rows="4">${s.intro_long}</textarea>
      </div>
      <div class="form-group">
        <span class="form-label form-label--required">교습장 형태</span>
        <span class="field-db-name">lesson_place_type</span>
        <div class="form-radio-group" role="radiogroup">
          ${LESSON_PLACE_TYPES.map(
            (t) => `
          <label class="form-radio">
            <input type="radio" name="lesson_place_type" value="${t.value}" ${s.lesson_place_type === t.value ? 'checked' : ''} />
            <span class="form-radio__label">${t.label}</span>
          </label>`,
          ).join('')}
        </div>
      </div>
      ${renderNavButtons(null, '다음: 위치')}
    </form>
  `;
  return renderRegisterShell(content, {
    step: 1,
    title: '공부방 기본정보',
    subtitle: '5장 §4 · 샵 상세의 핵심 식별 정보',
  });
}

export function bindBasicEvents(root) {
  bindGlobalEvents(root);
  const nextBtn = root.querySelector('[data-action="next"]');
  nextBtn?.addEventListener('click', () => {
    withSaving(nextBtn, async () => {
      syncBasicFromForm(root.querySelector('[data-form="basic"]'), registerState);
      await saveAndNavigate(registerState, 'basic', '/register/location');
    });
  });
  const prev = root.querySelector('[data-action="prev"]');
  if (prev) prev.addEventListener('click', () => navigate('/register/basic'));
}
