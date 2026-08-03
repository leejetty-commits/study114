import { registerState, PERSONAL_GENDER_OPTIONS } from '../state.js';
import { syncBasicFromForm } from '../form-collect.js';
import { saveAndNavigate, withSaving } from '../save-flow.js';
import {
  renderRegisterShell,
  renderNavButtons,
  renderGuideNotice,
  mypageRegistrationsUrl,
  bindGlobalEvents,
  isRegisterEditMode,
  getHashQuery,
} from '../layout.js';
import { renderMainSubjectSelect } from '../../../shared/main-subjects.js';

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

function editQuerySuffix() {
  if (!isRegisterEditMode()) return '';
  const ret = getHashQuery().get('return_to') || '';
  return `?edit=1&return_to=${encodeURIComponent(ret)}`;
}

/** 기본등록이 아직 없는 회원 / 마이페이지 수정(edit=1) */
export function renderBasic() {
  const s = registerState;
  const editing = isRegisterEditMode();
  const content = `
    <form data-form="basic">
      ${renderGuideNotice(
        editing
          ? '기본정보를 수정합니다. 다음에서 과외지역까지 확인한 뒤 저장합니다.'
          : '이 단계는 기본등록을 아직 마치지 않은 분만 진행합니다. 이미 가입·기본등록을 했다면 자동으로 상세등록으로 넘어갑니다.',
      )}
      <div class="form-group">
        <label class="form-label form-label--required" for="tutor_display_name">표시명</label>
        <input class="form-input" id="tutor_display_name" name="tutor_display_name" value="${s.tutor_display_name}" required />
      </div>
      <div class="form-group">
        <label class="form-label form-label--required" for="main_subject_note">주력과목 1개</label>
        <select class="form-input" id="main_subject_note" name="main_subject_note" required>
          ${renderMainSubjectSelect(s.main_subject_note)}
        </select>
        <p class="form-note">목록에서 골라 주세요.</p>
      </div>
      <div class="form-group">
        <span class="form-label form-label--required">과외쌤 성별</span>
        <div class="form-radio-group">${radios('gender', PERSONAL_GENDER_OPTIONS, s.gender || 'male')}</div>
      </div>
      ${
        editing
          ? ''
          : `<a class="register-mypage-link" href="${mypageRegistrationsUrl()}">기본등록을 고치려면 마이페이지 · 내 등록으로 이동</a>`
      }
      ${renderNavButtons(null, '다음: 과외지역')}
    </form>`;
  return renderRegisterShell(content, {
    stepKey: 'basic',
    title: editing ? '기본정보 수정' : '과외쌤 기본등록',
    subtitle: '표시명과 주력과목을 저장한 뒤, 과외지역을 선택합니다.',
  });
}

export function bindBasicEvents(root) {
  bindGlobalEvents(root);
  const nextBtn = root.querySelector('[data-action="next"]');
  nextBtn?.addEventListener('click', () => {
    withSaving(nextBtn, async () => {
      const form = root.querySelector('[data-form="basic"]');
      syncBasicFromForm(form, registerState);
      if (!String(registerState.main_subject_note || '').trim()) {
        alert('주력과목을 선택해 주세요.');
        return;
      }
      await saveAndNavigate(registerState, 'basic', `/register/regions${editQuerySuffix()}`);
    });
  });
}
