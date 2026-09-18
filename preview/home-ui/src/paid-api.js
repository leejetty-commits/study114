/**
 * 18a — P18-02 ROI REST client
 * 배선: public/api/paid/roi.php
 */

const CREDENTIALS = { credentials: 'include' };

export const PAID_ENDPOINTS = {
  roi: '/api/paid/roi.php',
  status: '/api/paid/status.php',
  requestAccess: '/api/paid/request-access.php',
  checkout: '/api/paid/checkout.php',
  notices: '/api/paid/notices.php',
  history: '/api/paid/history.php',
  catalog: '/api/paid/catalog.php',
  waitlist: '/api/paid/waitlist.php',
};

async function parseJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    const err = new Error(data.message || `HTTP ${res.status}`);
    err.code = data.error;
    err.status = res.status;
    throw err;
  }
  return data;
}

/** @param {number} [days] */
export async function fetchRoiSummary(days = 7) {
  const qs = days > 0 ? `?days=${days}` : '';
  const res = await fetch(`${PAID_ENDPOINTS.roi}${qs}`, { ...CREDENTIALS });
  return parseJson(res);
}

/** @param {number} [days]
 * @param {{ regionBasisType?: string, regionId?: string|number, complexId?: string|number, slotGroup?: string, providerType?: string, providerId?: string|number }} [region]
 */
export async function fetchPaidStatus(days = 7, region = {}) {
  const params = new URLSearchParams();
  if (days > 0) params.set('days', String(days));
  if (region.regionBasisType) params.set('region_basis_type', String(region.regionBasisType));
  if (region.regionId != null && String(region.regionId) !== '') {
    params.set('region_id', String(region.regionId));
  }
  if (region.complexId != null && String(region.complexId) !== '') {
    params.set('complex_id', String(region.complexId));
  }
  if (region.slotGroup) params.set('slot_group', String(region.slotGroup));
  if (region.providerType) params.set('provider_type', String(region.providerType));
  if (region.providerId != null && String(region.providerId) !== '') {
    params.set('provider_id', String(region.providerId));
  }
  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${PAID_ENDPOINTS.status}${qs}`, { ...CREDENTIALS });
  return parseJson(res);
}

export async function fetchRequestAccessList() {
  const res = await fetch(PAID_ENDPOINTS.requestAccess, { ...CREDENTIALS });
  return parseJson(res);
}

/** @param {number} studentId */
export async function fetchRequestAccessStatus(studentId) {
  const res = await fetch(`${PAID_ENDPOINTS.requestAccess}?student_id=${studentId}`, {
    ...CREDENTIALS,
  });
  return parseJson(res);
}

/** @param {number} studentId */
export async function unlockStudentRequest(studentId) {
  const res = await fetch(PAID_ENDPOINTS.requestAccess, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    ...CREDENTIALS,
    body: JSON.stringify({ student_id: studentId }),
  });
  return parseJson(res);
}

export async function fetchProviderNotices() {
  const res = await fetch(PAID_ENDPOINTS.notices, { ...CREDENTIALS });
  return parseJson(res);
}

/** @param {number} noticeId */
export async function markProviderNoticeRead(noticeId) {
  const res = await fetch(PAID_ENDPOINTS.notices, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    ...CREDENTIALS,
    body: JSON.stringify({ action: 'mark_read', notice_id: noticeId }),
  });
  return parseJson(res);
}

export async function fetchPaidCatalog(providerType) {
  const qs =
    providerType === 'study_room' || providerType === 'tutor'
      ? `?provider_type=${encodeURIComponent(providerType)}`
      : '';
  const res = await fetch(`${PAID_ENDPOINTS.catalog}${qs}`, { ...CREDENTIALS });
  return parseJson(res);
}

/** @param {string} productId @param {string} variant
 * @param {{ providerType?: 'study_room'|'tutor', providerId?: string|number, studentId?: number, body?: string, badgeCodes?: string[], regionBasisType?: string, regionId?: string|number, complexId?: string|number, slotGroup?: string, regionLabel?: string, cityId?: string|number, primarySubjectId?: string|number }} [ctx]
 */
export async function createPaidCheckout(productId, variant, ctx = {}) {
  const body = {
    action: 'create',
    product_id: productId,
    variant,
  };
  if (ctx.providerType && ctx.providerId != null && String(ctx.providerId) !== '') {
    body.provider_type = ctx.providerType;
    body.provider_id = Number(ctx.providerId);
  }
  if (ctx.studentId) {
    body.student_id = Number(ctx.studentId);
  }
  if (ctx.body) {
    body.body = String(ctx.body);
  }
  if (Array.isArray(ctx.badgeCodes) && ctx.badgeCodes.length) {
    body.badge_codes = ctx.badgeCodes.map(String).slice(0, 2);
  }
  if (ctx.regionBasisType) body.region_basis_type = String(ctx.regionBasisType);
  if (ctx.regionId != null && String(ctx.regionId) !== '') body.region_id = Number(ctx.regionId);
  if (ctx.complexId != null && String(ctx.complexId) !== '') body.complex_id = Number(ctx.complexId);
  if (ctx.slotGroup) body.slot_group = String(ctx.slotGroup);
  if (ctx.regionLabel) body.region_label = String(ctx.regionLabel);
  if (ctx.cityId != null && String(ctx.cityId) !== '') body.city_id = Number(ctx.cityId);
  if (ctx.primarySubjectId != null && String(ctx.primarySubjectId) !== '') {
    body.primary_subject_id = Number(ctx.primarySubjectId);
  }
  // 클라이언트 금액·할인·무료혜택은 전송하지 않는다 (서버 PaidCatalog 재계산)
  const res = await fetch(PAID_ENDPOINTS.checkout, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    ...CREDENTIALS,
    body: JSON.stringify(body),
  });
  return parseJson(res);
}

/** @param {string} orderRef */
export async function completePaidCheckout(orderRef) {
  const res = await fetch(PAID_ENDPOINTS.checkout, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    ...CREDENTIALS,
    body: JSON.stringify({ action: 'complete', order_ref: orderRef }),
  });
  return parseJson(res);
}

/** @param {number} [limit] */
export async function fetchPaidHistory(limit = 50) {
  const qs = limit > 0 ? `?limit=${limit}` : '';
  const res = await fetch(`${PAID_ENDPOINTS.history}${qs}`, { ...CREDENTIALS });
  return parseJson(res);
}

/** @param {number|string} studyRoomId */
export async function fetchPrimeWaitlist(studyRoomId) {
  const qs = `?study_room_id=${encodeURIComponent(String(studyRoomId))}`;
  const res = await fetch(`${PAID_ENDPOINTS.waitlist}${qs}`, { ...CREDENTIALS });
  return parseJson(res);
}

/**
 * @param {number|string} studyRoomId
 * @param {{ slot_group?: string, region_label?: string, region_basis_type?: string, region_id?: number|string, complex_id?: number|string }} [payload]
 */
export async function registerPrimeWaitlist(studyRoomId, payload = {}) {
  const res = await fetch(PAID_ENDPOINTS.waitlist, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    ...CREDENTIALS,
    body: JSON.stringify({
      action: 'register',
      provider_type: 'study_room',
      exposure_type: 'prime',
      study_room_id: Number(studyRoomId),
      ...payload,
    }),
  });
  return parseJson(res);
}

/** @param {number|string} studyRoomId @param {number|string} waitlistId */
export async function cancelPrimeWaitlist(studyRoomId, waitlistId) {
  const res = await fetch(PAID_ENDPOINTS.waitlist, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    ...CREDENTIALS,
    body: JSON.stringify({
      action: 'cancel',
      study_room_id: Number(studyRoomId),
      waitlist_id: Number(waitlistId),
    }),
  });
  return parseJson(res);
}
