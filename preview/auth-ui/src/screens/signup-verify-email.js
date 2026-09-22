import {
  renderRecoveryStage,
  renderRecoverySuccessIcon,
  renderRecoveryLinks,
} from '../recovery-stage.js';
import { bindGlobalEvents, navigate } from '../layout.js';
import { fetchMeApi } from '../auth-api.js';
import { formatResendCountdown } from '../password-reset-api.js';
import {
  classifyEmailVerifySendResult,
  emailVerifySendStatusMessage,
  isSignupEmailSendFailedFlag,
} from '../email-verify-send-status.js';
import {
  consumePostVerifyTarget,
  consumePostVerifyRole,
  getLoginReturnTo,
  resolveAfterAuthUrl,
  isOnEmailVerifyWait,
  basicRegisterPathForMe,
  uiRoleFromRoleType,
} from '../../../shared/auth-redirect.js';
import { parseHashQuery } from '../../../shared/preview-links.js';
import { signupState, setRole } from '../state.js';

const EMAIL_VERIFY_STALE_LINK_MSG = '이미 확인되었거나 만료된 링크입니다';

function friendlyVerifyError(raw) {
  return String(raw || '').trim() ? EMAIL_VERIFY_STALE_LINK_MSG : '';
}

function isInternalAuthEmail(email) {
  const e = String(email || '')
    .trim()
    .toLowerCase();
  return e.endsWith('@users.study114.local') || /^oauth_/i.test(e.split('@')[0] || '');
}

function maskEmail(email) {
  const e = String(email || '').trim();
  const at = e.indexOf('@');
  if (at < 1) return '';
  const local = e.slice(0, at);
  const domain = e.slice(at);
  const keep = local.slice(0, Math.min(2, local.length));
  return `${keep}***${domain}`;
}

function roleUiFromMeOrDraft(me) {
  return uiRoleFromRoleType(me?.role_type) || signupState.role || uiRoleFromRoleType(signupState.lastSignup?.roleType) || '';
}

function nextStepSentence(roleUi) {
  if (roleUi === 'study_room') return '확인이 끝나면 공부방 가입정보로 이어집니다.';
  if (roleUi === 'tutor') return '확인이 끝나면 과외쌤 가입정보로 이어집니다.';
  if (roleUi === 'student') return '확인이 끝나면 학생 기본정보로 이어집니다.';
  return '확인이 끝나면 선택한 유형의 기본정보로 이어집니다.';
}

function continueLabel(roleUi) {
  if (roleUi === 'study_room') return '공부방 가입정보 입력';
  if (roleUi === 'tutor') return '과외쌤 가입정보 입력';
  if (roleUi === 'student') return '학생 기본정보 입력';
  return '기본정보 입력';
}

function successLead(roleUi) {
  if (roleUi === 'study_room') return '가입이 완료되었습니다. 이제 공부방 가입정보를 입력합니다.';
  if (roleUi === 'tutor') return '가입이 완료되었습니다. 이제 과외쌤 가입정보를 입력합니다.';
  if (roleUi === 'student') return '가입이 완료되었습니다. 이제 학생 기본정보를 입력합니다.';
  return '가입이 완료되었습니다. 이제 기본정보를 입력합니다.';
}

function applyRoleCopy(root, roleUi) {
  const next = root.querySelector('[data-verify-next]');
  if (next) next.textContent = nextStepSentence(roleUi);
  const lead = root.querySelector('[data-verify-success-lead]');
  if (lead) lead.textContent = successLead(roleUi);
  const btn = root.querySelector('[data-action="continue-verified"]');
  if (btn) btn.textContent = continueLabel(roleUi);
}

function continueAfterVerified(me) {
  // 목적지는 서버 역할과 기본정보 필요 여부만 사용한다.
  consumePostVerifyTarget();
  consumePostVerifyRole();
  const returnTo = getLoginReturnTo();
  const roleUi = uiRoleFromRoleType(me?.role_type);
  if (roleUi) setRole(roleUi);
  if (me?.needs_basic_register) {
    navigate(basicRegisterPathForMe(me));
    return;
  }
  window.location.href = resolveAfterAuthUrl(me, returnTo);
}

function initialMailSendFailed() {
  const q = parseHashQuery();
  if (isSignupEmailSendFailedFlag(q.send)) return true;
  if (signupState.lastSignup && signupState.lastSignup.emailSent === false) return true;
  return false;
}

function renderWaitBody(err) {
  return `
        <h1 class="auth-heading" data-verify-title>이메일을 확인해 주세요</h1>
        <p class="auth-subheading recovery-stage__desc" data-verify-lead>
          확인 메일을 보냈습니다. 메일 안의 링크를 눌러야 가입이 완료됩니다.
        </p>
        <p class="form-hint" data-verify-hint-inbox>받은편지함에서 확인 메일을 열어 주세요. 보이지 않으면 <strong>스팸함·프로모션함</strong>도 확인해 주세요.</p>
        <p class="form-hint" data-verify-next>${esc(nextStepSentence(roleUiFromMeOrDraft()))}</p>
        <p class="form-hint">메일이 바로 보이지 않으면 잠시 후 다시 확인해 주세요. 다시 보내기는 10분 뒤에 할 수 있습니다.</p>
        ${err ? `<p class="form-error" role="alert">${esc(err)}</p>` : ''}
        <p class="recovery-stage__email-hint" data-masked-email></p>
        <p class="form-error" data-verify-status hidden role="alert"></p>
        <div class="recovery-actions">
          <button type="button" class="btn btn--primary btn--block" data-action="resend-verify">확인 메일 다시 보내기</button>
        </div>
        ${renderRecoveryLinks({ signup: false })}
      `;
}

function renderSendFailedBody() {
  return `
        <h1 class="auth-heading" data-verify-title>계정은 만들어졌지만 확인 메일을 보내지 못했습니다</h1>
        <p class="auth-subheading recovery-stage__desc" data-verify-lead>
          잠시 후 확인 메일을 다시 보내 주세요.
        </p>
        <p class="form-hint" data-verify-hint-inbox>이메일 주소를 확인한 뒤 재전송할 수 있어요.</p>
        <p class="recovery-stage__email-hint" data-masked-email></p>
        <p class="form-error" data-verify-status hidden role="alert"></p>
        <div class="recovery-actions">
          <button type="button" class="btn btn--primary btn--block" data-action="resend-verify">확인 메일 다시 보내기</button>
        </div>
        ${renderRecoveryLinks({ signup: false })}
      `;
}

export function renderSignupVerifyEmail() {
  const q = parseHashQuery();
  const verified = q.verified === '1';
  const err = friendlyVerifyError(q.email_verify_error);
  const sendFailed = !verified && initialMailSendFailed();

  const body = verified
    ? `
        ${renderRecoverySuccessIcon()}
        <h1 class="auth-heading">이메일이 확인되었습니다</h1>
        <p class="auth-subheading recovery-stage__desc" data-verify-success-lead>${esc(successLead(roleUiFromMeOrDraft()))}</p>
        <p class="form-hint" data-verify-next>${esc(nextStepSentence(roleUiFromMeOrDraft()))}</p>
        <button type="button" class="btn btn--primary btn--block" data-action="continue-verified">${esc(continueLabel(roleUiFromMeOrDraft()))}</button>
      `
    : sendFailed
      ? renderSendFailedBody()
      : renderWaitBody(err);

  return renderRecoveryStage(
    `<div data-verify-wait data-mail-send-failed="${sendFailed ? '1' : '0'}">${body}</div>`,
  );
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function markHashSendSuccess() {
  try {
    const url = new URL(window.location.href);
    const raw = (url.hash || '#/signup/verify-email').replace(/^#/, '');
    const qIndex = raw.indexOf('?');
    const path = qIndex >= 0 ? raw.slice(0, qIndex) : raw;
    const params = new URLSearchParams(qIndex >= 0 ? raw.slice(qIndex + 1) : '');
    params.set('send', '1');
    url.hash = `#${path}?${params.toString()}`;
    window.history.replaceState(null, '', url);
  } catch {
    /* ignore */
  }
  if (signupState.lastSignup) {
    signupState.lastSignup.emailSent = true;
  }
}

function applyWaitCopyAfterSuccessfulResend(root) {
  const wrap = root.querySelector('[data-verify-wait]');
  if (wrap) wrap.setAttribute('data-mail-send-failed', '0');
  const title = root.querySelector('[data-verify-title]');
  if (title) title.textContent = '이메일을 확인해 주세요';
  const lead = root.querySelector('[data-verify-lead]');
  if (lead) {
    lead.textContent = '확인 메일을 보냈습니다. 메일 안의 링크를 눌러야 가입이 완료됩니다.';
  }
  const hint = root.querySelector('[data-verify-hint-inbox]');
  if (hint) {
    hint.innerHTML =
      '받은편지함에서 확인 메일을 열어 주세요. 보이지 않으면 <strong>스팸함·프로모션함</strong>도 확인해 주세요.';
  }
  markHashSendSuccess();
}

export function bindSignupVerifyEmailEvents(root) {
  bindGlobalEvents(root);
  const q = parseHashQuery();
  const verifiedFromLink = q.verified === '1';
  let mailSendFailed = initialMailSendFailed();

  const applyCooldown = (seconds) => {
    const btn = root.querySelector('[data-action="resend-verify"]');
    if (!btn) return;
    let left = Math.max(0, Math.ceil(Number(seconds) || 0));
    if (left <= 0) {
      btn.disabled = false;
      btn.textContent = '확인 메일 다시 보내기';
      return;
    }
    btn.disabled = true;
    const tick = () => {
      if (left <= 0) {
        btn.disabled = false;
        btn.textContent = '확인 메일 다시 보내기';
        return;
      }
      btn.textContent = `메일 다시 보내기 (${formatResendCountdown(left)})`;
      left -= 1;
      window.setTimeout(tick, 1000);
    };
    tick();
  };

  const setStatus = (text, { asError = true } = {}) => {
    const status = root.querySelector('[data-verify-status]');
    if (!status) return;
    status.hidden = false;
    status.className = asError ? 'form-error' : 'form-hint';
    status.setAttribute('role', asError ? 'alert' : 'status');
    status.textContent = text;
  };

  const sendVerify = async ({ silent } = {}) => {
    const btn = root.querySelector('[data-action="resend-verify"]');
    if (btn) btn.disabled = true;
    try {
      const res = await fetch('/api/auth/email/send-verification.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: '{}',
      });
      const data = await res.json().catch(() => ({}));
      const kind = classifyEmailVerifySendResult(data, { httpOk: res.ok });
      const wait = Number(data.resend_available_in ?? 0);

      if (kind === 'already_verified') {
        const me = await fetchMeApi();
        continueAfterVerified(me);
        return;
      }

      if (kind === 'success') {
        applyCooldown(wait > 0 ? wait : 0);
        if (mailSendFailed) {
          mailSendFailed = false;
          applyWaitCopyAfterSuccessfulResend(root);
        }
        if (!silent) {
          setStatus(emailVerifySendStatusMessage('success'), { asError: false });
        }
        return;
      }

      if (kind === 'cooldown') {
        applyCooldown(wait);
        if (!silent) {
          setStatus(
            emailVerifySendStatusMessage('cooldown', wait, { formatCountdown: formatResendCountdown }),
            { asError: false },
          );
        } else if (mailSendFailed) {
          // 가입 직후 발송 실패 화면: 자동 재전송이 쿨다운이면 실패 화면을 유지하고 버튼만 대기
          setStatus(
            emailVerifySendStatusMessage('cooldown', wait, { formatCountdown: formatResendCountdown }),
            { asError: false },
          );
        }
        return;
      }

      // fail
      if (btn) {
        btn.disabled = false;
        btn.textContent = '확인 메일 다시 보내기';
      }
      if (!silent || mailSendFailed) {
        setStatus(emailVerifySendStatusMessage('fail'));
      }
    } catch {
      setStatus(emailVerifySendStatusMessage('fail'));
      if (btn) {
        btn.disabled = false;
        btn.textContent = '확인 메일 다시 보내기';
      }
    }
  };

  root.querySelector('[data-action="continue-verified"]')?.addEventListener('click', async () => {
    const me = await fetchMeApi();
    continueAfterVerified(me);
  });

  root.querySelector('[data-action="resend-verify"]')?.addEventListener('click', () => sendVerify());

  fetchMeApi()
    .then((me) => {
      if (!me.authenticated) {
        navigate('/login');
        return;
      }
      if (me.needs_account_contact) {
        window.location.href = resolveAfterAuthUrl(me, getLoginReturnTo());
        return;
      }
      if (isInternalAuthEmail(me.email)) {
        if (!isOnEmailVerifyWait()) {
          window.location.replace(resolveAfterAuthUrl(me, getLoginReturnTo()));
        }
        return;
      }
      applyRoleCopy(root, roleUiFromMeOrDraft(me));
      if (me.email_verified) {
        if (verifiedFromLink) return;
        continueAfterVerified(me);
        return;
      }
      const hint = root.querySelector('[data-masked-email]');
      if (hint) hint.textContent = maskEmail(me.email);

      // 가입 직후 발송 실패: 자동 재전송하지 않음 (정상 발송 문구·오인 방지)
      if (mailSendFailed) return;
      sendVerify({ silent: true });
    })
    .catch(() => navigate('/login'));
}
