import { registerState, PERSONAL_GENDER_OPTIONS } from '../state.js';
import { syncBasicFromForm } from '../form-collect.js';
import { saveAndNavigate, withSaving } from '../save-flow.js';
import { renderRegisterShell, renderNavButtons, bindGlobalEvents } from '../layout.js';

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

/** 표시명과 성별을 먼저 받고, 활동 지역과 주력과목은 다음 단계에서 이어서 입력합니다. */
export function renderBasic() {
  const s = registerState;
  const content = `
    <form data-form="basic">
      <p class="register-hint mb-4">
        공개 전 임시 저장 상태입니다. 검색·비교 항목은 상세등록에서 완성합니다.
      </p>
      <div class="form-group">
        <label class="form-label form-label--required" for="tutor_display_name">표시명</label>
        <input class="form-input" id="tutor_display_name" name="tutor_display_name" value="${s.tutor_display_name}" required />
      </div>
      <div class="form-group">
        <label class="form-label form-label--required" for="main_subject_note">주력과목 1개</label>
        <input class="form-input" id="main_subject_note" name="main_subject_note" value="${s.main_subject_note || ''}" required placeholder="예: 수학" />
        <p class="form-note">상세등록에서 같은 필드를 이어서 편집합니다.</p>
      </div>
      <div class="form-group">
        <span class="form-label form-label--required">과외쌤 성별</span>
        <div class="form-radio-group">${radios('gender', PERSONAL_GENDER_OPTIONS, s.gender || 'male')}</div>
      </div>
      ${renderNavButtons(null, '다음: 활동 시 1')}
    </form>`;
  return renderRegisterShell(content, {
    step: 1,
    title: '과외쌤 기본등록',
    subtitle: '표시명과 주력과목을 먼저 저장하고 다음 단계에서 대표 활동 지역을 선택합니다.',
  });
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
