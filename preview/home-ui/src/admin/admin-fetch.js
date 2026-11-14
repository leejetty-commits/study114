/** 닷홈이 4xx JSON을 HTML로 바꾸므로 관리자 API는 soft-error로 받는다. */

/** @type {(() => Promise<void> | void) | null} */
let onUnlockRequired = null;
let unlockRefresh = null;

/** 콘솔 잠금이 풀렸을 때 세션을 다시 받고 잠금 화면으로 돌아간다. */
export function setConsoleUnlockRequiredHandler(handler) {
  onUnlockRequired = handler;
}

function noteConsoleUnlockRequired() {
  if (unlockRefresh || typeof onUnlockRequired !== 'function') return;
  unlockRefresh = Promise.resolve(onUnlockRequired()).finally(() => {
    unlockRefresh = null;
  });
}

export function adminFetch(url, options = {}) {
  const headers = {
    'X-Study114-Soft-Error': '1',
    ...(options.headers || {}),
  };
  return fetch(url, {
    credentials: 'include',
    ...options,
    headers,
  }).then(async (res) => {
    const data = await res.clone().json().catch(() => null);
    if (data && data.ok === false && data.error === 'console_unlock_required') {
      noteConsoleUnlockRequired();
    }
    return res;
  });
}

/** @param {Response} res @param {unknown} data */
export function adminHttpStatus(res, data) {
  const fromBody = data && typeof data === 'object' && 'http_status' in data
    ? data.http_status
    : undefined;
  return Number(fromBody ?? res.status);
}
