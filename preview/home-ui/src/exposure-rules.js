/**
 * Prime / Pick / Basic 노출 규칙 (설정 주입 가능)
 * — 공부방 Prime: 3슬롯 고정 · EMPTY 홍보카드 · 회전/페이지 없음
 * — 과외쌤 Prime: 시 단위 후보 풀 · 3슬롯 페이지 + 15분 세트 순환
 * — Pick: 5개 세트 + 페이지 + 15분 순환
 * — Basic: 최신순 + 수동 페이지만 (시간 회전 없음)
 */

import { getPlanRuntimeSettings, getPlanSetting } from './plans/runtime-config.js';
import { sortListItems, DEFAULT_LIST_SORT } from '../../shared/list-sort.js';

/**
 * @param {object[]} items
 * @param {string} [dateKey]
 */
export function sortByNewestFirst(items, dateKey = 'registered_at') {
  return sortListItems(
    items.map((i) => ({
      ...i,
      published_at: i.published_at || i[dateKey] || i.registered_at,
    })),
    'study_room',
    DEFAULT_LIST_SORT,
  );
}

/**
 * 목록/카드 노출 후보 — 숨김(hidden)만 제외.
 * draft도 입력값 그대로 노출. published 게이트 없음.
 * @param {object} item
 */
function isListVisible(item) {
  return !item.profile_status || item.profile_status !== 'hidden';
}

function paidSku(item) {
  const sku = item?.position_sku || item?.sku;
  return sku === 'prime' || sku === 'pick' ? sku : '';
}

/**
 * 유료 Prime 점유자.
 * 로그인 실데이터(_realDb)는 position_sku=prime 만. demo_prime_filled 는 게스트 시드 전용.
 * @param {object[]} pool
 * @param {number} [capacity]
 */
export function getPrimeOccupied(pool, capacity) {
  const cap = capacity ?? (Number(getPlanSetting('prime_slots')) || 3);
  return pool.filter((i) => isListVisible(i) && paidSku(i) === 'prime').slice(0, cap);
}

/**
 * @param {object[]} occupied
 * @param {number} [capacity]
 * @returns {Array<object|null>}
 */
export function buildPrimeSlotArray(occupied, capacity) {
  const cap = capacity ?? (Number(getPlanSetting('prime_slots')) || 3);
  /** @type {Array<object|null>} */
  const slots = [];
  for (let i = 0; i < cap; i++) {
    slots.push(occupied[i] || null);
  }
  return slots;
}

/**
 * Pick 후보: Prime 점유 제외 후 최신순
 * @param {object[]} pool
 * @param {object[]} primeOccupied
 */
export function getPickPool(pool, primeOccupied) {
  const primeIds = new Set(primeOccupied.map((i) => i.id));
  return sortByNewestFirst(pool.filter((i) => isListVisible(i) && !primeIds.has(i.id) && paidSku(i) === 'pick'));
}

/**
 * 시간대 세트 순환 — 최근 입점 우선 리스트를 set 단위로 로테이션
 * @param {object[]} newestFirst
 * @param {number} setSize
 * @param {number} [minutes]
 * @param {number} [nowMs]
 */
export function rotateSetPool(newestFirst, setSize, minutes = 15, nowMs = Date.now()) {
  const size = Math.max(1, Number(setSize) || 1);
  if (!newestFirst.length) return newestFirst;

  const setCount = Math.max(1, Math.ceil(newestFirst.length / size));
  const windowMs = Math.max(1, Number(minutes) || 15) * 60 * 1000;
  const setIndex = Math.floor(nowMs / windowMs) % setCount;
  const offset = setIndex * size;
  return [...newestFirst.slice(offset), ...newestFirst.slice(0, offset)];
}

/**
 * Pick 전용 — pick_set_size · pick_rotation_minutes
 * @param {object[]} newestFirst
 * @param {number} [nowMs]
 */
export function rotatePickPool(newestFirst, nowMs = Date.now()) {
  const setSize = Number(getPlanSetting('pick_set_size')) || 5;
  const minutes = Number(getPlanSetting('pick_rotation_minutes')) || 15;
  return rotateSetPool(newestFirst, setSize, minutes, nowMs);
}

/**
 * Prime 후보 풀
 * — study_room: 고정 점유(최대 prime_slots) — 회전·페이지 없음
 * — tutor: 시 단위 후보 전체(명시 prime 또는 데모 풀) — 회전·페이지 대상
 * @param {'study_room'|'tutor'} kind
 * @param {object[]} pool
 */
export function getPrimeCandidatePool(kind, pool) {
  const cap = Number(getPlanSetting('prime_slots')) || 3;
  if (kind !== 'tutor') return getPrimeOccupied(pool, cap);

  return sortByNewestFirst(pool.filter((i) => isListVisible(i) && paidSku(i) === 'prime'));
}

/**
 * Basic 후보: Prime 점유 제외 (Pick과 중복 가능 — Basic은 기본 리스트)
 * 규칙: Basic은 부스트 없이 기본 노출. Prime만 제외하고 정렬·페이지.
 * @param {object[]} pool
 * @param {object[]} primeOccupied
 * @param {{ kind?: 'study_room'|'tutor'|'student', sort?: string }} [opts]
 */
export function getBasicPool(pool, primeOccupied, opts = {}) {
  const primeIds = new Set(primeOccupied.map((i) => i.id));
  const filtered = pool.filter((i) => isListVisible(i) && !primeIds.has(i.id));
  const kind = opts.kind || 'study_room';
  return sortListItems(filtered, kind, opts.sort || DEFAULT_LIST_SORT);
}

/**
 * 홈 처음 화면에서 과외쌤 프라임이 1~2장일 때 3칸까지 빈 카드로 채울지.
 * 찾기 검색 결과는 비회원만 채운다(기존). 학생 홈은 채우지 않는다.
 * @param {{ guest?: boolean, viewerRole?: string, surfaceMode?: string }} [opts]
 */
export function shouldPadTutorPrimeSlots(opts = {}) {
  if (opts.surfaceMode === 'search') return opts.guest === true;
  if (opts.guest === true) return true;
  return opts.viewerRole === 'study_room' || opts.viewerRole === 'tutor';
}

/**
 * 홈 픽 실제 카드가 0장일 때 홍보 빈 카드 수.
 * 공부방·과외쌤 모드 1장, 학생·비회원 0장(안내 한 줄).
 * 카드가 1장 이상이면 호출하지 않는다. pickSetSize로 빈 칸을 늘리지 않는다.
 * @param {{ guest?: boolean, viewerRole?: string }} [opts]
 */
export function homePickZeroPromoCount(opts = {}) {
  if (opts.guest !== true && (opts.viewerRole === 'study_room' || opts.viewerRole === 'tutor')) return 1;
  return 0;
}

/** 학생·비회원 픽 0장 안내. 「학부모」를 쓰지 않는다. */
export function pickZeroNote(kind) {
  return kind === 'tutor' ? '아직 추천 과외쌤이 없어요' : '아직 추천 공부방이 없어요';
}

export function getPrimeEmptyCopy(kind) {
  const s = getPlanRuntimeSettings();
  if (kind === 'tutor') {
    return {
      title: String(s.prime_empty_title_tutor || '이 자리에 과외쌤을 홍보하세요'),
      body: String(s.prime_empty_body_tutor || '지금 먼저 선점하세요 · 우리 동네 상단 노출'),
      cta: '유료상품 보기',
    };
  }
  return {
    title: String(s.prime_empty_title_study_room || '이 자리에 공부방을 홍보하세요'),
    body: String(s.prime_empty_body_study_room || '우리 동네 상단 노출을 먼저 잡아보세요'),
    cta: '유료상품 보기',
  };
}

export function getExposurePageSizes() {
  const s = getPlanRuntimeSettings();
  return {
    primeSlots: Number(s.prime_slots) || 3,
    pickSetSize: Number(s.pick_set_size) || 5,
    pickRotationMinutes: Number(s.pick_rotation_minutes) || 15,
    basicPageSize: Number(s.basic_page_size) || 20,
    regionScopeType: String(s.region_scope_type || 'dong'),
  };
}
