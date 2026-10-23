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

export async function hydrateRegistrationsCache() {
  const kind = registrationListForRole(authRoleType());
  if (kind !== 'students') studentsCache = [];
  if (kind !== 'studyRooms') studyRoomsCache = [];
  if (kind !== 'tutors') tutorsCache = [];
  if (kind === 'students') {
    const studentsRes = await listStudents().catch(() => ({ students: [] }));
    studentsCache = (studentsRes.students ?? []).map((s) => ({ ...s }));
    return;
  }
  if (kind === 'studyRooms') {
    const roomsRes = await listStudyRooms().catch(() => ({ rooms: [] }));
    studyRoomsCache = (roomsRes.rooms ?? []).map((r) => ({ ...r }));
    return;
  }
  if (kind === 'tutors') {
    const tutorsRes = await listTutors().catch(() => ({ tutors: [] }));
    tutorsCache = (tutorsRes.tutors ?? []).map((t) => ({ ...t }));
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
    return data;
  }
  if (data.student) upsertStudent(data.student);
  return data;
}

export async function apiStudyRoomAction(id, action, body = {}) {
  const data = await patchStudyRoom(id, action, body);
  if (data.deleted) {
    removeStudyRoom(id);
    return data;
  }
  if (data.room) upsertStudyRoom(data.room);
  return data;
}

export async function apiTutorAction(id, action, body = {}) {
  const data = await patchTutor(id, action, body);
  if (data.deleted) {
    removeTutor(id);
    return data;
  }
  if (data.tutor) upsertTutor(data.tutor);
  return data;
}

/** API 모드 캐시에 과외 레코드 패치 (사진 업로드 직후 UI 반영) */
export function patchTutorInCache(id, patch) {
  const cur = tutorsCache.find((t) => t.id === id);
  if (!cur) return null;
  return upsertTutor({ ...cur, ...patch });
}
