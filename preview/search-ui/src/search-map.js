/**
 * 공부방찾기 — 지도형 첫 화면 (지도 → 검색 → 결과)
 * 비로그인: 게스트 홈 hero-map 과 동일 구성
 *
 * 계약:
 * - 핀/카드: `[data-provider-id][data-provider-kind="study_room"]`
 * - `bindSearchMapPinLinks`: 핀 클릭 → 카드 강조 · 카드 hover → 핀 강조
 * - center: CanonicalLocation lat/lng 우선
 */

import { MOCK_REGIONS } from './search-schema.js';
import { bindStudyRoomMapSection } from '../../shared/naver-map.js';
import { normalizeLocation, logLocationDebug } from '../../shared/location-display.js';
import { peekStudyRoomPromo1 } from '@home-ui/study-room-home-seed.js';
import { getBasicPool, getPrimeOccupied } from '@home-ui/exposure-render.js';
import { readListSortFromHash, sortListItems } from '../../shared/list-sort.js';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;');
}

/** @param {string} regionLabel @param {{ lat?: number|null, lng?: number|null }} [coords] */
function parseRegionParts(regionLabel, coords = {}) {
  const canonical = normalizeLocation(
    { raw: regionLabel, lat: coords.lat, lng: coords.lng },
    'room',
  );
  const dong = canonical.dong || canonical.apartmentName || canonical.city || '우리동네';
  return {
    city: canonical.city,
    gu: canonical.district,
    dong,
    full: canonical.displayLabel || String(regionLabel || '').trim(),
    lat: canonical.lat,
    lng: canonical.lng,
  };
}

/**
 * 하단 베이직공부방 pagination total.
 * renderBasicListBlock 과 같은 식: prime 점유가 있으면 getBasicPool, 없으면 정렬한 전체.
 * 현재 페이지 행 수(items.length)는 쓰지 않는다.
 * @param {object[]} items
 */
function basicListTotal(items) {
  const list = Array.isArray(items) ? items : [];
  const occupied = getPrimeOccupied(list);
  const sort = readListSortFromHash('study_room', { mode: 'home' });
  const pool = occupied.length
    ? getBasicPool(list, occupied, { kind: 'study_room', sort })
    : sortListItems(list, 'study_room', sort);
  return pool.length;
}

/**
 * @param {object} parts
 * @param {object[]} items
 * @param {{ searched: boolean, region: string, resultSource: string, countNote: string, bannerStyle: 'guest'|'provider_room'|'search', providerHome?: boolean, roomCount?: number, lat?: number|null, lng?: number|null }} ctx
 */
function renderFloatMap(parts, items, ctx) {
  const { searched, region, resultSource, countNote, bannerStyle } = ctx;
  const isHero = bannerStyle === 'guest' || bannerStyle === 'provider_room';

  let sub = region;
  let statsHtml = '';
  let hint = `${searched ? '검색 결과 · ' : '내 지역 · '}${countNote}`;

  if (bannerStyle === 'guest') {
    sub = [parts.gu, '공부방·과외쌤을 한눈에 비교하세요'].filter(Boolean).join(' · ');
    statsHtml = `<dl class="hero-map__stats">
          <div><dt>목록</dt><dd>${items.length}</dd></div>
          <div><dt>상태</dt><dd>${searched ? '검색' : '지역'}</dd></div>
        </dl>`;
    hint = countNote;
  } else if (bannerStyle === 'provider_room' && ctx.providerHome) {
    sub = parts.dong ? `${parts.dong} 공부방 현황입니다` : '';
    statsHtml = `<dl class="hero-map__stats">
          <div><dt>공부방</dt><dd>${ctx.roomCount}</dd></div>
        </dl>`;
    hint = "우리동네의 공부방은 하단의 '우동공과 베이직공부방' 목록입니다";
  } else if (bannerStyle === 'provider_room') {
    sub = [parts.gu, '검색·지역 결과가 반영된 공부방 현황입니다'].filter(Boolean).join(' · ');
    statsHtml = `<dl class="hero-map__stats">
          <div><dt>공부방</dt><dd>${items.length}</dd></div>
          <div><dt>상태</dt><dd>${searched ? '검색' : '지역'}</dd></div>
        </dl>`;
    hint = countNote;
  }

  const variant = isHero ? 'hero' : 'search';
  const extraClass = isHero ? '' : ' hero-map--search';
  const allowFallback = isHero ? ' data-allow-fallback="true"' : '';
  const lat = ctx.lat ?? parts.lat;
  const lng = ctx.lng ?? parts.lng;
  const latAttr = lat != null ? ` data-map-lat="${esc(String(lat))}"` : '';
  const lngAttr = lng != null ? ` data-map-lng="${esc(String(lng))}"` : '';

  return `
    <section class="hero-map hero-map--float-rail${extraClass}" aria-label="공부방 지도" data-study-room-map data-map-variant="${variant}" data-region-label="${esc(region)}"${latAttr}${lngAttr} data-result-source="${esc(resultSource)}" data-result-items="activeResultItems"${allowFallback}>
      <div class="hero-map__canvas">
        <div class="hero-map__surface hero-map__surface--naver" aria-label="${esc(region)} 공부방 지도">
          <div class="naver-map-mount-host" data-naver-map-mount></div>
        </div>
      </div>
      <aside class="hero-map__banner" aria-label="지역 요약">
        <h2 class="hero-map__dong">${esc(parts.dong)}</h2>
        <p class="hero-map__sub">${esc(sub)}</p>
        ${statsHtml}
        <p class="hero-map__hint">${esc(hint)}</p>
      </aside>
    </section>`;
}

/**
 * @param {object[]} [activeResultItems]
 * @param {{ searched?: boolean, regionLabel?: string, resultSource?: 'region'|'search'|null, guestHomeStyle?: boolean, bannerStyle?: 'guest'|'provider_room'|'search', providerHome?: boolean, lat?: number|null, lng?: number|null }} [options]
 */
export function renderSearchMapBlock(activeResultItems = [], options = {}) {
  const searched = options.searched === true;
  const providerHome = options.providerHome === true;
  const requested = String(options.regionLabel || '').trim();
  const promo = providerHome ? peekStudyRoomPromo1() : '';
  const region = providerHome ? requested || promo : requested || MOCK_REGIONS.room;
  const parts = parseRegionParts(region, providerHome ? {} : { lat: options.lat, lng: options.lng });
  const items = Array.isArray(activeResultItems) ? activeResultItems : [];
  const resultSource = options.resultSource || (searched ? 'search' : 'region');
  const bannerStyle =
    options.bannerStyle ||
    (options.guestHomeStyle === false ? 'search' : options.guestHomeStyle === true ? 'guest' : 'guest');

  const countNote = items.length
    ? `${items.length}곳 · 하단 목록과 동일`
    : '표시할 공부방이 없습니다';

  logLocationDebug('map-overlay', {
    searched,
    region,
    overlayDong: parts.dong,
    lat: options.lat ?? parts.lat,
    lng: options.lng ?? parts.lng,
    pinCount: items.length,
    resultSource,
  });

  return renderFloatMap(parts, items, {
    searched,
    region,
    resultSource,
    countNote,
    bannerStyle,
    providerHome,
    roomCount: providerHome ? basicListTotal(items) : items.length,
    lat: providerHome ? parts.lat : (options.lat ?? parts.lat),
    lng: providerHome ? parts.lng : (options.lng ?? parts.lng),
  });
}

/**
 * @param {HTMLElement} root
 * @param {object[]} [activeResultItems]
 */
export function bindSearchMapPinLinks(root, activeResultItems = []) {
  const map = root.querySelector('[data-study-room-map]');
  if (!map) return;

  const clearFocus = () => {
    map.querySelectorAll('.is-map-focused').forEach((el) => el.classList.remove('is-map-focused'));
    root.querySelectorAll('.search-results [data-provider-id].is-map-focused').forEach((el) => {
      el.classList.remove('is-map-focused');
    });
  };

  const focusCard = (id) => {
    clearFocus();
    const card = root.querySelector(`.search-results [data-provider-id="${CSS.escape(String(id))}"]`);
    if (card) {
      card.classList.add('is-map-focused');
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    const pin = map.querySelector(`[data-map-pin-id="${CSS.escape(String(id))}"]`);
    pin?.classList.add('is-map-focused');
  };

  bindStudyRoomMapSection(root, activeResultItems, {
    regionLabel: map.getAttribute('data-region-label') || '',
    lat: map.getAttribute('data-map-lat') != null ? Number(map.getAttribute('data-map-lat')) : null,
    lng: map.getAttribute('data-map-lng') != null ? Number(map.getAttribute('data-map-lng')) : null,
    onPinClick: focusCard,
  });
}
