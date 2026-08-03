import { registerState, getFacilityOptions, IMAGE_TYPES } from '../state.js';
import { validatePromoUrls } from '../../../shared/promo-links.js';
import { syncFacilityFromForm, syncCareerFromForm } from '../form-collect.js';
import { saveAndNavigate, withSaving } from '../save-flow.js';
import {
  renderRegisterShell,
  renderSectionTitle,
  renderNavButtons,
  renderGuideNotice,
  bindGlobalEvents,
  navigate,
} from '../layout.js';

function renderFacilityChecks() {
  return getFacilityOptions()
    .map((f) => {
      const checked = registerState.facility_ids.includes(f.id);
      return `
      <label class="form-check">
        <input class="form-check__input" type="checkbox" name="facility_ids" value="${f.id}" ${checked ? 'checked' : ''} />
        <span class="form-check__label">${f.facility_name}</span>
      </label>
    `;
    })
    .join('');
}

export function renderFacility() {
  const s = registerState;
  const content = `
    ${renderGuideNotice('상세등록 마지막 단계입니다. 경력·시설·연락을 확인한 뒤 등록을 마쳐 주세요.')}
    <form data-form="facility" class="register-form-narrow">
      ${renderSectionTitle('경력 · 특징')}
      <div class="register-grid-2 register-grid-2--tight">
        <div class="form-group">
          <label class="form-label" for="career_years">교습 경력 (년)</label>
          <input class="form-input" type="number" id="career_years" name="career_years" value="${s.career_years}" />
        </div>
        <div class="form-group">
          <label class="form-label" for="academy_career_years">학원 경력 (년)</label>
          <input class="form-input" type="number" id="academy_career_years" name="academy_career_years" value="${s.academy_career_years}" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-check">
          <input class="form-check__input" type="checkbox" name="franchise_flag" ${s.franchise_flag ? 'checked' : ''} />
          <span class="form-check__label">프랜차이즈</span>
        </label>
      </div>
      <div class="form-group">
        <label class="form-label" for="franchise_name">프랜차이즈명</label>
        <input class="form-input" id="franchise_name" name="franchise_name" value="${s.franchise_name}" />
      </div>
      <div class="form-group">
        <label class="form-check">
          <input class="form-check__input" type="checkbox" name="education_office_registered" ${s.education_office_registered ? 'checked' : ''} />
          <span class="form-check__label">교육청 등록</span>
        </label>
      </div>
      <div class="form-group">
        <label class="form-label" for="education_office_reg_no">교육청 등록번호</label>
        <input class="form-input" id="education_office_reg_no" name="education_office_reg_no" value="${s.education_office_reg_no}" />
      </div>
      <div class="register-grid-2 register-grid-2--tight">
        <div class="form-group">
          <label class="form-label" for="feature_1">특징 1</label>
          <input class="form-input" id="feature_1" name="feature_1" value="${s.feature_1}" />
        </div>
        <div class="form-group">
          <label class="form-label" for="feature_2">특징 2</label>
          <input class="form-input" id="feature_2" name="feature_2" value="${s.feature_2}" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="feature_3">특징 3</label>
        <input class="form-input" id="feature_3" name="feature_3" value="${s.feature_3}" />
      </div>

      ${renderSectionTitle('시설 · 환경')}
      <div class="register-check-grid mb-4">${renderFacilityChecks()}</div>
      <div class="form-group">
        <label class="form-label" for="facility_note">시설 자유기술</label>
        <textarea class="form-input form-textarea" id="facility_note" name="facility_note" rows="3">${s.facility_note}</textarea>
      </div>

      ${renderSectionTitle('연락 · 공개')}
      <div class="register-grid-2 register-grid-2--tight">
        <div class="form-group">
          <label class="form-label" for="contact_time_note">연락 가능 시간</label>
          <input class="form-input" id="contact_time_note" name="contact_time_note" value="${s.contact_time_note}" />
        </div>
        <div class="form-group">
          <label class="form-label" for="contact_phone">문의 전화</label>
          <input class="form-input" type="tel" id="contact_phone" name="contact_phone" value="${s.contact_phone}" />
        </div>
        <div class="form-group">
          <label class="form-label" for="youtube_url">유튜브 링크</label>
          <input class="form-input" type="url" id="youtube_url" name="youtube_url" placeholder="https://www.youtube.com/..." value="${s.youtube_url}" />
        </div>
        <div class="form-group">
          <label class="form-label" for="facebook_url">페이스북 링크</label>
          <input class="form-input" type="url" id="facebook_url" name="facebook_url" placeholder="https://www.facebook.com/..." value="${s.facebook_url}" />
        </div>
        <div class="form-group">
          <label class="form-label" for="instagram_url">인스타그램 링크</label>
          <input class="form-input" type="url" id="instagram_url" name="instagram_url" placeholder="https://www.instagram.com/..." value="${s.instagram_url}" />
        </div>
        <div class="form-group">
          <label class="form-label" for="profile_status">공개 상태</label>
          <select class="form-input" id="profile_status" name="profile_status">
            <option value="draft" ${s.profile_status === 'draft' || s.profile_status === 'pending' ? 'selected' : ''}>저장만 (아직 비공개)</option>
            <option value="published" ${s.profile_status === 'published' ? 'selected' : ''}>공개</option>
          </select>
        </div>
      </div>

      ${renderSectionTitle('사진 (0~5장)')}
      <p class="register-hint mb-4">미리보기용입니다. 실제 파일 업로드는 곧 연결됩니다.</p>
      <div class="register-image-list">
        ${s.images
          .map(
            (img) => `
          <div class="register-image-item">
            <select class="form-input" style="max-width:6rem;">
              ${IMAGE_TYPES.map(
                (t) =>
                  `<option value="${t.value}" ${img.image_type === t.value ? 'selected' : ''}>${t.label}</option>`,
              ).join('')}
            </select>
            <span>${img.name || '업로드 파일'}</span>
          </div>
        `,
          )
          .join('')}
        <button type="button" class="btn btn--secondary btn--sm" data-action="add-image">+ 사진 추가 (최대 5)</button>
      </div>

      ${renderNavButtons('/register/lesson', '등록 완료')}
    </form>
  `;
  return renderRegisterShell(content, {
    stepKey: 'facility',
    title: '경력 · 시설',
    subtitle: '상세등록 2/2 · 경력과 시설·연락을 함께 마무리합니다.',
  });
}

export function bindFacilityEvents(root) {
  bindGlobalEvents(root);
  const prevBtn = root.querySelector('[data-action="prev"]');
  prevBtn?.addEventListener('click', () => navigate('/register/lesson'));

  const nextBtn = root.querySelector('[data-action="next"]');
  nextBtn?.addEventListener('click', () => {
    withSaving(nextBtn, async () => {
      const form = root.querySelector('[data-form="facility"]');
      syncCareerFromForm(form, registerState);
      syncFacilityFromForm(form, registerState);
      const urlErr = validatePromoUrls(registerState);
      if (urlErr) {
        alert(urlErr);
        return;
      }
      await saveAndNavigate(registerState, 'career', null);
      await saveAndNavigate(registerState, 'facility', '/register/complete');
    });
  });

  root.querySelector('[data-action="add-image"]')?.addEventListener('click', () => {
    if (registerState.images.length >= 5) {
      alert('이미지는 최대 5장까지입니다.');
      return;
    }
    registerState.images.push({
      image_type: 'interior',
      sort_order: registerState.images.length + 1,
      name: `photo-${registerState.images.length + 1}.jpg`,
    });
    window.dispatchEvent(new Event('hashchange'));
  });
}
