/**
 * 공부방 로그인 홈 — 홍보지역 1(saved_regions primary)과 멤버박스 실데이터.
 * 게스트 대치동 데모는 여기 두지 않는다.
 */

import { getStudyRooms } from './study-room-reg/store.js';
import { getUnreadCount } from './messages/thread-store.js';
import { fetchRoiSummary } from './paid-api.js';
import { studyRoomBadges } from './exposure-format.js';
import { searchApi } from '@search-ui/search-api.js';
import { normalizeLocation } from '../../shared/location-display.js';

/** @type {object[]|null} */
let liveItems = null;
/** @type {string} */
let liveKey = '';
/** @type {Promise<void>|null} */
let bootPromise = null;
/** @type {number|null} */
let lifetimeViews = null;
/** @type {number|null} */
let viewsRoomId = null;
let viewsLoaded = false;

/** @param {object|null|undefined} room */
export function primarySavedRegion(room) {
  const slots = Array.isArray(room?.saved_regions) ? room.saved_regions : [];
  return (
    slots.find((s) => s && (s.is_primary === true || s.is_primary === 1 || s.is_primary === '1')) ||
    slots[0] ||
    null
  );
}

/**
 * 홍보1 표시라벨. primary 슬롯의 promo_label만.
 * 슬롯 region_label·공부방 개설 region_label 로는 대체하지 않는다. 없으면 빈 문자열(화면은 —).
 * @param {object|null|undefined} room
 */
export function studyRoomPromo1Label(room) {
  const slot = primarySavedRegion(room);
  return String(slot?.promo_label || '').trim();
}

export function pickOwnStudyRoom() {
  const rooms = getStudyRooms().filter((r) => !r?.deleted_at);
  return rooms.find((r) => r.profile_status === 'published') || rooms[0] || null;
}

export function peekStudyRoomPromo1() {
  return studyRoomPromo1Label(pickOwnStudyRoom());
}

/** @returns {object[]|null} null = 아직 조회 전 */
export function getStudyRoomHomeLiveItems() {
  return liveItems;
}

function formatRegistered(value) {
  const raw = String(value || '').trim();
  if (!raw) return '—';
  const day = raw.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : '—';
}

function inquiryWord(status) {
  if (!status) return '—';
  return status === 'open' ? '받음' : '안받음';
}

export function readStudyRoomMemberBox() {
  const room = pickOwnStudyRoom();
  let unread = 0;
  try {
    unread = getUnreadCount();
  } catch {
    unread = 0;
  }
  return {
    name: String(room?.study_room_name || '').trim() || '내 공부방',
    region: studyRoomPromo1Label(room) || '—',
    inquiry: inquiryWord(room?.inquiry_status),
    unread,
    views: lifetimeViews,
    registered: formatRegistered(room?.created_at || room?.published_at),
  };
}

/**
 * 홈 find state에 홍보1을 심는다. 주소찾기·URL 선택은 유지.
 * @param {object} state
 */
export function applyStudyRoomHomePromo(state) {
  if (!state) return '';
  state.studyRoomHome = true;
  if (state.searchExecuted) return peekStudyRoomPromo1();
  const source = state.canonicalLocation?.source;
  if (source === 'address' || source === 'url') {
    return state.activeRegionLabel || '';
  }
  const promo = peekStudyRoomPromo1();
  if (!promo) {
    if (!state.activeRegionLabel || /대치/.test(String(state.activeRegionLabel))) {
      state.activeRegionLabel = '';
      state.canonicalLocation = null;
    }
    return '';
  }
  const canonical = normalizeLocation({ raw: promo, source: 'saved' }, 'room');
  canonical.source = 'saved';
  state.canonicalLocation = canonical;
  state.activeRegionLabel = canonical.displayLabel || promo;
  return state.activeRegionLabel;
}

function mapLiveRoom(item) {
  const sku = item?.position_sku === 'prime' || item?.position_sku === 'pick' ? item.position_sku : '';
  const room = {
    id: Number(item.id),
    study_room_name: String(item.title || ''),
    location_label: String(item.region_label || ''),
    price_amount: item.price_amount ?? null,
    recommend_count: Number(item.recommend_count) || 0,
    review_count: Number(item.review_count) || 0,
    published_at: item.published_at || null,
    created_at: item.created_at || null,
    main_subject_note: item.main_subject_note || '',
    intro_short: item.intro_short || '',
    education_office_registered: Boolean(item.education_office_registered),
    career_years: item.career_years ?? null,
    profile_status: 'published',
    compare_eligible: item.compare_eligible !== false,
    inquiry_status: item.inquiry_status || 'paused',
    latitude: item.latitude ?? null,
    longitude: item.longitude ?? null,
    position_sku: sku || null,
    exposure_tier: sku || 'basic',
    image_path: item.image_path || item.image_path_basic || '',
    image_path_basic: item.image_path_basic || '',
    image_path_prime: item.image_path_prime || '',
    _realDb: true,
  };
  room.badges = studyRoomBadges(room);
  return room;
}

/** @param {number|string|null|undefined} roomId 로그인 공부방 1건 */
async function ensureLifetimeViews(roomId) {
  const id = Number(roomId);
  if (!Number.isFinite(id) || id <= 0) {
    lifetimeViews = null;
    viewsRoomId = null;
    viewsLoaded = true;
    return;
  }
  if (viewsLoaded && viewsRoomId === id && lifetimeViews != null) return;
  viewsRoomId = id;
  try {
    const data = await fetchRoiSummary(7, id);
    if (data?.lifetime_views == null || data.lifetime_views === '') {
      lifetimeViews = null;
    } else {
      const n = Number(data.lifetime_views);
      lifetimeViews = Number.isFinite(n) ? n : null;
    }
  } catch {
    lifetimeViews = null;
  }
  viewsLoaded = true;
}

/**
 * 홍보1 지역 공부방 목록(프라임 베스트 3 포함)과 조회수를 한 번 채운다.
 * @param {() => void} rerender
 */
export function bootStudyRoomHome(rerender) {
  const room = pickOwnStudyRoom();
  const promo = studyRoomPromo1Label(room);
  const slot = primarySavedRegion(room);
  const key = `${room?.id || 0}|${slot?.region_id || ''}|${promo}`;
  if (bootPromise && liveKey === key) return bootPromise;
  liveKey = key;
  bootPromise = (async () => {
    const filters = {};
    if (slot?.region_id && /^\d+$/.test(String(slot.region_id))) {
      filters.region_id = String(slot.region_id);
    } else if (promo) {
      filters.region_label = promo;
    }
    const jobs = [ensureLifetimeViews(room?.id)];
    if (filters.region_id || filters.region_label) {
      jobs.push(
        searchApi('room', filters, { limit: 20, sort: 'latest' })
          .then((result) => {
            liveItems = (result.items || []).map(mapLiveRoom);
          })
          .catch(() => {
            liveItems = [];
          }),
      );
    } else {
      liveItems = [];
    }
    await Promise.all(jobs);
    if (typeof rerender === 'function') rerender();
  })();
  return bootPromise;
}
