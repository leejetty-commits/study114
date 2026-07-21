/** P20 — 공부방 레코드 라벨 · study-room-ui 딥링크 · 노출 행 */

import { profileStatusLabel } from '../lifecycle-copy.js';
import { STUDY_ROOM_REGISTER_URL, HOME_UI_BASE } from '../nav-config.js';
import { formatMonthlyWon } from '../exposure-format.js';
import { studyRoomHubPath } from './router.js';
import { getPublishReadiness } from './store.js';
import {
  INQUIRY_STATUS_LABELS,
  DETAIL_STATUS_LABELS,
  INQUIRY_OPTIONS,
  PRODUCT_APPLY,
} from './study-room-reg-copy.js';

/** @typedef {import('./store.js').StudyRoomRecord} StudyRoomRecord */

export { profileStatusLabel, INQUIRY_OPTIONS };

/** @param {string} status */
export function inquiryStatusLabel(status) {
  return INQUIRY_STATUS_LABELS[status] || status || '—';
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

/** @param {StudyRoomRecord} room */
export function roomToExposureRow(room) {
  return {
    id: room.id,
    study_room_name: room.study_room_name,
    location_label: room.region_label || '—',
    main_subject_note: room.main_subject_note || '—',
    grade_band: room.grade_band || '—',
    price_amount: room.price_amount,
    intro_short: room.intro_short || '',
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
  };
}

/**
 * study-room-ui 딥링크 (20장 부록 C)
 * @param {'basic'|'location'|'lesson'|'career'|'facility'} step
 * @param {number} roomId
 */
export function studyRoomUiDeepLink(step, roomId) {
  const returnTo = encodeURIComponent(`${HOME_UI_BASE}#${studyRoomHubPath(roomId)}`);
  const base = STUDY_ROOM_REGISTER_URL.replace(/#\/register\/basic$/, '');
  return `${base}#/register/${step}?room_id=${roomId}&return_to=${returnTo}`;
}

/** @param {StudyRoomRecord} room */
function countProductConditions(room) {
  let n = 0;
  if (room.profile_status !== 'published') n++;
  if (room.detail_completion_status !== 'expanded_complete') n++;
  return n;
}

/**
 * @param {'prime'|'pick'} type
 * @param {StudyRoomRecord} room
 */
function productMatrixRow(type, room) {
  const n = countProductConditions(room);
  const ok = n === 0;
  return {
    key: type,
    label: type === 'prime' ? '대표 노출' : '추천 노출',
    ok,
    reason: ok ? null : PRODUCT_APPLY.missing(n),
    statusText: ok ? PRODUCT_APPLY.eligible : PRODUCT_APPLY.missing(n),
  };
}

/** @param {StudyRoomRecord} room @param {import('./store.js').PublishReadiness} readiness */
export function getExposureMatrix(room, readiness) {
  const published = room.profile_status === 'published';

  return [
    {
      key: 'search',
      label: '기본 검색',
      ok: published && readiness.canPublish,
      reason: !published ? '공개 후 노출' : readiness.canPublish ? null : '필수 항목 미완료',
      statusText: null,
    },
    {
      key: 'compare',
      label: '비교검색',
      ok: published && room.compare_eligible && readiness.canPublish,
      reason: !room.compare_eligible ? '비교 자격 미충족' : !published ? '미공개' : null,
      statusText: null,
    },
    productMatrixRow('prime', room),
    productMatrixRow('pick', room),
  ];
}

/** P20-05 §7-1 블록 순서용 상세 노출 행 */
export function getExposureDetailBlocks(room, readiness) {
  const published = room.profile_status === 'published';
  const prime = productMatrixRow('prime', room);
  const pick = productMatrixRow('pick', room);

  const capacityHint =
    room.inquiry_status === 'capacity_full'
      ? '정원 마감 — 신규 문의 제한'
      : room.inquiry_status === 'waiting_only'
        ? '대기자 문의만 수용'
        : room.inquiry_status === 'paused'
          ? '상담 중지 — 노출 유지 · 신규 문의 제한'
          : '정상 수용';

  return [
    {
      key: 'search',
      label: '검색 노출',
      ok: published && readiness.canPublish,
      reason: !published ? '공개 후 노출' : readiness.canPublish ? null : '필수 항목 미완료',
    },
    {
      key: 'compare',
      label: '비교검색 표시',
      ok: published && room.compare_eligible && readiness.canPublish,
      reason: !room.compare_eligible ? '비교 자격 미충족' : !published ? '미공개' : null,
    },
    {
      key: 'region',
      label: '지도/지역 노출',
      ok: published && room.has_regions,
      reason: !room.has_regions ? '지역 미등록' : !published ? '미공개' : null,
    },
    {
      key: 'capacity',
      label: '정원/대기 문의',
      ok: room.inquiry_status === 'open' || room.inquiry_status === 'waiting_only',
      reason: capacityHint,
    },
    { ...prime, label: '대표 노출 상품' },
    { ...pick, label: '추천 노출 상품' },
  ];
}

/** @param {StudyRoomRecord} room */
export function getHubCtas(room) {
  const readiness = getPublishReadiness(room);
  const incomplete = room.profile_status === 'draft' || !readiness.canPublish;

  if (incomplete) {
    return [
      { label: '기본정보 보강', path: 'basic', primary: true },
      { label: '상세정보 보강', path: 'detail', primary: false },
      { label: '미리보기·공개', path: 'publish', primary: false },
    ];
  }
  if (room.profile_status === 'hidden') {
    return [
      { label: '다시 공개', path: 'publish', primary: true },
      { label: '노출·상담', path: 'exposure', primary: false },
      { label: '이용권 확인', path: 'plans', external: '#/mypage/plans', primary: false },
    ];
  }
  return [
    { label: '노출·상담', path: 'exposure', primary: true },
    { label: '미리보기', path: 'publish', primary: false },
    { label: '찜 목록', external: '#/mypage/student-review?from=exposure', primary: false },
    { label: '이용권 확인', path: 'plans', external: '#/mypage/plans', primary: false },
  ];
}
