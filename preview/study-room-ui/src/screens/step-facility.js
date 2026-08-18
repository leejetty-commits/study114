import { registerState, getFacilityOptions, emptyProofNote } from '../state.js';
import { validatePromoUrls } from '../../../shared/promo-links.js';
import { renderUniversityNameField } from '../../../shared/korean-universities.js';
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

/** 픽·프라임 카드 항목만 * 표시. 저장·공개는 막지 않는다. */
function starLabel(forId, text) {
  const forAttr = forId ? ` for="${forId}"` : '';
  return `<label class="form-label form-label--required"${forAttr}>${text}</label>`;
}

function renderSubtitle(text) {
  return `<h3 class="register-subtitle">${text}</h3>`;
}

function proofNotes(state) {
  const list = Array.isArray(state.other_proof_notes) ? state.other_proof_notes.map(String) : [];
  return list.length ? list : [emptyProofNote()];
}

function renderProofRows(notes) {
  return notes
    .map(
      (note, idx) => `
      <div class="register-proof-row" data-proof-idx="${idx}">
        <textarea class="form-input form-textarea" name="other_proof_notes" rows="2" placeholder="예: 자격증, 수상 내역, 보험 가입">${esc(note)}</textarea>
        ${
          notes.length > 1
            ? `<button type="button" class="btn btn--ghost btn--sm" data-action="remove-proof" data-idx="${idx}">삭제</button>`
            : ''
        }
      </div>`,
    )
    .join('');
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

function persistForm(form) {
  syncCareerFromForm(form, registerState);
  syncFacilityFromForm(form, registerState);
}

export function renderFacility() {
  const s = registerState;
  const notes = proofNotes(s);
  const content = `
    <form data-form="facility">
      ${renderGuideNotice('상세정보 2/2단계입니다. 비어 있어도 저장한 뒤 등록 완료로 넘어갈 수 있습니다. 공개 여부는 맨 아래 칸에서 고릅니다.')}
      ${renderSectionTitle('경력 · 특징')}
      <div class="register-grid-2">
        ${renderUniversityNameField({
          variant: 'form',
          name: 'university_name',
          value: s.university_name,
          id: 'room_univ_facility',
          label: '출신대학',
          hint: '한국 대학교명 목록에서 선택·검색하세요. 학부 대학명 1개만 저장됩니다.',
        })}
        <div class="form-group">
          <label class="form-label" for="major_name">전공학과</label>
          <input class="form-input" id="major_name" name="major_name" value="${esc(s.major_name)}" placeholder="학과명 (서술형)" />
        </div>
      </div>
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
          ${starLabel('feature_1', '경력특징 1')}
          <input class="form-input" id="feature_1" name="feature_1" value="${esc(s.feature_1)}" />
        </div>
        <div class="form-group">
          ${starLabel('feature_2', '경력특징 2')}
          <input class="form-input" id="feature_2" name="feature_2" value="${esc(s.feature_2)}" />
        </div>
      </div>
      <div class="form-group">
        ${starLabel('feature_3', '경력특징 3')}
        <input class="form-input" id="feature_3" name="feature_3" value="${esc(s.feature_3)}" />
      </div>

      ${renderSectionTitle('신뢰')}
      ${renderSubtitle('보유 증빙 서류')}
      <div class="form-group">
        <label class="form-check">
          <input class="form-check__input" type="checkbox" name="business_registration_available" ${s.business_registration_available ? 'checked' : ''} />
          <span class="form-check__label">사업자등록증</span>
        </label>
      </div>
      <div class="form-group">
        <label class="form-check">
          <input class="form-check__input" type="checkbox" name="education_office_registered" ${s.education_office_registered ? 'checked' : ''} />
          <span class="form-check__label form-label--required">교육청등록증</span>
        </label>
        <label class="form-label" for="education_office_reg_no">교육청 등록번호</label>
        <input class="form-input" id="education_office_reg_no" name="education_office_reg_no" value="${esc(s.education_office_reg_no)}" />
      </div>
      <div class="form-group">
        <label class="form-check">
          <input class="form-check__input" type="checkbox" name="franchise_flag" ${s.franchise_flag ? 'checked' : ''} />
          <span class="form-check__label">프랜차이즈</span>
        </label>
        <label class="form-label" for="franchise_name">프랜차이즈명</label>
        <input class="form-input" id="franchise_name" name="franchise_name" value="${esc(s.franchise_name)}" />
      </div>
      <div class="form-group">
        <label class="form-label">기타 증빙 내역</label>
        <p class="register-hint">사업자등록증·교육청등록증·프랜차이즈 외에 보여줄 증빙이 있으면 한 줄씩 적어 주세요. 「증빙 추가」로 칸을 늘릴 수 있습니다.</p>
        <div class="register-proof-list">${renderProofRows(notes)}</div>
        <button type="button" class="btn btn--secondary btn--sm register-add-btn" data-action="add-proof">증빙 추가</button>
      </div>

      ${renderSectionTitle('시설 · 환경')}
      <div class="register-check-grid mb-4">${renderFacilityChecks()}</div>
      <div class="form-group">
        <label class="form-label" for="facility_note">시설 추가설명</label>
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
    title: '경력 · 신뢰 · 시설',
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
    persistForm(form);
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

  root.querySelector('[data-action="add-proof"]')?.addEventListener('click', () => {
    persistForm(form);
    if (!Array.isArray(registerState.other_proof_notes)) registerState.other_proof_notes = [];
    if (!registerState.other_proof_notes.length) registerState.other_proof_notes.push(emptyProofNote());
    registerState.other_proof_notes.push(emptyProofNote());
    window.dispatchEvent(new Event('hashchange'));
  });

  root.querySelectorAll('[data-action="remove-proof"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      persistForm(form);
      const idx = Number(btn.getAttribute('data-idx'));
      registerState.other_proof_notes.splice(idx, 1);
      if (!registerState.other_proof_notes.length) registerState.other_proof_notes.push(emptyProofNote());
      window.dispatchEvent(new Event('hashchange'));
    });
  });
}
