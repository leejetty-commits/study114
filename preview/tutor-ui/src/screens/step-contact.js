import { registerState } from '../state.js';
import { syncContactFromForm } from '../form-collect.js';
import { saveAndNavigate, withSaving } from '../save-flow.js';
import { renderRegisterShell, renderNavButtons, renderTempNotice, bindGlobalEvents, navigate } from '../layout.js';

export function renderContact() {
  const s = registerState;
  const content = `
    ${renderTempNotice('이미지 업로드는 경로만 저장 · 파일 업로드는 추후')}
    <form data-form="contact">
      <div class="form-group">
        <label class="form-label" for="contact_time_note">연락 가능 시간</label>
        <span class="field-db-name">contact_time_note</span>
        <input class="form-input" id="contact_time_note" name="contact_time_note" value="${s.contact_time_note}" />
      </div>
      <div class="form-group">
        <label class="form-label" for="youtube_url">YouTube (상세등록 1개)</label>
        <span class="field-db-name">youtube_url</span>
        <input class="form-input" type="url" id="youtube_url" name="youtube_url" value="${s.youtube_url}" placeholder="https://www.youtube.com/..." />
      </div>
      <div class="form-group">
        <label class="form-label" for="profile_status">저장 상태</label>
        <span class="field-db-name">profile_status</span>
        <select class="form-input" id="profile_status" name="profile_status">
          <option value="draft" ${s.profile_status === 'draft' ? 'selected' : ''}>draft</option>
          <option value="pending" ${s.profile_status === 'pending' ? 'selected' : ''}>pending</option>
          <option value="published" ${s.profile_status === 'published' ? 'selected' : ''}>published</option>
        </select>
      </div>
      ${renderNavButtons('/register/career', '등록 완료')}
    </form>`;
  return renderRegisterShell(content, { step: 5, title: '연락 · 사진', subtitle: '8장 §9 · 상세등록 완료 시 Prime/Pick 자격' });
}

export function bindContactEvents(root) {
  bindGlobalEvents(root);
  const nextBtn = root.querySelector('[data-action="next"]');
  root.querySelector('[data-action="prev"]')?.addEventListener('click', () => navigate('/register/career'));
  nextBtn?.addEventListener('click', () => {
    withSaving(nextBtn, async () => {
      syncContactFromForm(root.querySelector('[data-form="contact"]'), registerState);
      await saveAndNavigate(registerState, 'contact', '/register/complete');
    });
  });
}
