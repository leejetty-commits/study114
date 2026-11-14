/** 닷홈이 4xx JSON을 HTML로 바꾸므로 관리자 API는 soft-error로 받는다. */
export function adminFetch(url, options = {}) {
  const headers = {
    'X-Study114-Soft-Error': '1',
    ...(options.headers || {}),
  };
  return fetch(url, {
    credentials: 'include',
    ...options,
    headers,
  });
}

/** @param {Response} res @param {unknown} data */
export function adminHttpStatus(res, data) {
  const fromBody = data && typeof data === 'object' && 'http_status' in data
    ? data.http_status
    : undefined;
  return Number(fromBody ?? res.status);
}
