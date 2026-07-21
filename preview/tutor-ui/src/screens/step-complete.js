import { registerState } from '../state.js';
import { renderRegisterShell, renderTempNotice, bindGlobalEvents } from '../layout.js';
import { homeUiUrl } from '../../../shared/preview-links.js';

export function renderComplete() {
  const s = registerState;
  const content = `
    <div class="panel text-center mb-6">
      <div style="font-size:3rem;line-height:1;margin-bottom:var(--space-4);">✓</div>
      <h2 class="auth-heading" style="font-size:var(--text-2xl);">과외쌤 등록 완료</h2>
      <p class="auth-subheading">tutor_id: <strong>${s.tutor_id ?? '—'}</strong> · profile_status: <strong>${s.profile_status}</strong></p>
      <p class="auth-subheading">상세등록: <strong>${s.detail_completion_status}</strong></p>
    </div>
    ${renderTempNotice('기본등록은 임시 저장 상태 · 상세등록 완료 후 일반 목록/검색 · 그다음 대표/추천 노출 구매')}
    <dl class="register-summary">
      <dt>표시명</dt><dd>${s.tutor_display_name}</dd>
      <dt>주력과목</dt><dd>${s.main_subject_note}</dd>
      <dt>월 대표 과외비</dt><dd>${s.preferred_fee_amount ? Number(s.preferred_fee_amount).toLocaleString('ko-KR') + '원' : '—'}</dd>
      <dt>강의장소</dt><dd>${s.lesson_places.join(', ') || '—'}</dd>
    </dl>
    <div class="register-nav" style="border-top:none;padding-top:var(--space-4);">
      <a href="#/register/basic" class="btn btn--secondary" data-nav="/register/basic">처음부터 수정</a>
      <a href="${homeUiUrl('tutor')}" class="btn btn--primary">과외쌤 메인으로</a>
    </div>`;
  return renderRegisterShell(content, { step: 6, title: '등록 완료', subtitle: '가입 완료 후 상세등록 CTA (2·9장)' });
}

export function bindCompleteEvents(root) {
  bindGlobalEvents(root);
}
