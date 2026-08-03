import { registerState } from '../state.js';
import { renderRegisterShell, renderGuideNotice, bindGlobalEvents, mypageRegistrationsUrl } from '../layout.js';
import { homeUiUrl } from '../../../shared/preview-links.js';

export function renderComplete() {
  const s = registerState;
  const content = `
    <div class="register-complete">
      <div class="register-complete__icon" aria-hidden="true">✓</div>
      <h2 class="register-complete__title">과외쌤 등록이 완료되었습니다</h2>
      <p class="register-complete__thanks">수고하셨습니다!</p>
      <p class="register-complete__lead">작성해 주신 정보는 검색·목록에 반영됩니다. 대표·추천 노출은 유료 상품에서 이어갈 수 있습니다.</p>
    </div>
    ${renderGuideNotice('내용을 다시 손보고 싶으면 마이페이지 · 내 등록에서 수정할 수 있습니다.')}
    <dl class="register-summary">
      <dt>표시명</dt><dd>${s.tutor_display_name || '—'}</dd>
      <dt>주력과목</dt><dd>${s.main_subject_note || '—'}</dd>
      <dt>월 대표 과외비</dt><dd>${s.preferred_fee_amount ? Number(s.preferred_fee_amount).toLocaleString('ko-KR') + '원' : '—'}</dd>
      <dt>강의장소</dt><dd>${(s.lesson_places || []).length ? s.lesson_places.join(', ') : '—'}</dd>
    </dl>
    <div class="register-nav" style="border-top:none;padding-top:var(--space-2);">
      <a href="${mypageRegistrationsUrl()}" class="btn btn--secondary">마이페이지에서 수정</a>
      <a href="${homeUiUrl('tutor')}" class="btn btn--primary">과외쌤 메인으로</a>
    </div>`;
  return renderRegisterShell(content, {
    stepKey: 'complete',
    title: '등록 완료',
    subtitle: '',
  });
}

export function bindCompleteEvents(root) {
  bindGlobalEvents(root);
}
