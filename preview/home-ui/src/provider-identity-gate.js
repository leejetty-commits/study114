/**
 * 365 — 공부방·과외쌤 공통 쪽지 허용 본인인증 카드.
 * SMS OTP(phone-verify-gate)는 쓰지 않음(유지·미사용).
 */

const SDK_URL = 'https://cdn.portone.io/v2/browser-sdk.js';

/** @type {Promise<any>|null} */
let sdkPromise = null;

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function loadSdk() {
  if (sdkPromise) return sdkPromise;
  if (typeof window !== 'undefined' && window.PortOne) {
    sdkPromise = Promise.resolve(window.PortOne);
    return sdkPromise;
  }
  sdkPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SDK_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.PortOne));
      existing.addEventListener('error', () => reject(new Error('sdk')));
      return;
    }
    const script = document.createElement('script');
    script.src = SDK_URL;
    script.async = true;
    script.onload = () => {
      if (!window.PortOne) {
        reject(new Error('sdk'));
        return;
      }
      resolve(window.PortOne);
    };
    script.onerror = () => reject(new Error('sdk'));
    document.head.appendChild(script);
  });
  return sdkPromise;
}

function formatVerifiedDate(iso) {
  if (!iso) return '';
  const d = new Date(String(iso).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function showMiniToast(message) {
  const existing = document.getElementById('p365-identity-toast');
  existing?.remove();
  const el = document.createElement('div');
  el.id = 'p365-identity-toast';
  el.className = 'p365-identity-toast';
  el.setAttribute('role', 'status');
  el.textContent = message;
  document.body.appendChild(el);
  window.setTimeout(() => el.remove(), 2800);
}

/**
 * @param {{ verified?: boolean, verified_at?: string|null }} identity
 */
export function renderProviderIdentityGate(identity) {
  const verified = Boolean(identity?.verified);
  const dateLine = verified ? formatVerifiedDate(identity?.verified_at) : '';
  if (verified) {
    return `
      <div class="p365-identity" data-p365-identity data-verified="1" aria-label="본인인증 상태">
        <p class="p365-identity__badge">본인인증 완료${dateLine ? ` · ${esc(dateLine)}` : ''}</p>
      </div>`;
  }
  return `
    <div class="p365-identity" data-p365-identity data-verified="0" aria-label="본인인증 안내">
      <p class="p365-identity__lead">쪽지를 받으려면 본인인증이 한 번 필요해요</p>
      <p class="p365-identity__error is-hidden" data-p365-identity-error role="alert"></p>
      <button type="button" class="btn btn--primary p365-identity__btn" data-p365-identity-start>본인인증하기</button>
    </div>`;
}

/**
 * @param {HTMLElement} root
 * @param {{ onVerified?: (status: { verified: boolean, verified_at?: string|null }) => void | Promise<void> }} [opts]
 */
export function bindProviderIdentityGate(root, opts = {}) {
  const card = root.querySelector('[data-p365-identity]');
  if (!card || card.getAttribute('data-verified') === '1') return;

  const btn = card.querySelector('[data-p365-identity-start]');
  const errEl = card.querySelector('[data-p365-identity-error]');
  if (!(btn instanceof HTMLButtonElement)) return;

  const showError = (msg) => {
    if (!(errEl instanceof HTMLElement)) return;
    if (!msg) {
      errEl.textContent = '';
      errEl.classList.add('is-hidden');
      return;
    }
    errEl.textContent = msg;
    errEl.classList.remove('is-hidden');
  };

  btn.addEventListener('click', async () => {
    showError('');
    btn.disabled = true;
    const prev = btn.textContent;
    btn.textContent = '인증 확인 중…';
    try {
      const cfgRes = await fetch('/api/auth/identity-verification/config.php', {
        credentials: 'include',
      });
      const cfg = await cfgRes.json().catch(() => ({}));
      if (!cfgRes.ok || !cfg.ok) {
        showError('본인인증을 시작할 수 없어요. 잠시 후 다시 시도해 주세요.');
        return;
      }
      if (cfg.identity?.verified) {
        showMiniToast('본인인증이 완료되었어요.');
        await opts.onVerified?.(cfg.identity);
        return;
      }

      const PortOne = await loadSdk();
      const identityVerificationId = String(cfg.identity_verification_id || '');
      if (!identityVerificationId) {
        showError('본인인증을 시작할 수 없어요. 잠시 후 다시 시도해 주세요.');
        return;
      }
      const customerId = String(cfg.customer_id || '');
      /** @type {Record<string, unknown>} */
      const req = {
        storeId: String(cfg.store_id || ''),
        identityVerificationId,
        channelKey: String(cfg.channel_key || ''),
        bypass: {
          inicisUnified: {
            flgFixedUser: 'N',
          },
        },
      };
      if (customerId) {
        req.customer = { customerId };
      }
      const response = await PortOne.requestIdentityVerification(req);

      if (response?.code != null && String(response.code) !== '') {
        showError('본인인증이 완료되지 않았어요. 다시 시도해 주세요.');
        return;
      }

      const completeRes = await fetch('/api/auth/identity-verification/complete.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identityVerificationId }),
      });
      const complete = await completeRes.json().catch(() => ({}));
      if (!completeRes.ok || !complete.ok) {
        if (complete.error === 'identity_duplicate') {
          showError('이미 다른 계정에서 인증된 정보예요. 고객센터로 문의해 주세요');
          return;
        }
        showError('본인인증이 완료되지 않았어요. 다시 시도해 주세요.');
        return;
      }

      showMiniToast('본인인증이 완료되었어요.');
      await opts.onVerified?.(complete.identity || { verified: true });
    } catch {
      showError('본인인증이 완료되지 않았어요. 다시 시도해 주세요.');
    } finally {
      btn.disabled = false;
      btn.textContent = prev || '본인인증하기';
    }
  });
}

/**
 * 미인증이면 수신 ON 라디오를 잠근다.
 * @param {HTMLElement} page
 * @param {boolean} verified
 */
export function lockInquiryReceivingUntilVerified(page, verified) {
  if (verified) return;
  page.querySelectorAll(
    'input[name="p20_inquiry_receiving"][value="1"], input[name="p21_inquiry_receiving"][value="1"]',
  ).forEach((input) => {
    if (!(input instanceof HTMLInputElement)) return;
    input.disabled = true;
    input.closest('label')?.classList.add('is-disabled');
  });
}
