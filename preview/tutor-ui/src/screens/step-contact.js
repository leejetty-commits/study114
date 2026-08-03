import {
  registerState,
  UNIVERSITY_STATUS_OPTIONS,
  CAREER_YEAR_BAND_OPTIONS,
  TEACHING_STYLE_OPTIONS,
} from '../state.js';
import { syncCareerFromForm, syncContactFromForm } from '../form-collect.js';
import { saveAndNavigate, withSaving } from '../save-flow.js';
import {
  renderRegisterShell,
  renderSectionTitle,
  renderNavButtons,
  renderGuideNotice,
  bindGlobalEvents,
  navigate,
} from '../layout.js';
import { validatePromoUrls } from '../../../shared/promo-links.js';

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

export function renderContact() {
  const s = registerState;
  const badges = TEACHING_STYLE_OPTIONS.map(
    (b) => `
    <label class="form-check">
      <input type="checkbox" name="teaching_style_badges" value="${b.id}" ${s.teaching_style_badges.includes(b.id) ? 'checked' : ''} />
      <span class="form-check__label">${b.label}</span>
    </label>`,
  ).join('');

  const content = `
    ${renderGuideNotice('상세등록 마지막 단계입니다. 학력·경력과 연락·공개를 함께 확인한 뒤 등록을 마쳐 주세요.')}
    <form data-form="contact" class="register-form-narrow">
      ${renderSectionTitle('학력 · 경력 · 특징')}
      <div class="register-grid-2 register-grid-2--tight">
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
      <div class="register-grid-2 register-grid-2--tight">
        <div class="form-group"><label class="form-label">특징 1</label><input class="form-input" name="feature_1" value="${s.feature_1}" /></div>
        <div class="form-group"><label class="form-label">특징 2</label><input class="form-input" name="feature_2" value="${s.feature_2}" /></div>
      </div>
      <div class="form-group">
        <label class="form-check">
          <input type="checkbox" name="proof_document_available" ${s.proof_document_available ? 'checked' : ''} />
          <span class="form-check__label">증빙서류 제출 가능</span>
        </label>
      </div>
      <div class="form-group">
        <span class="form-label">강의스타일</span>
        <div class="register-check-grid">${badges}</div>
      </div>

      ${renderSectionTitle('연락 · 공개')}
      <div class="register-grid-2 register-grid-2--tight">
        <div class="form-group">
          <label class="form-label" for="contact_time_note">연락 가능 시간</label>
          <input class="form-input" id="contact_time_note" name="contact_time_note" value="${s.contact_time_note}" placeholder="예: 평일 18:00~22:00" />
        </div>
        <div class="form-group">
          <label class="form-label" for="profile_status">공개 상태</label>
          <select class="form-input" id="profile_status" name="profile_status">
            <option value="draft" ${s.profile_status === 'draft' || s.profile_status === 'pending' ? 'selected' : ''}>저장만 (아직 비공개)</option>
            <option value="published" ${s.profile_status === 'published' ? 'selected' : ''}>공개</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="youtube_url">유튜브 링크</label>
          <input class="form-input" type="url" id="youtube_url" name="youtube_url" value="${s.youtube_url}" placeholder="https://www.youtube.com/..." />
        </div>
        <div class="form-group">
          <label class="form-label" for="facebook_url">페이스북 링크</label>
          <input class="form-input" type="url" id="facebook_url" name="facebook_url" value="${s.facebook_url}" placeholder="https://www.facebook.com/..." />
        </div>
        <div class="form-group">
          <label class="form-label" for="instagram_url">인스타그램 링크</label>
          <input class="form-input" type="url" id="instagram_url" name="instagram_url" value="${s.instagram_url}" placeholder="https://www.instagram.com/..." />
        </div>
      </div>
      <p class="form-hint">공개는 내용을 확인한 뒤 켜 주세요. 사진 업로드는 곧 연결됩니다.</p>
      ${renderNavButtons('/register/lesson', '등록 완료')}
    </form>`;
  return renderRegisterShell(content, {
    stepKey: 'contact',
    title: '학력 · 연락',
    subtitle: '상세등록 2/2 · 학력·경력과 연락·공개를 함께 마무리합니다.',
  });
}

export function bindContactEvents(root) {
  bindGlobalEvents(root);
  const nextBtn = root.querySelector('[data-action="next"]');
  root.querySelector('[data-action="prev"]')?.addEventListener('click', () => navigate('/register/lesson'));
  nextBtn?.addEventListener('click', () => {
    withSaving(nextBtn, async () => {
      const form = root.querySelector('[data-form="contact"]');
      syncCareerFromForm(form, registerState);
      syncContactFromForm(form, registerState);
      const urlErr = validatePromoUrls(registerState);
      if (urlErr) {
        alert(urlErr);
        return;
      }
      await saveAndNavigate(registerState, 'career', null);
      await saveAndNavigate(registerState, 'contact', '/register/complete');
    });
  });
}
