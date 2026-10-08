/**
 * 과외쌤 홈 멤버박스 조회.
 * 공부방과 같이 ROI lifetime_views. study_room_id 는 붙이지 않는다.
 */

import { fetchRoiSummary } from './paid-api.js';
// 저장소 루트에서 도는 verify 는 @search-ui 별칭을 못 읽는다. 상대경로로 둔다.
import { searchApi } from '../../search-ui/src/search-api.js';
import { getTutors } from './tutor-reg/store.js';
import { hydrateRegistrationsCache, isRegistrationsApiMode } from './registrations-backend.js';
import { isMessagesApiMode } from './messages-backend.js';
import { getUnreadCount } from './messages/thread-store.js';
import { ensureTutorCityUnits, getTutorCityUnits } from './tutor-reg/city-units.js';
import { activityLabelFromRegionId } from '../../shared/korea-sidos.js';

/** @type {number|null} */
let lifetimeViews = null;
let viewsLoaded = false;

/** @returns {number|null} 서버 호출 실패(또는 조회 전)면 null. 응답했는데 값이 없으면 0 */
export function readTutorLifetimeViews() {
  return lifetimeViews;
}

async function ensureLifetimeViews() {
  if (viewsLoaded && lifetimeViews != null) return;
  try {
    const data = await fetchRoiSummary(7);
    const n = Number(data?.lifetime_views);
    lifetimeViews = Number.isFinite(n) ? n : 0;
  } catch {
    lifetimeViews = null;
  }
  viewsLoaded = true;
}

/** 조회 칸 문구. 불러오는 중 …, 서버 호출 실패 — */
function tutorViewsText() {
  if (!viewsLoaded) return '…';
  return lifetimeViews == null ? '—' : String(lifetimeViews);
}

/** 서버 등록 캐시의 내 과외 프로필. sessionStorage 시드는 쓰지 않는다. */
function pickOwnTutor() {
  if (!isRegistrationsApiMode()) return null;
  return getTutors().find((row) => !row?.deleted_at) || null;
}

function formatRegistered(value) {
  const raw = String(value || '').trim();
  if (!raw) return '—';
  const day = raw.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : '—';
}

function inquiryText(status) {
  if (status === 'open') return '쪽지 받음';
  if (status === 'paused' || status === 'not_accepting') return '쪽지 안받음';
  return '—';
}

function readUnread() {
  if (!isMessagesApiMode()) return 0;
  try {
    const n = Number(getUnreadCount());
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

/**
 * 과외쌤 홈 내 박스. 이름·과목·쪽지상태·등록일은 등록 API, 미확인은 쪽지 API, 조회는 ROI.
 * @returns {{ name: string, subject: string, inquiry: string, unread: number, views: string, registered: string }}
 */
export function readTutorMemberBox() {
  try {
    const tutor = pickOwnTutor();
    return {
      name: String(tutor?.tutor_display_name || '').trim() || '내 과외 프로필',
      subject: String(tutor?.main_subject_note || '').trim() || '미등록',
      inquiry: inquiryText(tutor?.inquiry_status),
      unread: readUnread(),
      views: tutorViewsText(),
      registered: formatRegistered(tutor?.created_at),
    };
  } catch {
    return {
      name: '내 과외 프로필',
      subject: '미등록',
      inquiry: '—',
      unread: 0,
      views: tutorViewsText(),
      registered: '—',
    };
  }
}

/** @type {Array<{label: string, primary: boolean, regionId: string}>|null} */
let homeRegions = null;
let regionBoot = 0;

function blankTutorHomeRegions() {
  return [
    { label: '', primary: false, regionId: '' },
    { label: '', primary: false, regionId: '' },
    { label: '', primary: false, regionId: '' },
  ];
}

/** null이면 아직 조회 전. 조회 후엔 저장된 3칸(빈 칸 포함). MOCK 지역은 넣지 않는다. */
export function readTutorHomeRegions() {
  return homeRegions;
}

/** 대표 활동지역 표시. 저장된 대표가 없으면 비운다. */
export function tutorHomePrimaryLabel() {
  const slots = Array.isArray(homeRegions) ? homeRegions : [];
  const primary = slots.find((s) => s.primary && s.label) || null;
  return String(primary?.label || '').trim();
}

/** saved_regions[idx] 화면 라벨. 없거나 MOCK이면 빈 문자열. */
export function tutorHomeRegionLabel(index = 0) {
  const slots = Array.isArray(homeRegions) ? homeRegions : [];
  const idx = Number(index);
  if (!Number.isFinite(idx) || idx < 0 || idx >= slots.length) return '';
  return String(slots[idx]?.label || '').trim();
}

/** saved_regions[idx] 지역 id(선택 단위 = 시·군·구). 없으면 빈 문자열. */
export function tutorHomeRegionId(index = 0) {
  const slots = Array.isArray(homeRegions) ? homeRegions : [];
  const idx = Number(index);
  if (!Number.isFinite(idx) || idx < 0 || idx >= slots.length) return '';
  return String(slots[idx]?.regionId || '').trim();
}

/** 대표 활동지역 슬롯 번호. 대표가 없으면 0. */
export function tutorHomePrimaryIndex() {
  const slots = Array.isArray(homeRegions) ? homeRegions : [];
  const idx = slots.findIndex((slot) => slot?.primary && slot?.label);
  return idx >= 0 ? idx : 0;
}

export function tutorHomeRegionsReady() {
  return homeRegions !== null;
}

/** @type {object[]|null} null = 아직 조회 전 */
let studentLive = null;
let studentKey = '';
/** @type {'idle'|'loading'|'ready'|'error'|'no-region'} */
let studentStatus = 'idle';
/** @type {Promise<void>|null} */
let studentBoot = null;

/** 홈 「우리동네 학생」 탭 목록. null 이면 아직 조회 전. */
export function getTutorStudentLiveItems() {
  return studentLive;
}

/** @returns {'idle'|'loading'|'ready'|'error'|'no-region'} */
export function getTutorStudentFeedStatus() {
  return studentStatus;
}

/**
 * 활동지역 regionId 기준 과외 분기 학생 조회.
 * 지역 기준은 과외 단위(광역시 / 도의 시·군) id — tutor_regions.region_id 와
 * students.preferred_tutor_region_id 가 둘 다 TutorRegionUnit::assertUnit 을 지난 값이다.
 * @param {string} regionId
 * @returns {Promise<{ items: object[]|null, status: 'ready'|'error'|'no-region' }>}
 */
async function loadTutorStudentDemand(regionId) {
  if (!regionId) return { items: null, status: 'no-region' };
  try {
    const result = await searchApi(
      'student',
      { preferred_lesson_type: 'tutor', preferred_region_id: regionId },
      { limit: 20, sort: 'latest' },
    );
    return { items: Array.isArray(result.items) ? result.items : [], status: 'ready' };
  } catch {
    return { items: null, status: 'error' };
  }
}

/**
 * 홈 「우리동네 학생」 탭 조회. 선택한 활동지역 탭(기본 대표)이 바뀌면 다시 조회한다.
 * 활동지역 조회(bootTutorHome)가 끝나기 전에는 요청하지 않는다 — 그 boot 의 rerender 가 여기를 다시 부른다.
 * rerender 는 .then 안에서만 부른다(같은 틱에 부르면 다시 그리기가 이 함수를 다시 불러 반복한다).
 * @param {number} index 활동지역 슬롯 0~2
 * @param {() => void} [rerender]
 */
export function bootTutorStudentDemand(index, rerender) {
  if (!tutorHomeRegionsReady()) return null;
  const raw = Number(index);
  const idx = Number.isInteger(raw) && raw >= 0 && raw <= 2 ? raw : tutorHomePrimaryIndex();
  const regionId = tutorHomeRegionId(idx);
  const key = `${idx}|${regionId}`;
  if (studentBoot && studentKey === key) return studentBoot;
  studentKey = key;
  studentLive = null;
  studentStatus = regionId ? 'loading' : 'no-region';
  studentBoot = loadTutorStudentDemand(regionId).then((result) => {
    if (studentKey !== key) return;
    studentLive = result.items;
    studentStatus = result.status;
    if (typeof rerender === 'function') rerender();
  });
  return studentBoot;
}

async function ensureHomeRegions() {
  try {
    if (isRegistrationsApiMode()) await hydrateRegistrationsCache();
  } catch {
    /* 캐시가 있으면 그 값으로 칩을 그린다 */
  }
  try {
    await ensureTutorCityUnits();
  } catch {
    /* 라벨 해석이 안 되면 대표 라벨만 남긴다 */
  }
  if (!isRegistrationsApiMode()) {
    homeRegions = blankTutorHomeRegions();
    return;
  }
  const tutor = getTutors().find((row) => !row?.deleted_at) || null;
  const units = getTutorCityUnits();
  const saved = Array.isArray(tutor?.saved_regions) ? tutor.saved_regions : [];
  const primaryText = String(tutor?.primary_region_label || '').trim();
  homeRegions = [0, 1, 2].map((i) => {
    const slot = saved[i] || {};
    const id = String(slot.region_id || '').trim();
    const numeric = /^\d+$/.test(id);
    let label = numeric ? activityLabelFromRegionId(id, units) : '';
    const primary = slot.is_primary === true || slot.is_primary === 1 || slot.is_primary === '1';
    if (!label && primary && primaryText && primaryText !== '—') label = primaryText;
    return { label, primary: primary && !!label, regionId: numeric ? id : '' };
  });
  if (!homeRegions.some((s) => s.primary) && homeRegions[0].label) homeRegions[0].primary = true;
}

/**
 * @param {() => void} [rerender]
 */
export function bootTutorHome(rerender) {
  const gen = ++regionBoot;
  return (async () => {
    // 값이 바뀐 경우에만 다시 그린다. 다시 그린 뒤의 boot 는 같은 값이라 멈춘다.
    const prev = tutorHomeSignature();
    await ensureLifetimeViews();
    await ensureHomeRegions();
    if (gen !== regionBoot) return;
    if (tutorHomeSignature() !== prev && typeof rerender === 'function') rerender();
  })();
}

function tutorHomeSignature() {
  return JSON.stringify([homeRegions, readTutorMemberBox()]);
}
