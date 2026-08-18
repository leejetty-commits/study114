import { registerState, getFacilityOptions } from '../state.js';
import { validatePromoUrls } from '../../../shared/promo-links.js';
import { syncFacilityFromForm, syncCareerFromForm } from '../form-collect.js';
import { saveCurrentStep, withSaving } from '../save-flow.js';
import {
  renderRegisterShell,
  renderSectionTitle,
  renderDetailStepNav,
  renderGuideNotice,
  renderPublishStatusBlock,
  bindGlobalEvents,
  navigate,
  withRoomId,
} from '../layout.js';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function renderFacilityChecks() {
  const options = getFacilityOptions();
  if (!options.length) {
    return '<p class="register-hint">시설 목록을 불러오지 못했습니다. 잠시 후 다시 열어 주세요.</p>';
  }
  return options
    .map((f) => {
      const checked = registerState.facility_ids.includes(f.id);
      return `
      <label class="form-check">
        <input class="form-check__input" type="checkbox" name="facility_ids" value="${f.id}" ${checked ? 'checked' : ''} />
        <span class="form-check__label">${esc(f.facility_name)}</span>
      </label>
    `;
    })
    .join('');
}

export function renderFacility() {
  const s = registerState;
  const content = `
    <form data-form="facility">
      ${renderGuideNotice('상세정보 2/2단계입니다. 비어 있어도 저장한 뒤 등록 완료로 넘어갈 수 있습니다. 공개 여부는 맨 아래 칸에서 고릅니다.')}
      ${renderSectionTitle('경력 · 특징')}
      <div class="register-grid-2">
        <div class="form-group">
          <label class="form-label" for="career_years">교습 경력 (년)</label>
          <input class="form-input" type="number" id="career_years" name="career_years" value="${esc(s.career_years)}" />
        </div>
        <div class="form-group">
          <label class="form-label" for="academy_career_years">학원 경력 (년)</label>
          <input class="form-input" type="number" id="academy_career_years" name="academy_career_years" value="${esc(s.academy_career_years)}" />
        </div>
      </div>
      <div class="register-grid-2">
        <div class="form-group">
          <label class="form-check">
            <input class="form-check__input" type="checkbox" name="franchise_flag" ${s.franchise_flag ? 'checked' : ''} />
            <span class="form-check__label">프랜차이즈</span>
          </label>
          <label class="form-label" for="franchise_name">프랜차이즈명</label>
          <input class="form-input" id="franchise_name" name="franchise_name" value="${esc(s.franchise_name)}" />
        </div>
        <div class="form-group">
          <label class="form-check">
            <input class="form-check__input" type="checkbox" name="education_office_registered" ${s.education_office_registered ? 'checked' : ''} />
            <span class="form-check__label">교육청 등록</span>
          </label>
          <label class="form-label" for="education_office_reg_no">교육청 등록번호</label>
          <input class="form-input" id="education_office_reg_no" name="education_office_reg_no" value="${esc(s.education_office_reg_no)}" />
        </div>
      </div>
      <div class="register-grid-2">
        <div class="form-group">
          <label class="form-label" for="feature_1">특징 1</label>
          <input class="form-input" id="feature_1" name="feature_1" value="${esc(s.feature_1)}" />
        </div>
        <div class="form-group">
          <label class="form-label" for="feature_2">특징 2</label>
          <input class="form-input" id="feature_2" name="feature_2" value="${esc(s.feature_2)}" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="feature_3">특징 3</label>
        <input class="form-input" id="feature_3" name="feature_3" value="${esc(s.feature_3)}" />
      </div>

      ${renderSectionTitle('시설 · 환경')}
      <div class="register-check-grid mb-4">${renderFacilityChecks()}</div>
      <div class="form-group">
        <label class="form-label" for="facility_note">시설 자유기술</label>
        <textarea class="form-input form-textarea" id="facility_note" name="facility_note" rows="3">${esc(s.facility_note)}</textarea>
      </div>

      ${renderSectionTitle('소셜홍보')}
      <p class="register-hint">연락은 쪽지로만 합니다. 전화번호·이메일은 이 화면과 검색·상세에 올리지 않습니다.</p>
      <div class="register-grid-2">
        <div class="form-group">
          <label class="form-label" for="youtube_url">유튜브 링크</label>
          <input class="form-input" type="url" id="youtube_url" name="youtube_url" placeholder="https://www.youtube.com/..." value="${esc(s.youtube_url)}" />
        </div>
        <div class="form-group">
          <label class="form-label" for="facebook_url">페이스북 링크</label>
          <input class="form-input" type="url" id="facebook_url" name="facebook_url" placeholder="https://www.facebook.com/..." value="${esc(s.facebook_url)}" />
        </div>
        <div class="form-group">
          <label class="form-label" for="instagram_url">인스타그램 링크</label>
          <input class="form-input" type="url" id="instagram_url" name="instagram_url" placeholder="https://www.instagram.com/..." value="${esc(s.instagram_url)}" />
        </div>
      </div>

      ${renderPublishStatusBlock(s.profile_status, {
        lead: '모두 채운 뒤 공개할지, 지금은 저장만 할지 정하는 칸입니다. 등록 완료 화면에서도 다시 고를 수 있습니다.',
      })}

      ${renderDetailStepNav({
        prevPath: '/register/lesson',
        nextLabel: '등록 완료',
        nextEnabled: true,
      })}
    </form>
  `;
  return renderRegisterShell(content, {
    stepKey: 'facility',
    title: '경력 · 시설',
  });
}

export function bindFacilityEvents(root) {
  bindGlobalEvents(root);
  const form = root.querySelector('[data-form="facility"]');
  const prevBtn = root.querySelector('[data-action="prev"]');
  const nextBtn = root.querySelector('[data-action="next"]');
  const saveBtn = root.querySelector('[data-action="save"]');

  prevBtn?.addEventListener('click', () => navigate(withRoomId('/register/lesson')));

  async function persistFacility() {
    syncCareerFromForm(form, registerState);
    syncFacilityFromForm(form, registerState);
    const urlErr = validatePromoUrls(registerState);
    if (urlErr) {
      throw new Error(urlErr);
    }
    await saveCurrentStep(registerState, 'career');
    await saveCurrentStep(registerState, 'facility');
    registerState.detailFacilitySaved = true;
  }

  saveBtn?.addEventListener('click', () => {
    withSaving(saveBtn, async () => {
      await persistFacility();
      alert('저장되었습니다.');
      window.dispatchEvent(new Event('hashchange'));
    });
  });

  nextBtn?.addEventListener('click', () => {
    withSaving(nextBtn, async () => {
      await persistFacility();
      registerState.completeNeedsHydrate = true;
      navigate(withRoomId('/register/complete'));
    });
  });
}
