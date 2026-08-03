import { registerState, PERSONAL_GENDER_OPTIONS } from '../state.js';
import { syncBasicFromForm } from '../form-collect.js';
import { saveAndNavigate, withSaving } from '../save-flow.js';
import {
  renderRegisterShell,
  renderNavButtons,
  renderGuideNotice,
  mypageRegistrationsUrl,
  bindGlobalEvents,
} from '../layout.js';
import { renderMainSubjectSelect } from '../../../shared/main-subjects.js';

export function renderBasic() {
  const s = registerState;
  const content = `
    <form data-form="basic">
      ${renderGuideNotice(
        '이 단계는 기본등록을 아직 마치지 않은 분만 진행합니다. 이미 가입·기본등록을 했다면 자동으로 상세등록으로 넘어갑니다.',
      )}
      <div class="register-basic-fields">
        <div class="form-group">
          <label class="form-label form-label--required" for="study_room_name">공부방명</label>
          <input class="form-input" id="study_room_name" name="study_room_name" value="${s.study_room_name}" required />
        </div>
        <div class="form-group">
          <label class="form-label form-label--required" for="main_subject_note">주력과목 1개</label>
          <select class="form-input" id="main_subject_note" name="main_subject_note" required>
            ${renderMainSubjectSelect(s.main_subject_note)}
          </select>
        </div>
        <div class="form-group form-group--full">
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
          <p class="form-note">상세등록에서 수업·과목 정보를 이어서 채울 수 있습니다.</p>
        </div>
      </div>
      <a class="register-mypage-link" href="${mypageRegistrationsUrl()}">기본등록을 고치려면 마이페이지 · 내 등록으로 이동</a>
      ${renderNavButtons(null, '다음: 위치')}
    </form>
  `;
  return renderRegisterShell(content, {
    stepKey: 'basic',
    title: '공부방 기본등록',
    subtitle: '이름과 주력과목을 저장한 뒤, 위치를 선택합니다.',
  });
}

export function bindBasicEvents(root) {
  bindGlobalEvents(root);
  const nextBtn = root.querySelector('[data-action="next"]');
  nextBtn?.addEventListener('click', () => {
    withSaving(nextBtn, async () => {
      syncBasicFromForm(root.querySelector('[data-form="basic"]'), registerState);
      if (!String(registerState.main_subject_note || '').trim()) {
        alert('주력과목을 선택해 주세요.');
        return;
      }
      await saveAndNavigate(registerState, 'basic', '/register/location');
    });
  });
}
