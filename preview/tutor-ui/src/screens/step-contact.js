import { registerState } from '../state.js';
import { syncContactFromForm } from '../form-collect.js';
import { saveAndNavigate, withSaving } from '../save-flow.js';
import { renderRegisterShell, renderNavButtons, renderTempNotice, bindGlobalEvents, navigate } from '../layout.js';
import { validatePromoUrls } from '../../../shared/promo-links.js';

export function renderContact() {
  const s = registerState;
  const content = `
    ${renderTempNotice('이미지 업로드는 경로만 저장 · 파일 업로드는 추후')}
    <form data-form="contact">
      <div class="form-group">
        <label class="form-label" for="contact_time_note">연락 가능 시간</label>
        <input class="form-input" id="contact_time_note" name="contact_time_note" value="${s.contact_time_note}" />
      </div>

      <h3 class="register-section-title">외부 홍보 링크 (상세등록)</h3>
      <p class="register-hint mb-4">외부 URL만 · 각 1개 · 빈값 허용</p>
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

      <div class="form-group">
        <label class="form-label" for="profile_status">저장 상태</label>
        <select class="form-input" id="profile_status" name="profile_status">
          <option value="draft" ${s.profile_status === 'draft' || s.profile_status === 'pending' ? 'selected' : ''}>저장 중</option>
          <option value="published" ${s.profile_status === 'published' ? 'selected' : ''}>공개 (운영 화면에서도 확인 권장)</option>
        </select>
        <p class="form-hint">공개는 등록한 본인이 확인한 뒤 전환하는 것을 권장합니다.</p>
      </div>
      ${renderNavButtons('/register/career', '등록 완료')}
    </form>`;
  return renderRegisterShell(content, { step: 5, title: '연락 · 사진', subtitle: '상세등록 완료 시 대표/추천 노출 자격' });
}

export function bindContactEvents(root) {
  bindGlobalEvents(root);
  const nextBtn = root.querySelector('[data-action="next"]');
  root.querySelector('[data-action="prev"]')?.addEventListener('click', () => navigate('/register/career'));
  nextBtn?.addEventListener('click', () => {
    withSaving(nextBtn, async () => {
      syncContactFromForm(root.querySelector('[data-form="contact"]'), registerState);
      const urlErr = validatePromoUrls(registerState);
      if (urlErr) {
        alert(urlErr);
        return;
      }
      await saveAndNavigate(registerState, 'contact', '/register/complete');
    });
  });
}
