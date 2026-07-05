/**
 * 25장 §10 — Lifecycle-aware basket 뱃지 (찜 · 최근열람 · 검토함)
 */

import { EXPOSURE_STUDENTS } from './exposure-data.js';
import { LIFECYCLE_BASKET, STUDENT_REVIEW } from './handoff-copy.js';
import { profileStatusLabel } from './lifecycle-copy.js';
import { inquiryStatusLabel } from './study-room-reg/format.js';
import { getExposureItem } from './user-actions-state.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

/**
 * @param {'study_room'|'tutor'|'student'} kind
 * @param {object} item
 * @returns {{ label: string, variant: 'warn'|'info', muted: boolean } | null}
 */
export function resolveBasketLifecycleBadge(kind, item) {
  if (!item) return null;

  if (kind === 'study_room') {
    const ps = item.profile_status || 'published';
    if (ps !== 'published') {
      return {
        label: ps === 'hidden' ? LIFECYCLE_BASKET.profileStopped : profileStatusLabel(ps),
        variant: 'warn',
        muted: true,
      };
    }
    const inq = item.inquiry_status || 'open';
    if (inq === 'paused' || inq === 'capacity_full') {
      return { label: inquiryStatusLabel(inq), variant: 'warn', muted: true };
    }
    if (inq === 'waiting_only') {
      return { label: inquiryStatusLabel(inq), variant: 'info', muted: false };
    }
    return null;
  }

  if (kind === 'tutor') {
    const ps = item.profile_status || 'published';
    if (ps !== 'published') {
      return {
        label: ps === 'hidden' ? LIFECYCLE_BASKET.profileStopped : profileStatusLabel(ps),
        variant: 'warn',
        muted: true,
      };
    }
    return null;
  }

  if (kind === 'student') {
    const es = item.exposure_status || 'published';
    if (es !== 'published') {
      return { label: STUDENT_REVIEW.lifecycleHidden, variant: 'warn', muted: true };
    }
    return null;
  }

  return null;
}

/**
 * @param {'study_room'|'tutor'|'student'} kind
 * @param {object} item
 */
export function renderBasketLifecycleBadge(kind, item) {
  const badge = resolveBasketLifecycleBadge(kind, item);
  if (!badge) return '';
  return `<span class="handoff-lifecycle-badge handoff-lifecycle-badge--${badge.variant}">${esc(badge.label)}</span>`;
}

/** @param {object} item @param {'study_room'|'tutor'|'student'} kind */
export function isBasketLifecycleMuted(item, kind) {
  return resolveBasketLifecycleBadge(kind, item)?.muted === true;
}

/**
 * @param {{ kind: 'study_room'|'tutor'|'student', id: number }} entry
 */
export function resolveBasketItem(entry) {
  if (entry.kind === 'student') {
    return EXPOSURE_STUDENTS.find((s) => s.id === entry.id) || null;
  }
  return getExposureItem(entry.kind, entry.id);
}
