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
import {
  allowBasicInThisTab,
  listenVerifyPing,
  markMailTab,
  markWaitTab,
  pingVerified,
} from '../../../shared/email-verify-tab.js';
import { AUTH_WELCOME_COPY } from '../../../shared/auth-welcome-copy.js';

const EMAIL_VERIFY_STALE_LINK_MSG = '이미 확인되었거나 만료된 링크입니다';
let stopWaitWatch = () => {};

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
  const copy = AUTH_WELCOME_COPY.verify;
  if (roleUi === 'study_room') return copy.nextStudyRoom;
  if (roleUi === 'tutor') return copy.nextTutor;
  if (roleUi === 'student') return copy.nextStudent;
  return copy.nextDefault;
}

function continueLabel(roleUi) {
  if (roleUi === 'study_room') return '공부방 가입정보 입력';
  if (roleUi === 'tutor') return '과외쌤 가입정보 입력';
  if (roleUi === 'student') return '학생 기본정보 입력';
  return '기본정보 입력';
}

function applyRoleCopy(root, roleUi) {
  const next = root.querySelector('[data-verify-next]');
  if (next && !root.querySelector('[data-verify-new-tab]')) {
    next.textContent = nextStepSentence(roleUi);
  }
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
        <h1 class="auth-heading" data-verify-title>${AUTH_WELCOME_COPY.verify.waitTitle}</h1>
        <p class="auth-subheading recovery-stage__desc" data-verify-lead>
          ${AUTH_WELCOME_COPY.verify.waitLead}
        </p>
        <p class="form-note form-note--accent" data-verify-new-tab>${AUTH_WELCOME_COPY.verify.waitTab}</p>
        <p class="form-hint" data-verify-next>${AUTH_WELCOME_COPY.verify.waitNext}</p>
        <p class="form-hint">${AUTH_WELCOME_COPY.verify.waitDelay}</p>
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
        <h1 class="auth-heading" data-verify-title>${AUTH_WELCOME_COPY.verify.failTitle}</h1>
        <p class="auth-subheading recovery-stage__desc" data-verify-lead>
          ${AUTH_WELCOME_COPY.verify.failLead}
        </p>
        <p class="form-hint" data-verify-hint-inbox>${AUTH_WELCOME_COPY.verify.failHint}</p>
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
        <h1 class="auth-heading">${AUTH_WELCOME_COPY.verify.doneTitle}</h1>
        <p class="auth-subheading recovery-stage__desc" data-verify-success-lead>${AUTH_WELCOME_COPY.verify.doneLead}</p>
        <p class="form-note form-note--accent">${AUTH_WELCOME_COPY.verify.doneNote}</p>
        <button type="button" class="btn btn--secondary btn--block" data-action="continue-fallback">이 창에서 이어가기</button>
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
  if (title) title.textContent = AUTH_WELCOME_COPY.verify.waitTitle;
  const lead = root.querySelector('[data-verify-lead]');
  if (lead) {
    lead.textContent = AUTH_WELCOME_COPY.verify.waitLead;
  }
  const hint = root.querySelector('[data-verify-hint-inbox]');
  if (hint) {
    hint.textContent = AUTH_WELCOME_COPY.verify.inboxHint;
  }
  const tabCopy = AUTH_WELCOME_COPY.verify.waitTab;
  let tabNote = root.querySelector('[data-verify-new-tab]');
  if (!tabNote && lead) {
    tabNote = document.createElement('p');
    tabNote.className = 'form-note form-note--accent';
    tabNote.setAttribute('data-verify-new-tab', '');
    lead.insertAdjacentElement('afterend', tabNote);
  }
  if (tabNote) tabNote.textContent = tabCopy;
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

  root.querySelector('[data-action="continue-fallback"]')?.addEventListener('click', async () => {
    allowBasicInThisTab();
    const me = await fetchMeApi();
    if (!me.email_verified) return;
    continueAfterVerified(me);
  });

  root.querySelector('[data-action="resend-verify"]')?.addEventListener('click', () => sendVerify());

  const startWaitTabVerifyWatch = () => {
    stopWaitWatch();
    let stopped = false;
    let checking = false;
    const stop = () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', check);
      unlisten();
    };
    const check = async () => {
      if (stopped || checking || document.hidden) return;
      checking = true;
      try {
        const latest = await fetchMeApi();
        if (stopped || !latest.email_verified) return;
        stop();
        continueAfterVerified(latest);
      } catch {
        /* 다음 주기에 서버를 다시 조회한다 */
      } finally {
        checking = false;
      }
    };
    const onVisible = () => {
      if (!document.hidden) check();
    };
    const unlisten = listenVerifyPing(() => {
      if (!document.hidden) check();
    });
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', check);
    const timer = window.setInterval(check, 2500);
    stopWaitWatch = stop;
  };

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
      if (verifiedFromLink) {
        markMailTab();
        pingVerified();
        return;
      }
      markWaitTab();
      if (me.email_verified) {
        continueAfterVerified(me);
        return;
      }
      startWaitTabVerifyWatch();
      const hint = root.querySelector('[data-masked-email]');
      if (hint) hint.textContent = maskEmail(me.email);

      // 가입 직후 발송 실패: 자동 재전송하지 않음 (정상 발송 문구·오인 방지)
      if (mailSendFailed) return;
      sendVerify({ silent: true });
    })
    .catch(() => navigate('/login'));
}
