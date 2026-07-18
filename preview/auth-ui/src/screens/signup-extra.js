/**
 * signup/extra는 사용자-facing 독립 단계가 아님 (Notion 14장 §9).
 * 지역 2~3·공개용 세부값은 상세등록 책임 → 가입완료로 넘긴다.
 */
import { bindGlobalEvents, navigate } from '../layout.js';
import { parseHashQuery } from '../../../shared/preview-links.js';
import { resolvePostLoginUrl } from '../../../shared/auth-redirect.js';
import { signupState } from '../state.js';

export function renderSignupExtra() {
  return '<div class="panel"><p class="auth-subheading">상세등록으로 이동합니다…</p></div>';
}

export function bindSignupExtraEvents(root) {
  bindGlobalEvents(root);
  const oauthMode = parseHashQuery().from === 'oauth';
  if (oauthMode) {
    const role = signupState.role || 'tutor';
    const roleType = role === 'study_room' ? 'study_room_owner' : 'tutor';
    window.location.href = resolvePostLoginUrl(roleType);
    return;
  }
  navigate('/signup/complete');
}
