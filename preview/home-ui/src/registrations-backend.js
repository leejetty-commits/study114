/**
 * P19~21 — 등록 허브 영속 레이어 (API 캐시 · sessionStorage fallback)
 */

import {
  listStudents,
  patchStudent,
  listStudyRooms,
  patchStudyRoom,
  listTutors,
  patchTutor,
} from './registrations-api.js';
import { authRoleType } from './auth-role.js';

function loadSnapshot() {
  return import('../../shared/session-snapshot.js');
}

let apiMode = false;

/** @type {object[]} */
let studentsCache = [];
/** @type {object[]} */
let studyRoomsCache = [];
/** @type {object[]} */
let tutorsCache = [];

export function isRegistrationsApiMode() {
  return apiMode;
}

function resetCaches() {
  studentsCache = [];
  studyRoomsCache = [];
  tutorsCache = [];
}

export async function activateRegistrationsApi() {
  apiMode = true;
  await hydrateRegistrationsCache();
}

export function deactivateRegistrationsApi() {
  apiMode = false;
  resetCaches();
}

/**
 * GET 허용 역할만 호출한다. 게스트·다른 역할은 요청 자체를 만들지 않는다.
 * students=guardian_student · study-rooms=study_room_owner · tutors=tutor
 * @param {string} roleType
 * @returns {'students'|'studyRooms'|'tutors'|''}
 */
function registrationListForRole(roleType) {
  if (roleType === 'guardian_student') return 'students';
  if (roleType === 'study_room_owner') return 'studyRooms';
  if (roleType === 'tutor') return 'tutors';
  return '';
}

/** 같은 계정 스냅샷으로 등록 목록을 먼저 채운다. 네트워크가 성공하면 그 값으로 바꾼다. */
export function seedRegistrationsFromSnapshot(registrations) {
  const reg = registrations && typeof registrations === 'object' ? registrations : null;
  if (!reg) return;
  apiMode = true;
  if (Array.isArray(reg.studyRooms)) studyRoomsCache = reg.studyRooms.map((row) => ({ ...row }));
  if (Array.isArray(reg.tutors)) tutorsCache = reg.tutors.map((row) => ({ ...row }));
  if (Array.isArray(reg.students)) studentsCache = reg.students.map((row) => ({ ...row }));
}

/** 키 순서가 달라도 같은 등록 목록이면 같은 문자열이 되게 한다. */
function stableValue(value) {
  if (Array.isArray(value)) return value.map((item) => stableValue(item));
  if (value && typeof value === 'object') {
    /** @type {Record<string, unknown>} */
    const out = {};
    for (const key of Object.keys(value).sort()) out[key] = stableValue(value[key]);
    return out;
  }
  return value;
}

/** 홈·찾기 재렌더를 지역 목록이 바뀔 때만 하게 하는 비교 문자열. */
export function registrationsPaintSignature() {
  return JSON.stringify(stableValue({
    studyRooms: studyRoomsCache,
    tutors: tutorsCache,
    students: studentsCache,
  }));
}

async function rememberRegistrationsSnapshot() {
  const { patchSessionSnapshot } = await loadSnapshot();
  patchSessionSnapshot({
    registrations: {
      studyRooms: studyRoomsCache,
      tutors: tutorsCache,
      students: studentsCache,
    },
  });
}

async function invalidateSavedRegistration(kind) {
  const { invalidateRegistrationSnapshot } = await loadSnapshot();
  invalidateRegistrationSnapshot(kind);
}

export async function hydrateRegistrationsCache() {
  const kind = registrationListForRole(authRoleType());
  if (kind !== 'students') studentsCache = [];
  if (kind !== 'studyRooms') studyRoomsCache = [];
  if (kind !== 'tutors') tutorsCache = [];
  try {
    if (kind === 'students') {
      const studentsRes = await listStudents();
      studentsCache = (studentsRes.students ?? []).map((row) => ({ ...row }));
    } else if (kind === 'studyRooms') {
      const roomsRes = await listStudyRooms();
      studyRoomsCache = (roomsRes.rooms ?? []).map((row) => ({ ...row }));
    } else if (kind === 'tutors') {
      const tutorsRes = await listTutors();
      tutorsCache = (tutorsRes.tutors ?? []).map((row) => ({ ...row }));
    } else {
      return;
    }
    await rememberRegistrationsSnapshot();
  } catch (err) {
    console.warn('[registrations] hydrate kept previous cache', err);
  }
}

export function getStudentsCache() {
  return studentsCache.map((s) => ({ ...s }));
}

export function getStudyRoomsCache() {
  return studyRoomsCache.map((r) => ({ ...r }));
}

export function getTutorsCache() {
  return tutorsCache.map((t) => ({ ...t }));
}

function upsertStudent(row) {
  const idx = studentsCache.findIndex((s) => s.id === row.id);
  const copy = { ...row };
  if (idx >= 0) studentsCache[idx] = copy;
  else studentsCache.push(copy);
  return copy;
}

function upsertStudyRoom(row) {
  const idx = studyRoomsCache.findIndex((r) => r.id === row.id);
  const copy = { ...row };
  if (idx >= 0) studyRoomsCache[idx] = copy;
  else studyRoomsCache.push(copy);
  return copy;
}

function upsertTutor(row) {
  const idx = tutorsCache.findIndex((t) => t.id === row.id);
  const copy = { ...row };
  if (idx >= 0) tutorsCache[idx] = copy;
  else tutorsCache.push(copy);
  return copy;
}

function removeStudent(id) {
  studentsCache = studentsCache.filter((s) => s.id !== id);
}

function removeStudyRoom(id) {
  studyRoomsCache = studyRoomsCache.filter((r) => r.id !== id);
}

function removeTutor(id) {
  tutorsCache = tutorsCache.filter((t) => t.id !== id);
}

export async function apiStudentAction(id, action, body = {}) {
  const data = await patchStudent(id, action, body);
  if (data.deleted) {
    removeStudent(id);
  } else if (data.student) {
    upsertStudent(data.student);
  }
  await invalidateSavedRegistration('students');
  await rememberRegistrationsSnapshot();
  return data;
}

export async function apiStudyRoomAction(id, action, body = {}) {
  const data = await patchStudyRoom(id, action, body);
  if (data.deleted) {
    removeStudyRoom(id);
  } else if (data.room) {
    upsertStudyRoom(data.room);
  }
  await invalidateSavedRegistration('studyRooms');
  await rememberRegistrationsSnapshot();
  return data;
}

export async function apiTutorAction(id, action, body = {}) {
  const data = await patchTutor(id, action, body);
  if (data.deleted) {
    removeTutor(id);
  } else if (data.tutor) {
    upsertTutor(data.tutor);
  }
  await invalidateSavedRegistration('tutors');
  await rememberRegistrationsSnapshot();
  return data;
}

/** API 모드 캐시에 과외 레코드 패치 (사진 업로드 직후 UI 반영) */
export function patchTutorInCache(id, patch) {
  const cur = tutorsCache.find((t) => t.id === id);
  if (!cur) return null;
  return upsertTutor({ ...cur, ...patch });
}
