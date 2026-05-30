import { registerState } from '../state.js';
import {
  renderRegisterShell,
  renderNavButtons,
  bindGlobalEvents,
  bindFormNav,
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
          <label class="form-radio">
            <input type="radio" name="lesson_place_type" value="home" ${s.lesson_place_type === 'home' ? 'checked' : ''} />
            <span class="form-radio__label">재택</span>
          </label>
          <label class="form-radio">
            <input type="radio" name="lesson_place_type" value="office" ${s.lesson_place_type === 'office' ? 'checked' : ''} />
            <span class="form-radio__label">교습소</span>
          </label>
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
  bindFormNav(root, null, '/register/location');
}
