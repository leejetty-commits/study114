import { registerState } from '../state.js';
import { syncContactFromForm } from '../form-collect.js';
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

export function renderContact() {
  const s = registerState;
  const content = `
    ${renderGuideNotice('상세등록 마지막 단계입니다. 연락 가능 시간과 공개 여부를 확인한 뒤 등록을 마쳐 주세요. 사진 파일 업로드는 곧 연결됩니다.')}
    <form data-form="contact">
      ${renderSectionTitle('연락 · 공개')}
      <div class="form-group">
        <label class="form-label" for="contact_time_note">연락 가능 시간</label>
        <input class="form-input" id="contact_time_note" name="contact_time_note" value="${s.contact_time_note}" placeholder="예: 평일 18:00~22:00" />
      </div>

      ${renderSectionTitle('외부 홍보 링크')}
      <p class="register-hint mb-4">선택 사항입니다. 유튜브·페이스북·인스타그램 주소를 넣을 수 있습니다.</p>
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
        <label class="form-label" for="profile_status">공개 상태</label>
        <select class="form-input" id="profile_status" name="profile_status">
          <option value="draft" ${s.profile_status === 'draft' || s.profile_status === 'pending' ? 'selected' : ''}>저장만 (아직 비공개)</option>
          <option value="published" ${s.profile_status === 'published' ? 'selected' : ''}>공개</option>
        </select>
        <p class="form-hint">공개는 내용을 확인한 뒤 켜 주세요.</p>
      </div>
      ${renderNavButtons('/register/lesson', '등록 완료')}
    </form>`;
  return renderRegisterShell(content, {
    stepKey: 'contact',
    title: '연락 · 공개',
    subtitle: '상세등록 2/2 · 마무리 후 목록·검색에 활용됩니다.',
  });
}

export function bindContactEvents(root) {
  bindGlobalEvents(root);
  const nextBtn = root.querySelector('[data-action="next"]');
  root.querySelector('[data-action="prev"]')?.addEventListener('click', () => navigate('/register/lesson'));
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
