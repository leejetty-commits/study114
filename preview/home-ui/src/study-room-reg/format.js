/** P20 — 공부방 레코드 라벨 · study-room-ui 딥링크 · 노출 행 */

import { profileStatusLabel } from '../lifecycle-copy.js';
import { STUDY_ROOM_REGISTER_URL, HOME_UI_BASE } from '../nav-config.js';
import { formatMonthlyWon } from '../exposure-format.js';
import { studyRoomHubPath, studyRoomSectionPath } from './router.js';
import { getPublishReadiness } from './store.js';
import {
  DETAIL_STATUS_LABELS,
  PRODUCT_APPLY,
} from './study-room-reg-copy.js';
import {
  operatorInquirySummary,
} from './inquiry-display.js';

/** @typedef {import('./store.js').StudyRoomRecord} StudyRoomRecord */

export { profileStatusLabel };

/** @param {string} status */
export function inquiryStatusLabel(status) {
  return operatorInquirySummary(status);
}

/** @param {string} status */
export function detailStatusLabel(status) {
  return DETAIL_STATUS_LABELS[status] || status || '—';
}

/** @param {StudyRoomRecord} room */
export function formatRoomSummaryLine(room) {
  const parts = [room.main_subject_note, room.region_label].filter(Boolean);
  if (room.price_amount) parts.push(formatMonthlyWon(room.price_amount));
  return parts.join(' · ') || '—';
}

/**
 * @param {StudyRoomRecord} room
 * @param {{ image_path?: string, slogan?: string }} [extra]
 */
export function roomToExposureRow(room, extra = {}) {
  return {
    id: room.id,
    study_room_name: room.study_room_name,
    location_label: room.region_label || '—',
    main_subject_note: room.main_subject_note || '—',
    grade_band: room.grade_band || '—',
    price_amount: room.price_amount,
    intro_short: room.intro_short || '',
    slogan: extra.slogan ?? room.slogan ?? room.intro_short ?? '',
    feature_1: room.feature_1 || '',
    career_years: room.career_years,
    education_office_registered: room.education_office_registered,
    weekend_available: room.weekend_available,
    one_on_one_available: room.one_on_one_available,
    lesson_place_type: room.lesson_place_type === 'academy' ? 'office' : 'home',
    capacity_per_time: room.capacity_per_time || '—',
    facility_summary: room.facility_summary || '—',
    profile_status: room.profile_status,
    compare_eligible: room.compare_eligible,
    image_path: extra.image_path || room.image_path || '',
    image_path_basic: extra.image_path || room.image_path_basic || room.image_path || '',
    inquiry_status: room.inquiry_status,
  };
}

/**
 * @param {'basic'|'location'|'lesson'|'career'|'facility'|'detail'} step
 * @param {number} roomId
 * @param {{ returnSection?: 'hub'|'basic'|'detail'|'publish' }} [opts]
 */
export function studyRoomUiDeepLink(step, roomId, opts = {}) {
  const returnSection = opts.returnSection || 'hub';
  const returnPath =
    returnSection === 'hub' ? studyRoomHubPath(roomId) : studyRoomSectionPath(roomId, returnSection);
  const returnTo = encodeURIComponent(`${HOME_UI_BASE}#${returnPath}`);
  const base = STUDY_ROOM_REGISTER_URL.replace(/#\/register\/basic$/, '');
  return `${base}#/register/${step}?room_id=${roomId}&edit=1&return_to=${returnTo}`;
}

/**
 * tier-check missing → 이유 문구 (최대 3개 + 「외 n」)
 * @param {Array<{ id?: string, label?: string }|string>|null|undefined} missing
 */
export function formatTierMissingReason(missing) {
  /** @type {string[]} */
  const labels = [];
  if (Array.isArray(missing)) {
    for (const item of missing) {
      const label = item && typeof item === 'object' ? String(item.label || '') : String(item || '');
      if (label) labels.push(label);
    }
  }
  if (!labels.length) return null;
  if (labels.length <= 3) return labels.join(', ');
  return `${labels.slice(0, 3).join(', ')} 외 ${labels.length - 3}`;
}

/**
 * @param {'prime'|'pick'} type
 * @param {{ can_buy?: boolean, missing?: Array<{ id?: string, label?: string }|string> }|null|undefined} side
 * @param {'loading'|'ready'|'error'|string|undefined} phase
 */
function productMatrixRow(type, side, phase) {
  const label = type === 'prime' ? '프라임 카드' : '픽 카드';
  if (phase === 'loading' || (phase === 'ready' && !side) || !phase) {
    return { key: type, label, ok: false, reason: '확인 중', statusText: '확인 중' };
  }
  if (phase === 'error') {
    return { key: type, label, ok: false, reason: '확인 실패', statusText: '확인 실패' };
  }
  const reason = formatTierMissingReason(side?.missing);
  const ok = side?.can_buy === true && !reason;
  return {
    key: type,
    label,
    ok,
    reason,
    statusText: ok ? PRODUCT_APPLY.eligible : reason || '항목 부족',
  };
}

/**
 * @param {StudyRoomRecord} room
 * @param {import('./store.js').PublishReadiness} readiness
 * @param {{ phase?: string, pick?: { can_buy?: boolean, missing?: Array<{ id?: string, label?: string }|string> }|null, prime?: { can_buy?: boolean, missing?: Array<{ id?: string, label?: string }|string> }|null }|null} [tierCheck]
 */
export function getExposureMatrix(room, readiness, tierCheck = null) {
  const visible = room.profile_status !== 'hidden';
  const phase = tierCheck?.phase;

  return [
    {
      key: 'search',
      label: '기본 검색',
      ok: visible,
      reason: !visible ? '숨김 상태' : null,
      statusText: null,
    },
    {
      key: 'compare',
      label: '비교검색',
      ok: visible && room.compare_eligible !== false,
      reason: !visible ? '숨김 상태' : room.compare_eligible === false ? '비교 자격 미충족' : null,
      statusText: null,
    },
    productMatrixRow('prime', tierCheck?.prime, phase),
    productMatrixRow('pick', tierCheck?.pick, phase),
  ];
}

/**
 * P20-05 §7-1 블록 순서용 상세 노출 행
 * @param {StudyRoomRecord} room
 * @param {import('./store.js').PublishReadiness} readiness
 * @param {{ phase?: string, pick?: object|null, prime?: object|null }|null} [tierCheck]
 */
export function getExposureDetailBlocks(room, readiness, tierCheck = null) {
  const visible = room.profile_status !== 'hidden';
  const phase = tierCheck?.phase;
  const prime = productMatrixRow('prime', tierCheck?.prime, phase);
  const pick = productMatrixRow('pick', tierCheck?.pick, phase);

  const capacityHint =
    room.inquiry_status === 'capacity_full'
      ? '정원 마감 — 신규 문의 제한'
      : room.inquiry_status === 'paused' || room.inquiry_status === 'waiting_only'
        ? '쪽지 안 받음 — 신규 문의 제한'
        : '쪽지 받는 중';

  return [
    {
      key: 'search',
      label: '검색 노출',
      ok: visible,
      reason: !visible ? '숨김 상태' : null,
    },
    {
      key: 'compare',
      label: '비교검색 표시',
      ok: visible && room.compare_eligible !== false,
      reason: !visible ? '숨김 상태' : room.compare_eligible === false ? '비교 자격 미충족' : null,
    },
    {
      key: 'region',
      label: '지도/지역 노출',
      ok: visible && room.has_regions,
      reason: !room.has_regions ? '지역 미등록' : !visible ? '숨김 상태' : null,
    },
    {
      key: 'capacity',
      label: '쪽지 수신',
      ok: room.inquiry_status === 'open',
      reason: capacityHint,
    },
    { ...prime, label: '대표 노출 상품' },
    { ...pick, label: '추천 노출 상품' },
  ];
}

/** @param {StudyRoomRecord} room */
export function getHubCtas(room) {
  if (room.profile_status === 'hidden') {
    return [
      { label: '등록점검', path: 'publish', primary: true },
      { label: '쪽지설정', path: 'inquiries', primary: false },
      { label: '구매이력', path: 'plans', external: '#/mypage/plans', primary: false },
    ];
  }
  if (room.profile_status === 'draft') {
    return [
      { label: '등록점검', path: 'publish', primary: true },
      { label: '쪽지설정', path: 'inquiries', primary: false },
      { label: '상세정보', path: 'detail', primary: false },
    ];
  }
  return [
    { label: '쪽지설정', path: 'inquiries', primary: true },
    { label: '등록점검', path: 'publish', primary: false },
    { label: '관심 학생', external: '#/mypage/student-review?from=exposure', primary: false },
    { label: '구매이력', path: 'plans', external: '#/mypage/plans', primary: false },
  ];
}
