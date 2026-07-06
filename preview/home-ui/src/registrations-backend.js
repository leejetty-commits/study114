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

export async function hydrateRegistrationsCache() {
  const [studentsRes, roomsRes, tutorsRes] = await Promise.all([
    listStudents().catch(() => ({ students: [] })),
    listStudyRooms().catch(() => ({ rooms: [] })),
    listTutors().catch(() => ({ tutors: [] })),
  ]);
  studentsCache = (studentsRes.students ?? []).map((s) => ({ ...s }));
  studyRoomsCache = (roomsRes.rooms ?? []).map((r) => ({ ...r }));
  tutorsCache = (tutorsRes.tutors ?? []).map((t) => ({ ...t }));
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
