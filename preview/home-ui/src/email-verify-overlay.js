/**
 * §16-2 — 이메일 인증 유도 (공개·쪽지·결제 등)
 */

let overlayRoot = null;

function ensureOverlay() {
  if (overlayRoot) return overlayRoot;
  overlayRoot = document.createElement('div');
  overlayRoot.className = 'email-verify-overlay';
  overlayRoot.hidden = true;
  overlayRoot.innerHTML = `
    <div class="email-verify-overlay__backdrop" data-action="close-email-verify"></div>
    <div class="email-verify-overlay__panel" role="dialog" aria-labelledby="email-verify-title">
      <h2 id="email-verify-title" class="email-verify-overlay__title">이메일 인증이 필요합니다</h2>
      <p class="email-verify-overlay__body">
        공개·쪽지·결제 등 일부 기능은 이메일 인증 후 이용할 수 있습니다.
        가입 시 사용한 메일함에서 인증 링크를 확인해 주세요.
      </p>
      <p class="email-verify-overlay__status" data-email-verify-status hidden></p>
      <div class="email-verify-overlay__actions">
        <button type="button" class="btn btn--primary" data-action="send-email-verify">인증 메일 보내기</button>
        <button type="button" class="btn btn--secondary" data-action="close-email-verify">닫기</button>
      </div>
    </div>`;
  document.body.appendChild(overlayRoot);

  overlayRoot.querySelectorAll('[data-action="close-email-verify"]').forEach((el) => {
    el.addEventListener('click', () => hideEmailVerifyOverlay());
  });

  overlayRoot.querySelector('[data-action="send-email-verify"]')?.addEventListener('click', async () => {
    const status = overlayRoot.querySelector('[data-email-verify-status]');
    const btn = overlayRoot.querySelector('[data-action="send-email-verify"]');
    if (btn) btn.disabled = true;
    try {
      const res = await fetch('/api/auth/email/send-verification.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: '{}',
      });
      const data = await res.json().catch(() => ({}));
      if (status) {
        status.hidden = false;
        status.textContent = data.message || (data.ok ? '인증 메일을 보냈습니다.' : '발송에 실패했습니다.');
      }
    } catch {
      if (status) {
        status.hidden = false;
        status.textContent = '인증 메일 발송에 실패했습니다.';
      }
    } finally {
      if (btn) btn.disabled = false;
    }
  });

  return overlayRoot;
}

export function showEmailVerifyOverlay() {
  const root = ensureOverlay();
  const status = root.querySelector('[data-email-verify-status]');
  if (status) {
    status.hidden = true;
    status.textContent = '';
  }
  root.hidden = false;
}

export function hideEmailVerifyOverlay() {
  if (overlayRoot) overlayRoot.hidden = true;
}

/** @param {unknown} err */
export function handleEmailVerifyApiError(err) {
  if (err && typeof err === 'object' && /** @type {{code?: string}} */ (err).code === 'email_verify_required') {
    showEmailVerifyOverlay();
    return true;
  }
  return false;
}
