import { registerState, PERSONAL_GENDER_OPTIONS } from '../state.js';
import { syncBasicFromForm } from '../form-collect.js';
import { saveAndNavigate, withSaving } from '../save-flow.js';
import {
  renderRegisterShell,
  renderNavButtons,
  bindGlobalEvents,
  navigate,
} from '../layout.js';

/** 공부방명과 계정 성별을 먼저 받고, 지역과 주력과목은 다음 단계에서 이어서 입력합니다. */
export function renderBasic() {
  const s = registerState;
  const content = `
    <form data-form="basic">
      <p class="register-hint mb-4">
        공개 전 임시 저장 상태입니다. 검색·목록 항목은 상세등록에서 완성합니다.
      </p>
      <div class="form-group">
        <label class="form-label form-label--required" for="study_room_name">공부방명</label>
        <input class="form-input" id="study_room_name" name="study_room_name" value="${s.study_room_name}" required />
      </div>
      <div class="form-group">
        <label class="form-label form-label--required" for="main_subject_note">주력과목 1개</label>
        <input class="form-input" id="main_subject_note" name="main_subject_note" value="${s.main_subject_note}" required placeholder="예: 수학" />
        <p class="form-note">상세등록에서 같은 필드를 이어서 편집합니다.</p>
      </div>
      <div class="form-group">
        <span class="form-label form-label--required">원장 성별</span>
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
      ${renderNavButtons(null, '다음: 노출지역 1')}
    </form>
  `;
  return renderRegisterShell(content, {
    step: 1,
    title: '공부방 기본등록',
    subtitle: '이름과 주력과목을 먼저 저장하고 다음 단계에서 대표 지역을 선택합니다.',
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
