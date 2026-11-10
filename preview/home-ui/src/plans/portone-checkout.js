/**
 * 339 — 포트원 Browser SDK V2 (로컬·테스트 채널).
 * CDN 로드 후 PortOne.requestPayment. payMethod=CARD.
 */

const SDK_URL = 'https://cdn.portone.io/v2/browser-sdk.js';

/** @type {Promise<any>|null} */
let sdkPromise = null;

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
      existing.addEventListener('error', () => reject(new Error('포트원 SDK 로드 실패')));
      return;
    }
    const script = document.createElement('script');
    script.src = SDK_URL;
    script.async = true;
    script.onload = () => {
      if (!window.PortOne) {
        reject(new Error('포트원 SDK를 찾을 수 없습니다.'));
        return;
      }
      resolve(window.PortOne);
    };
    script.onerror = () => reject(new Error('포트원 SDK 로드 실패'));
    document.head.appendChild(script);
  });
  return sdkPromise;
}

/**
 * @param {{
 *   storeId: string,
 *   channelKey: string,
 *   paymentId: string,
 *   orderName: string,
 *   totalAmount: number,
 *   currency?: string,
 * }} params
 * @returns {Promise<{ ok: true, paymentId: string } | { ok: false, kind: 'cancel'|'fail', message: string }>}
 */
export async function requestPortOneCardPayment(params) {
  const PortOne = await loadSdk();
  const response = await PortOne.requestPayment({
    storeId: params.storeId,
    channelKey: params.channelKey,
    paymentId: params.paymentId,
    orderName: params.orderName,
    totalAmount: params.totalAmount,
    currency: params.currency || 'CURRENCY_KRW',
    payMethod: 'CARD',
  });

  if (response == null) {
    return {
      ok: false,
      kind: 'cancel',
      message: '결제가 취소되었습니다. 주문은 미결제 상태입니다.',
    };
  }

  const code = response.code != null ? String(response.code) : '';
  if (code !== '') {
    const msg = String(response.message || '');
    const canceled =
      /cancel|취소|closed|user/i.test(code) ||
      /취소|닫|cancel/i.test(msg);
    return {
      ok: false,
      kind: canceled ? 'cancel' : 'fail',
      message: canceled
        ? '결제가 취소되었습니다. 주문은 미결제 상태입니다.'
        : msg || '결제에 실패했습니다. 주문은 미결제 상태입니다.',
    };
  }

  return {
    ok: true,
    paymentId: String(response.paymentId || params.paymentId),
  };
}
