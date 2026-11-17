/**
 * 공부방 로그인 홈 — 홍보지역 1(saved_regions primary)과 멤버박스 실데이터.
 * 게스트 대치동 데모는 여기 두지 않는다.
 */

import { getStudyRooms } from './study-room-reg/store.js';
import { getUnreadCount } from './messages/thread-store.js';
import { fetchRoiSummary } from './paid-api.js';
import { studyRoomBadges } from './exposure-format.js';
import { studyRoomSearchCardFields } from './home-basic-live.js';
import { searchApi } from '@search-ui/search-api.js';
import { normalizeLocation } from '../../shared/location-display.js';
import { isSnapshotFresh, onRegistrationSnapshotInvalidated } from '../../shared/snap-clear.js';

function rememberSnapshot(partial) {
  import('../../shared/session-snapshot.js')
    .then((mod) => mod.patchSessionSnapshot(partial))
    .catch(() => {});
}

/** @type {object[]|null} */
let liveItems = null;
/** @type {'idle'|'loading'|'ready'|'error'|'no-region'} */
let liveStatus = 'idle';
/** @type {object[]|null} null = 학생 수요 조회 전 */
let studentLive = null;
/** @type {'idle'|'loading'|'ready'|'error'|'no-region'} */
let studentStatus = 'idle';
let studentKey = '';
/** @type {Promise<void>|null} */
let studentBoot = null;
/** @type {string} */
let liveKey = '';
/** @type {Promise<void>|null} */
let bootPromise = null;
/** @type {number|null} */
let lifetimeViews = null;
/** @type {number|null} */
let viewsRoomId = null;
let viewsLoaded = false;
/** @type {number} */
let listSavedAt = 0;
/** @type {number} */
let studentSavedAt = 0;
/** @type {number} */
let roiSavedAt = 0;
/** @type {Map<string, number>} */
const studentCountByRegion = new Map();
/** @type {Map<string, { items: object[], status: string, at: number }>} */
const roomListByKey = new Map();

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
 * 홍보2·3. 대표 슬롯을 빼고 region_label 이 있는 슬롯만, 저장 순서대로 최대 2개.
 * 빈 슬롯은 넣지 않는다. room 을 생략하면 내 공부방.
 * @param {object|null|undefined} [room]
 * @returns {object[]}
 */
export function studyRoomSecondaryPromoRegions(room) {
  const own = room === undefined ? pickOwnStudyRoom() : room;
  const slots = Array.isArray(own?.saved_regions) ? own.saved_regions : [];
  const primary = primarySavedRegion(own);
  const out = [];
  for (const slot of slots) {
    if (!slot || slot === primary) continue;
    const label = String(slot.region_label ?? '').trim();
    if (!label) continue;
    out.push(slot);
    if (out.length >= 2) break;
  }
  return out;
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

/**
 * 지도에 쓰는 홍보 슬롯. 대표(region_label 있는 것) 다음 홍보2·3.
 * @param {object|null|undefined} [room]
 * @returns {object[]}
 */
export function studyRoomPromoMapSlots(room) {
  const own = room === undefined ? pickOwnStudyRoom() : room;
  const primary = primarySavedRegion(own);
  /** @type {object[]} */
  const slots = [];
  if (primary && String(primary.region_label || '').trim()) slots.push(primary);
  for (const slot of studyRoomSecondaryPromoRegions(own)) slots.push(slot);
  return slots;
}

/**
 * @param {object|null|undefined} slot
 * @returns {{ basis: 'dong'|'complex'|'', promo_label: string, complex_address: string|null, region_id: string }}
 */
function slotToMap(slot) {
  if (!slot) return { basis: '', promo_label: '', complex_address: null, region_id: '' };
  const basis = String(slot.region_basis_type || '') === 'complex' ? 'complex' : 'dong';
  const promo = String(slot.promo_label || '').trim();
  const regionId = String(slot.region_id ?? '').trim();
  const region_id = /^\d+$/.test(regionId) ? regionId : '';
  if (basis !== 'complex') return { basis, promo_label: promo, complex_address: null, region_id };
  const raw = slot.complex_address == null ? '' : String(slot.complex_address).trim();
  return { basis, promo_label: promo, complex_address: raw || null, region_id };
}

/**
 * 대표 슬롯의 지도 질의 재료. 저장된 region_basis_type 을 그대로 싣는다.
 * 동 기준의 complex_address 는 null. 단지 기준은 비어 있으면 null(다른 라벨로 채우지 않음).
 * @param {object|null|undefined} [room] 생략하면 내 공부방
 * @returns {{ basis: 'dong'|'complex'|'', promo_label: string, complex_address: string|null, region_id: string }}
 */
export function peekStudyRoomPromo1MapSlot(room) {
  return slotToMap(primarySavedRegion(room === undefined ? pickOwnStudyRoom() : room));
}

/** 단지 주소가 없거나 미등록 표식이면 다른 값으로 대체하지 않는다. */
export function complexAddressMissing(value) {
  const text = String(value ?? '').trim();
  return text === '' || text.startsWith('(주소 미등록)');
}

/**
 * 저장된 기준 그대로의 지오코딩 질의.
 * dong → promo_label, complex → complex_address. 단지는 동 라벨로 폴백하지 않는다.
 * @param {{ basis?: string, promo_label?: string, complex_address?: string|null }} slot
 * @returns {{ query: string, blocked: boolean }}
 */
export function studyRoomGeocodeQuery(slot) {
  if (slot?.basis === 'complex') {
    if (complexAddressMissing(slot.complex_address)) return { query: '', blocked: true };
    return { query: String(slot.complex_address).trim(), blocked: false };
  }
  const label = String(slot?.promo_label || '').trim();
  return { query: label, blocked: !label };
}

/**
 * 홈은 고른 홍보 슬롯. 고르지 않았으면 대표 슬롯.
 * 찾기만 URL·직접 고른 주소·다른 지역 검색을 그 라벨로 지오코딩한다.
 * @param {object} [state]
 * @param {'home'|'search'} [variant]
 */
export function resolveStudyRoomMapQuery(state = {}, variant = 'home') {
  const onHome = variant !== 'search';
  const idx = state?.studyRoomPromoIndex;
  const pickedSlot =
    onHome && Number.isInteger(idx) && idx >= 0 ? studyRoomPromoMapSlots()[idx] : null;
  const slot = pickedSlot ? slotToMap(pickedSlot) : peekStudyRoomPromo1MapSlot();
  const source = String(state?.canonicalLocation?.source || '');
  const active = String(state?.activeRegionLabel || '').trim();
  const display = String(state?.canonicalLocation?.displayLabel || '').trim();
  const onFind = variant === 'search';
  const urlOrAddress = source === 'url' || source === 'address';
  const searchedElsewhere = state?.searchExecuted === true && active !== '' && active !== slot.promo_label;
  if (onFind && (urlOrAddress || searchedElsewhere)) {
    const label = active || display;
    const pickedId = String(state?.canonicalLocation?.regionId || '').trim();
    return {
      basis: slot.basis,
      promo_label: slot.promo_label,
      complex_address: slot.complex_address,
      query: label,
      blocked: label === '',
      picked: true,
      region_id: /^\d+$/.test(pickedId) ? pickedId : '',
    };
  }
  const built = studyRoomGeocodeQuery(slot);
  return {
    basis: slot.basis,
    promo_label: slot.promo_label,
    complex_address: slot.complex_address,
    query: built.query,
    blocked: built.blocked,
    picked: false,
    region_id: slot.region_id || '',
  };
}

/** 홍보1 행정동 id. 개설 region_id 로 대체하지 않는다. */
export function studyRoomPromo1RegionId() {
  const id = Number(primarySavedRegion(pickOwnStudyRoom())?.region_id);
  return Number.isFinite(id) && id > 0 ? String(id) : '';
}

/** 현재위치용 동. 시 이름만 반환하지 않는다. */
export function studyRoomPromo1Dong() {
  const full = peekStudyRoomPromo1();
  if (!full) return '';
  const dong = normalizeLocation({ raw: full }, 'room').dong;
  return String(dong || '').trim();
}

/** @returns {object[]|null} null = 아직 조회 전 */
export function getStudyRoomHomeLiveItems() {
  return liveItems;
}

/** @returns {'idle'|'loading'|'ready'|'error'|'no-region'} */
export function getStudyRoomHomeFeedStatus() {
  return liveStatus;
}

/** 홍보1 + 희망유형 공부방. null 이면 로딩. */
export function getStudyRoomStudentLiveItems() {
  return studentLive;
}

/** @returns {'idle'|'loading'|'ready'|'error'|'no-region'} */
export function getStudyRoomStudentFeedStatus() {
  return studentStatus;
}

/** 실패 후 같은 키로 다시 받을 수 있게 부트 가드를 푼다. */
export function retryStudyRoomStudentDemand(rerender) {
  studentBoot = null;
  studentKey = '';
  return bootStudyRoomStudentDemand(rerender);
}

/** 홈 공부방 목록 실패 재시도. */
export function retryStudyRoomHome(rerender, opts = {}) {
  bootPromise = null;
  liveKey = '';
  return bootStudyRoomHome(rerender, opts);
}

/**
 * 홈 우리동네 학생과 학생찾기 진입이 같은 목록을 쓴다.
 * @param {() => void} [rerender]
 */
export function bootStudyRoomStudentDemand(rerender) {
  const room = pickOwnStudyRoom();
  const promo = studyRoomPromo1Label(room);
  const regionId = studyRoomPromo1RegionId();
  const key = `${room?.id || 0}|${regionId}|${promo}`;
  if (studentBoot && studentKey === key) return studentBoot;
  studentKey = key;
  studentLive = null;
  studentStatus = regionId ? 'loading' : 'no-region';
  // rerender 는 .then 안에서만 부른다. 지역이 없어 요청이 없는 경로도 studentBoot 대입이 끝난 뒤에 다시 그린다
  // (같은 틱에 부르면 다시 그리기가 이 함수를 다시 불러 가드를 지나 무한 반복한다).
  studentBoot = loadStudentDemand(regionId)
    .then((result) => {
      if (studentKey !== key) return;
      studentLive = result.items;
      studentStatus = result.status;
      studentSavedAt = Date.now();
      if (result.status === 'ready') {
        rememberSnapshot({
          studentDemand: {
            key,
            items: studentLive,
            status: studentStatus,
            at: studentSavedAt,
          },
        });
      }
      if (typeof rerender === 'function') rerender();
    })
    .catch(() => {
      if (studentKey !== key) return;
      studentLive = [];
      studentStatus = 'error';
      if (typeof rerender === 'function') rerender();
    });
  return studentBoot;
}

/**
 * @param {string} regionId
 * @returns {Promise<{ items: object[]|null, status: 'ready'|'error'|'no-region' }>}
 */
async function loadStudentDemand(regionId) {
  if (!regionId) return { items: null, status: 'no-region' };
  try {
    const result = await searchApi(
      'student',
      { preferred_lesson_type: 'study_room', preferred_studyroom_region_id: regionId },
      { limit: 20, sort: 'latest' },
    );
    return { items: Array.isArray(result.items) ? result.items : [], status: 'ready' };
  } catch {
    return { items: null, status: 'error' };
  }
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
  state.role = 'study_room';
  if (!state.searchExecuted) {
    state.studentHopeType = 'study_room';
    state.hopeTypeResolved = true;
  }
  if (state.searchExecuted) return peekStudyRoomPromo1();
  const source = state.canonicalLocation?.source;
  if (source === 'address' || source === 'url') {
    return state.activeRegionLabel || '';
  }
  const promoIndex = state.studyRoomPromoIndex;
  const pickedPromo =
    Number.isInteger(promoIndex) && promoIndex >= 0 ? studyRoomPromoMapSlots()[promoIndex] : null;
  const promo = pickedPromo
    ? String(pickedPromo.promo_label || pickedPromo.region_label || '').trim()
    : peekStudyRoomPromo1();
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

export function mapLiveRoom(item) {
  const sku = item?.position_sku === 'prime' || item?.position_sku === 'pick' ? item.position_sku : '';
  const room = {
    id: Number(item.id),
    study_room_name: String(item.title || ''),
    location_label: String(item.region_label || ''),
    price_amount: item.price_amount ?? null,
    recommend_count: Number(item.recommend_count) || 0,
    review_count: Number(item.review_count) || 0,
    wish_count: Number(item.wish_count) || 0,
    compare_count: Number(item.compare_count) || 0,
    message_count: Number(item.message_count) || 0,
    published_at: item.published_at || null,
    created_at: item.created_at || null,
    ...studyRoomSearchCardFields(item),
    education_office_registered: Boolean(item.education_office_registered),
    career_years: item.career_years ?? null,
    profile_status: 'published',
    compare_eligible: item.compare_eligible !== false,
    inquiry_status: item.inquiry_status || 'open',
    latitude: item.latitude ?? null,
    longitude: item.longitude ?? null,
    position_sku: sku || null,
    exposure_tier: sku || 'basic',
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
  if (viewsLoaded && viewsRoomId === id && isSnapshotFresh(roiSavedAt)) return;
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
  roiSavedAt = Date.now();
  rememberSnapshot({
    roi: { roomId: id, data: { lifetime_views: lifetimeViews }, at: roiSavedAt },
  });
}

/**
 * 홈 목록이 서버에 넘기는 지역 키.
 * 동 슬롯은 region_id. 단지 슬롯은 목록 소속(region_id)과 티어 키(complex_id)를 함께 보낸다.
 * @param {object|null|undefined} slot
 * @param {string} [promo]
 * @returns {Record<string, string>}
 */
export function studyRoomHomeSearchFilters(slot, promo = '') {
  void promo;
  /** @type {Record<string, string>} */
  const filters = {};
  if (slot?.region_id && /^\d+$/.test(String(slot.region_id))) {
    filters.region_id = String(slot.region_id);
  }
  const complexId = String(slot?.complex_id || '').trim();
  if (String(slot?.region_basis_type || '') === 'complex' && /^\d+$/.test(complexId)) {
    filters.complex_id = complexId;
  }
  return filters;
}

/**
 * 홍보1 지역 공부방 목록(프라임 베스트 3 포함)과 조회수를 한 번 채운다.
 * viewsAfterList 는 찾기 첫 진입만. 목록이 끝난 뒤에 조회수를 받는다. 홈은 같이 받는다.
 * @param {() => void} rerender
 * @param {{ viewsAfterList?: boolean, slotIndex?: number }} [opts]
 */
export function bootStudyRoomHome(rerender, opts = {}) {
  const room = pickOwnStudyRoom();
  const slotIndex = opts.slotIndex;
  const picked =
    Number.isInteger(slotIndex) && slotIndex >= 0 ? studyRoomPromoMapSlots(room)[slotIndex] : null;
  const slot = picked || primarySavedRegion(room);
  const promo = String(slot?.promo_label || '').trim() || studyRoomPromo1Label(room);
  const filters = studyRoomHomeSearchFilters(slot, promo);
  const key = `${room?.id || 0}|${filters.region_id || ''}|${filters.complex_id || ''}|${filters.region_label || ''}`;
  const cached = roomListByKey.get(key);
  if (cached && (cached.status === 'ready' || cached.status === 'no-region')) {
    // 캐시 적중은 목록만 바꾼다. 다시 그리기는 키·상태가 바뀐 때 한 번만 예약한다.
    // 조회수는 아래 기존 가드가 처리한다(그리기마다 새 then·rerender를 만들지 않는다).
    const changed = liveKey !== key || liveStatus !== cached.status;
    if (changed) {
      liveKey = key;
      liveItems = cached.items;
      liveStatus = cached.status;
      listSavedAt = cached.at;
      bootPromise = Promise.resolve();
      if (typeof rerender === 'function') {
        queueMicrotask(() => {
          if (liveKey === key) rerender();
        });
      }
    }
  }
  if (bootPromise && liveKey === key) {
    if (opts.viewsAfterList === true) return bootPromise;
    const roomId = Number(room?.id);
    const settledId = Number.isFinite(roomId) && roomId > 0 ? roomId : null;
    const settledBefore = viewsLoaded && viewsRoomId === settledId;
    return bootPromise.then(async () => {
      await ensureLifetimeViews(room?.id);
      if (!settledBefore && typeof rerender === 'function') rerender();
    });
  }
  liveKey = key;
  liveItems = null;
  liveStatus =
    filters.region_id || filters.region_label || filters.complex_id ? 'loading' : 'no-region';
  bootPromise = (async () => {
    const loadList = async () => {
      if (!(filters.region_id || filters.region_label || filters.complex_id)) {
        const at = Date.now();
        roomListByKey.set(key, { items: [], status: 'no-region', at });
        if (liveKey !== key) return;
        liveItems = [];
        liveStatus = 'no-region';
        listSavedAt = at;
        return;
      }
      try {
        const result = await searchApi('room', filters, { limit: 20, sort: 'latest' });
        const items = (result.items || []).map(mapLiveRoom);
        const at = Date.now();
        roomListByKey.set(key, { items, status: 'ready', at });
        if (liveKey !== key) return;
        liveItems = items;
        liveStatus = 'ready';
        listSavedAt = at;
        rememberSnapshot({
          roomHomeList: { key, items: liveItems, status: liveStatus, at: listSavedAt },
        });
      } catch {
        if (liveKey !== key) return;
        liveItems = [];
        liveStatus = 'error';
      }
    };
    if (opts.viewsAfterList === true) {
      await loadList();
      if (liveKey === key && typeof rerender === 'function') rerender();
      await ensureLifetimeViews(room?.id);
      return;
    }
    await Promise.all([ensureLifetimeViews(room?.id), loadList()]);
    if (liveKey === key && typeof rerender === 'function') rerender();
  })();
  return bootPromise;
}

/** 지역 저장 뒤에는 같은 탭의 목록 메모리도 버린다. */
export function forgetStudyRoomHomeMemory() {
  bootPromise = null;
  liveKey = '';
  liveItems = null;
  liveStatus = 'idle';
  listSavedAt = 0;
  studentBoot = null;
  studentKey = '';
  studentLive = null;
  studentStatus = 'idle';
  studentSavedAt = 0;
  lifetimeViews = null;
  viewsRoomId = null;
  viewsLoaded = false;
  roiSavedAt = 0;
  studentCountByRegion.clear();
  roomListByKey.clear();
}

/**
 * 고른 홍보 지역의 학생 수. 기존 search.php total 만 쓴다.
 * region-stats.php 는 게스트 대치·강남 고정이고 로그인 화면은 그 함수를 쓰지 않는다.
 * 목록 길이(limit 20)는 세지 않는다. 실패하면 null 이고 화면은 대시를 유지한다.
 * @param {string} regionId
 * @returns {Promise<number|null>}
 */
export function readStudyRoomRegionStudentCount(regionId) {
  const id = String(regionId || '').trim();
  if (!/^\d+$/.test(id)) return Promise.resolve(null);
  if (studentCountByRegion.has(id)) return Promise.resolve(studentCountByRegion.get(id));
  return searchApi(
    'student',
    { preferred_lesson_type: 'study_room', preferred_studyroom_region_id: id },
    { limit: 1, sort: 'latest' },
  )
    .then((result) => {
      const total = Number(result?.total);
      if (!Number.isFinite(total)) return null;
      studentCountByRegion.set(id, total);
      return total;
    })
    .catch(() => null);
}

/** TTL 안의 스냅샷으로 목록·조회수 초기값만 채운다. 같은 페이지 메모리는 그대로다. */
export function seedStudyRoomHomeFromSnapshot(snap) {
  if (!snap || typeof snap !== 'object') return;
  const list = snap.roomHomeList;
  if (list && isSnapshotFresh(list.at) && typeof list.key === 'string' && Array.isArray(list.items)) {
    liveKey = list.key;
    liveItems = list.items.map((item) => ({ ...item }));
    liveStatus = list.status === 'no-region' ? 'no-region' : 'ready';
    listSavedAt = Number(list.at);
    bootPromise = Promise.resolve();
    roomListByKey.set(list.key, {
      items: liveItems,
      status: liveStatus,
      at: listSavedAt,
    });
  }
  const demand = snap.studentDemand;
  if (demand && isSnapshotFresh(demand.at) && typeof demand.key === 'string' && Array.isArray(demand.items)) {
    studentKey = demand.key;
    studentLive = demand.items.map((item) => ({ ...item }));
    studentStatus = demand.status === 'error' || demand.status === 'no-region' ? demand.status : 'ready';
    studentSavedAt = Number(demand.at);
    studentBoot = Promise.resolve();
  }
  const roi = snap.roi;
  if (roi && isSnapshotFresh(roi.at)) {
    const roomId = Number(roi.roomId);
    if (Number.isFinite(roomId) && roomId > 0) {
      viewsRoomId = roomId;
      const views = Number(roi.data?.lifetime_views);
      lifetimeViews = Number.isFinite(views) ? views : null;
      viewsLoaded = true;
      roiSavedAt = Number(roi.at);
    }
  }
}

onRegistrationSnapshotInvalidated((kind) => {
  if (kind === 'studyRooms' || kind === 'all') forgetStudyRoomHomeMemory();
});
