/**
 * 25장 §8 P25-S10 — 관심 학생 (Provider)
 * API 모드: /api/handoff/student-reviews.php
 */

import { EXPOSURE_STUDENTS } from './exposure-data.js';
import {
  isHandoffApiMode,
  getStudentReviewCache,
  optimisticToggleStudentReview,
  optimisticRemoveStudentReview,
} from './handoff-backend.js';

const KEY = 'study114-preview-student-review';
const MAX = 50;

/** @typedef {{ id: number, savedAt: string, providerRole?: 'tutor'|'study_room'|null }} StudentReviewEntry */

function loadAll() {
  if (isHandoffApiMode()) return getStudentReviewCache();
  try {
    const raw = sessionStorage.getItem(KEY);
    return /** @type {StudentReviewEntry[]} */ (raw ? JSON.parse(raw) : []);
  } catch {
    return [];
  }
}

function saveAll(list) {
  if (isHandoffApiMode()) return;
  sessionStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
}

export function getStudentReviewIds() {
  return loadAll().map((e) => e.id);
}

/** @param {number|string} id */
export function isInStudentReview(id) {
  return loadAll().some((e) => e.id === Number(id));
}

/** @returns {Array<object & { savedAt: string, providerRole?: string|null }>} */
export function getStudentReviewItems() {
  return loadAll()
    .map((entry) => {
      const student = EXPOSURE_STUDENTS.find((s) => s.id === entry.id);
      if (!student) return null;
      return { ...student, savedAt: entry.savedAt, providerRole: entry.providerRole };
    })
    .filter(Boolean);
}

/**
 * @param {number|string} id
 * @param {{ providerRole?: 'tutor'|'study_room' }} [opts]
 * @returns {boolean} now in review
 */
export function toggleStudentReview(id, opts = {}) {
  const numId = Number(id);
  if (isHandoffApiMode()) {
    return optimisticToggleStudentReview(numId, opts.providerRole ?? null);
  }
  const list = loadAll();
  const idx = list.findIndex((e) => e.id === numId);
  if (idx >= 0) {
    list.splice(idx, 1);
    saveAll(list);
    return false;
  }
  list.unshift({
    id: numId,
    savedAt: new Date().toISOString(),
    providerRole: opts.providerRole || null,
  });
  saveAll(list);
  return true;
}

/** @param {number|string} id */
export function removeStudentReview(id) {
  const numId = Number(id);
  if (isHandoffApiMode()) {
    optimisticRemoveStudentReview(numId);
    return;
  }
  saveAll(loadAll().filter((e) => e.id !== numId));
}

/** 25§10 lifecycle 뱃지 체험용 — API 모드 시 스킵 */
export function ensureStudentReviewDemo() {
  if (isHandoffApiMode()) return;
  if (loadAll().length > 0) return;
  toggleStudentReview(1, { providerRole: 'tutor' });
  toggleStudentReview(4, { providerRole: 'tutor' });
}
