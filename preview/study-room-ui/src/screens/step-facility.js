import { registerState, FACILITY_OPTIONS, IMAGE_TYPES } from '../state.js';
import {
  renderRegisterShell,
  renderSectionTitle,
  renderNavButtons,
  renderTempNotice,
  bindGlobalEvents,
  bindFormNav,
  navigate,
} from '../layout.js';

function renderFacilityChecks() {
  return FACILITY_OPTIONS.map((f) => {
    const checked = registerState.facility_ids.includes(f.id);
    return `
      <label class="form-check">
        <input class="form-check__input" type="checkbox" name="facility_ids" value="${f.id}" ${checked ? 'checked' : ''} />
        <span class="form-check__label">${f.facility_name}</span>
        <span class="field-db-name">${f.facility_code}</span>
      </label>
    `;
  }).join('');
}

export function renderFacility() {
  const s = registerState;
  const content = `
    ${renderTempNotice('이미지 업로드 · 저장 API는 추후 연동 (0~5장)')}
    <form data-form="facility">
      ${renderSectionTitle('시설 · 환경 (체크형)')}
      <p class="register-hint mb-4">study_room_facilities · facility_masters (~5개, 5장 §11-3)</p>
      <div class="register-check-grid mb-4">${renderFacilityChecks()}</div>
      <div class="form-group">
        <label class="form-label" for="facility_note">시설 자유기술</label>
        <span class="field-db-name">facility_note</span>
        <textarea class="form-input form-textarea" id="facility_note" name="facility_note" rows="3">${s.facility_note}</textarea>
      </div>

      ${renderSectionTitle('연락')}
      <div class="form-group">
        <label class="form-label" for="contact_time_note">연락 가능 시간</label>
        <span class="field-db-name">contact_time_note</span>
        <input class="form-input" id="contact_time_note" name="contact_time_note" value="${s.contact_time_note}" />
      </div>
      <div class="form-group">
        <label class="form-label" for="contact_phone">문의 전화</label>
        <span class="field-db-name">contact_phone</span>
        <input class="form-input" type="tel" id="contact_phone" name="contact_phone" value="${s.contact_phone}" />
      </div>

      ${renderSectionTitle('사진 (0~5장)')}
      <p class="register-hint mb-4">study_room_images · image_type / image_path / sort_order</p>
      <div class="register-image-list">
        ${s.images
          .map(
            (img) => `
          <div class="register-image-item">
            <select class="form-input" style="max-width:6rem;">
              ${IMAGE_TYPES.map(
                (t) =>
                  `<option value="${t.value}" ${img.image_type === t.value ? 'selected' : ''}>${t.label}</option>`
              ).join('')}
            </select>
            <span>${img.name || '업로드 파일'}</span>
            <span class="field-db-name">sort_order ${img.sort_order}</span>
          </div>
        `
          )
          .join('')}
        <button type="button" class="btn btn--secondary btn--sm" data-action="add-image">+ 사진 추가 (최대 5)</button>
      </div>

      <div class="form-group mt-6">
        <label class="form-label" for="profile_status">저장 상태</label>
        <span class="field-db-name">profile_status</span>
        <select class="form-input" id="profile_status" name="profile_status">
          <option value="draft" ${s.profile_status === 'draft' ? 'selected' : ''}>draft · 임시저장</option>
          <option value="pending" ${s.profile_status === 'pending' ? 'selected' : ''}>pending · 검수요청</option>
          <option value="published" ${s.profile_status === 'published' ? 'selected' : ''}>published · 공개</option>
        </select>
      </div>

      ${renderNavButtons('/register/career', '등록 완료')}
    </form>
  `;
  return renderRegisterShell(content, {
    step: 5,
    title: '시설 · 연락 · 사진',
    subtitle: '체크형 + 자유기술 · 이미지 0~5장 (5장 §6·§11-1)',
  });
}

export function bindFacilityEvents(root) {
  bindGlobalEvents(root);
  bindFormNav(root, '/register/career', null);

  root.querySelector('[data-action="next"]')?.addEventListener('click', () => {
    navigate('/register/complete');
  });

  root.querySelector('[data-action="add-image"]')?.addEventListener('click', () => {
    if (registerState.images.length >= 5) {
      alert('[프리뷰] 이미지는 최대 5장까지입니다.');
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
