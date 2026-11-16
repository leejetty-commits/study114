/**
 * 홈과 찾기가 나눠 가진 등록·지역 화면값.
 * 비밀번호·토큰·2차 비밀번호·결제 키는 넣지 않는다.
 */

import {
  clearSnapshotStorage,
  notifySnapshotInvalidated,
  readSnapshotStorage,
  writeSnapshotStorage,
} from './snap-clear.js';

const SECRET_KEY = /password|passwd|token|secret|otp|payment|card|cvv|authorization/i;

/** @type {{ user_id: number, role_type: string }|null} */
let bound = null;

/**
 * @param {unknown} value
 * @param {number} [depth]
 */
function stripSecrets(value, depth = 0) {
  if (depth > 6 || value == null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((item) => stripSecrets(item, depth + 1));
  /** @type {Record<string, unknown>} */
  const out = {};
  for (const [key, item] of Object.entries(value)) {
    if (SECRET_KEY.test(key)) continue;
    out[key] = stripSecrets(item, depth + 1);
  }
  return out;
}

function readRaw() {
  const data = readSnapshotStorage();
  if (!data || !Number.isFinite(Number(data.user_id)) || typeof data.role_type !== 'string' || !data.role_type) {
    return null;
  }
  return data;
}

export function forgetSnapshotBinding() {
  bound = null;
}

export function clearSessionSnapshot() {
  bound = null;
  clearSnapshotStorage();
}

/** @param {{ user_id?: number, role_type?: string }|null|undefined} user */
export function bindSnapshotUser(user) {
  const userId = Number(user?.user_id);
  const roleType = String(user?.role_type || '');
  if (!Number.isFinite(userId) || userId <= 0 || !roleType) {
    bound = null;
    return;
  }
  bound = { user_id: userId, role_type: roleType };
}

/**
 * user_id·role_type 이 같을 때만 스냅샷을 돌려준다. 다르면 지운다.
 * @param {{ user_id?: number, role_type?: string }|null|undefined} user
 */
export function takeMatchingSnapshot(user) {
  const snap = readRaw();
  if (!snap || !user) return null;
  if (Number(snap.user_id) !== Number(user.user_id) || snap.role_type !== String(user.role_type || '')) {
    clearSessionSnapshot();
    return null;
  }
  bindSnapshotUser(user);
  return snap;
}

/**
 * @param {Record<string, unknown>|null} current
 */
function baseFrom(current) {
  if (!bound) return null;
  const same =
    current && Number(current.user_id) === bound.user_id && current.role_type === bound.role_type
      ? current
      : null;
  return {
    user_id: bound.user_id,
    role_type: bound.role_type,
    saved_at: Date.now(),
    registrations: same?.registrations && typeof same.registrations === 'object' ? same.registrations : {},
    providerStatus: same?.providerStatus ?? null,
    chrome: same?.chrome && typeof same.chrome === 'object' ? same.chrome : null,
    roomHomeList: same?.roomHomeList,
    roi: same?.roi,
    studentDemand: same?.studentDemand,
  };
}

/** @param {Record<string, unknown>} partial */
export function patchSessionSnapshot(partial) {
  if (!bound) return;
  const current = readRaw();
  const next = baseFrom(current && Number(current.user_id) === bound.user_id ? current : null);
  if (!next) return;
  if (partial.registrations && typeof partial.registrations === 'object') {
    next.registrations = { ...next.registrations, ...stripSecrets(partial.registrations) };
  }
  if (Object.prototype.hasOwnProperty.call(partial, 'providerStatus')) {
    next.providerStatus = stripSecrets(partial.providerStatus);
  }
  if (Object.prototype.hasOwnProperty.call(partial, 'chrome')) {
    next.chrome = stripSecrets(partial.chrome);
  }
  if (Object.prototype.hasOwnProperty.call(partial, 'roomHomeList')) next.roomHomeList = stripSecrets(partial.roomHomeList);
  if (Object.prototype.hasOwnProperty.call(partial, 'roi')) next.roi = stripSecrets(partial.roi);
  if (Object.prototype.hasOwnProperty.call(partial, 'studentDemand')) next.studentDemand = stripSecrets(partial.studentDemand);
  writeSnapshotStorage(next);
}

/** @param {'studyRooms'|'tutors'|'students'} kind */
export function invalidateRegistrationSnapshot(kind) {
  const current = readRaw();
  if (current?.registrations && typeof current.registrations === 'object' && kind) {
    delete current.registrations[kind];
  }
  if (current && kind === 'studyRooms') {
    delete current.roomHomeList;
    delete current.roi;
    delete current.studentDemand;
  }
  if (current) {
    current.saved_at = Date.now();
    writeSnapshotStorage(current);
  }
  notifySnapshotInvalidated(kind);
}
