/**
 * 13장 ↔ 24·25장 handoff 브리지 — search-ui 결과행 · compare · P24 상세
 */

import { isWishlisted, isInCompare } from '@home-ui/user-actions-state.js';
import { isLoggedIn } from '@home-ui/auth-session.js';
import { WISH_LABELS } from '@home-ui/handoff-copy.js';

/** @param {import('../state.js').SearchTab} tab */
export function tabToKind(tab) {
  if (tab === 'room') return 'study_room';
  if (tab === 'tutor') return 'tutor';
  return 'student';
}

/** @param {import('../state.js').SearchTab} tab @param {import('../state.js').ViewerRole} role */
export function canUseCompare(tab, role) {
  return role !== 'guest' && (tab === 'room' || tab === 'tutor');
}

/**
 * @param {import('../state.js').SearchTab} tab
 * @param {Record<string, unknown>} item
 */
export function mapSearchItemToDetail(tab, item) {
  const id = Number(item.id);
  if (tab === 'room') {
    const summary = String(item.summary || '');
    return {
      id,
      study_room_name: String(item.title || '공부방'),
      location_label: String(item.region_label || ''),
      main_subject_note: summary.split('\n')[0] || '—',
      intro_short: summary,
      price_amount: item.price_amount ?? null,
      inquiry_status: 'open',
      compare_eligible: true,
      profile_status: 'published',
      grade_band: '—',
    };
  }
  if (tab === 'tutor') {
    const summary = String(item.summary || '');
    return {
      id,
      tutor_display_name: String(item.title || '과외쌤'),
      location_label: String(item.region_label || ''),
      main_subject_note: summary.split('\n')[0] || '—',
      intro_short: summary,
      preferred_fee_amount: item.preferred_fee_amount ?? null,
      lessons_per_week: 2,
      minutes_per_lesson: 90,
      fee_basis_type: 'monthly_by_weekly_schedule',
      lesson_places: ['student_home_visit'],
      compare_eligible: true,
      profile_status: 'published',
    };
  }
  return {
    id,
    public_display_name: String(item.title || '학습 요청'),
    grade_level: String(item.grade_level || '—'),
    subject_label: String(item.subject_name || item.summary || '—'),
    location_label: String(item.region_label || ''),
    exposure_status: 'published',
    preferred_lesson_type: 'tutor',
  };
}

/**
 * @param {import('../state.js').SearchTab} tab
 * @param {Record<string, unknown>} item
 * @param {import('../state.js').ViewerRole} role
 */
export function renderSearchRowActions(tab, item, role) {
  const kind = tabToKind(tab);
  const id = Number(item.id);
  const guest = role === 'guest';

  if (tab === 'student') {
    if (guest || role === 'parent') {
      return `<button type="button" class="btn btn--secondary btn--sm" disabled title="역할 제한">상세</button>`;
    }
    return `<button type="button" class="btn btn--secondary btn--sm" data-action="search-open-detail" data-search-kind="student" data-search-id="${id}">상세</button>`;
  }

  if (!canUseCompare(tab, role)) {
    return `
      <button type="button" class="btn btn--secondary btn--sm" data-action="compare-guest-blocked" data-compare-kind="${kind}">⇄ 비교</button>
      <button type="button" class="btn btn--secondary btn--sm" data-action="search-open-detail" data-search-kind="${kind}" data-search-id="${id}">상세</button>`;
  }

  const wished = isWishlisted(kind, id);
  const inCmp = isInCompare(kind, id);
  return `
    <button type="button" class="btn btn--secondary btn--sm${wished ? ' is-active' : ''}" data-action="wish-toggle" data-item-kind="${kind}" data-item-id="${id}">${wished ? WISH_LABELS.remove : WISH_LABELS.add}</button>
    <button type="button" class="btn btn--secondary btn--sm${inCmp ? ' is-active' : ''}" data-action="compare-toggle" data-item-kind="${kind}" data-item-id="${id}">⇄ ${inCmp ? '비교 해제' : '비교'}</button>
    <button type="button" class="btn btn--primary btn--sm" data-action="search-open-detail" data-search-kind="${kind}" data-search-id="${id}">상세</button>`;
}

/** @param {import('../state.js').ViewerRole} role */
export function resolveSearchViewer(role) {
  if (role === 'guest') return 'guest';
  return role;
}

export function isSearchLoggedIn() {
  return isLoggedIn();
}
