/**
 * 네이버 지도 1차 — 공부방 전용 (부록 지도 API 가이드)
 * - study_room 1개당 대표 핀 1개
 * - 리스트와 동일 dataset · 핀/카드 active 동기화
 * - VITE_NAVER_MAP_CLIENT_ID 미설정 시 CSS placeholder 유지
 */

/** @typedef {{ id: string|number, study_room_name?: string, title?: string, latitude?: string|number|null, longitude?: string|number|null, location_label?: string, region_label?: string, profile_status?: string }} StudyRoomMapItem */

import { STUDY_ROOM_MAP_COPY } from '../home-ui/src/empty-state-copy.js';

/** @typedef {{ lat: number, lng: number, label?: string }} RegionCenter */

/**
 * 대치역, 위키데이터 Q100860 P625(조회 2026-10-01).
 * 2026-10-02 한국어 위키백과 좌표 37.49444, 127.06333 과 약 9m 차이. 카카오 장소검색은 REST 키가 없어 대조하지 못했다.
 */
export const GUEST_MAP_CENTER = { lat: 37.494511, lng: 127.063369 };

/** 네이버 신규 타일 최대 줌 21 − 4 (공식 문서 NaverStyleMapTypeOptions) */
export const MAP_DEFAULT_ZOOM = 17;
const SDK_URL = 'https://oapi.map.naver.com/openapi/v3/maps.js';

/** @type {Promise<typeof naver>|null} */
let sdkPromise = null;

export function getNaverMapClientId() {
  const id = import.meta.env.VITE_NAVER_MAP_CLIENT_ID;
  return typeof id === 'string' ? id.trim() : '';
}

/**
 * @param {string|number|null|undefined} value
 * @returns {number|null}
 */
function parseCoord(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {string} label
 * @returns {RegionCenter|null}
 */
export function matchRegionCenter() {
  return null;
}

/**
 * @param {StudyRoomMapItem} item
 * @param {{ allowRegionFallback?: boolean }} [options]
 */
export function resolveStudyRoomPin(item) {
  if (!item || item.profile_status !== 'published') return null;

  const lat = parseCoord(item.latitude);
  const lng = parseCoord(item.longitude);
  if (lat == null || lng == null) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng, source: 'coords' };
}

/**
 * @param {StudyRoomMapItem[]} items
 * @param {{ allowRegionFallback?: boolean }} [options]
 */
export function mapStudyRoomPins(items) {
  const list = Array.isArray(items) ? items : [];
  /** @type {Array<{ id: string, name: string, lat: number, lng: number, source: string }>} */
  const pins = [];

  for (const item of list) {
    const pos = resolveStudyRoomPin(item);
    if (!pos) continue;
    const id = String(item.id ?? '');
    if (!id) continue;
    pins.push({
      id,
      name: item.study_room_name || item.title || `공부방 ${id}`,
      lat: pos.lat,
      lng: pos.lng,
      source: pos.source,
    });
  }

  return pins;
}

/**
 * @param {StudyRoomMapItem[]} items
 * @param {string} [regionLabel]
 * @param {{ lat?: number|null, lng?: number|null }} [explicitCenter]
 */
export function resolveMapCenter(items, regionLabel = '', explicitCenter = {}, options = {}) {
  const exLat = parseCoord(explicitCenter.lat);
  const exLng = parseCoord(explicitCenter.lng);
  if (exLat != null && exLng != null) {
    return { lat: exLat, lng: exLng, zoom: MAP_DEFAULT_ZOOM, source: 'canonical' };
  }

  // 공부방 홈·찾기는 usePins:false. 핀은 사업장 좌표라 홍보1 중심을 정하지 않는다.
  if (options.usePins !== false) {
    const pins = mapStudyRoomPins(items);
    if (pins.length > 0) {
      const lat = pins.reduce((sum, p) => sum + p.lat, 0) / pins.length;
      const lng = pins.reduce((sum, p) => sum + p.lng, 0) / pins.length;
      return { lat, lng, zoom: MAP_DEFAULT_ZOOM, source: 'pins' };
    }
  }

  const matched = matchRegionCenter(regionLabel);
  if (matched) return { lat: matched.lat, lng: matched.lng, zoom: MAP_DEFAULT_ZOOM, source: 'region_label' };

  return { lat: GUEST_MAP_CENTER.lat, lng: GUEST_MAP_CENTER.lng, zoom: MAP_DEFAULT_ZOOM, source: 'default' };
}

function loadNaverMapsSdk() {
  const clientId = getNaverMapClientId();
  if (!clientId) {
    return Promise.reject(new Error('VITE_NAVER_MAP_CLIENT_ID가 설정되지 않았습니다.'));
  }

  if (typeof window !== 'undefined' && window.naver?.maps) {
    return Promise.resolve(window.naver);
  }

  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `${SDK_URL}?ncpKeyId=${encodeURIComponent(clientId)}&submodules=geocoder`;
      script.async = true;
      script.onload = () => {
        if (window.naver?.maps) resolve(window.naver);
        else reject(new Error('네이버 지도 SDK 로드 실패'));
      };
      script.onerror = () => reject(new Error('네이버 지도 SDK를 불러올 수 없습니다.'));
      document.head.appendChild(script);
    });
  }

  return sdkPromise;
}

/**
 * 지역 라벨 → 중심 좌표(네이버 geocoder submodule). 못 찾으면 null. 대치역으로 대신하지 않는다.
 * @param {typeof naver} naverNs
 * @param {string} label
 * @returns {Promise<{ lat: number, lng: number }|null>}
 */
export function geocodeRegionCenter(naverNs, label) {
  return new Promise((resolve) => {
    const service = naverNs?.maps?.Service;
    const query = String(label || '').trim();
    if (!query || typeof service?.geocode !== 'function') {
      resolve(null);
      return;
    }
    try {
      service.geocode({ query }, (status, response) => {
        if (status !== service.Status?.OK) {
          resolve(null);
          return;
        }
        const addr = response?.v2?.addresses?.[0];
        const lat = parseCoord(addr?.y);
        const lng = parseCoord(addr?.x);
        resolve(lat != null && lng != null ? { lat, lng } : null);
      });
    } catch {
      resolve(null);
    }
  });
}

/**
 * 사업장주소 문자열의 좌표. 못 구하면 null.
 * 예외를 던지지 않아 주소 저장이 멈추지 않는다.
 * @param {string} address
 * @returns {Promise<{ latitude: string, longitude: string }|null>}
 */
export async function geocodeBusinessAddress(address) {
  const query = String(address || '').trim();
  if (!query) return null;
  try {
    const naverNs = await Promise.race([
      loadNaverMapsSdk(),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('timeout')), 8000);
      }),
    ]);
    const found = await Promise.race([
      geocodeRegionCenter(naverNs, query),
      new Promise((resolve) => {
        setTimeout(() => resolve(null), 8000);
      }),
    ]);
    if (!found) return null;
    if (found.lat < -90 || found.lat > 90 || found.lng < -180 || found.lng > 180) return null;
    return { latitude: String(found.lat), longitude: String(found.lng) };
  } catch {
    return null;
  }
}

export const REGION_PROMPT_MAP_STATUS = '희망지역을 등록하면 지도가 그 지역으로 이동합니다.';
export const REGION_GEOCODE_FAIL_STATUS = '지도에서 지역 위치를 찾지 못했습니다 · 리스트는 계속 이용할 수 있습니다.';

/** 비어 있으면 기본 줌. 들어온 줌은 자르지 않는다. */
function clampNeighborhoodZoom(zoom) {
  const z = Number(zoom);
  if (!Number.isFinite(z)) return MAP_DEFAULT_ZOOM;
  return z;
}

/**
 * @param {HTMLElement} mountEl
 * @param {{
 *   items?: StudyRoomMapItem[],
 *   regionLabel?: string,
 *   allowRegionFallback?: boolean,
 *   fitBounds?: boolean,
 *   variant?: 'hero'|'search'|'detail',
 *   geocodeRegion?: boolean,
 *   regionZoom?: number|null,
 *   onPinClick?: (id: string) => void,
 * }} [options]
 */
export async function mountStudyRoomMap(mountEl, options = {}) {
  if (!(mountEl instanceof HTMLElement)) return null;

  const items = Array.isArray(options.items) ? options.items : [];
  const regionLabel = options.regionLabel || '';
  const fitBounds = options.fitBounds !== false;
  const variant = options.variant || 'search';
  const pinAnchorsCenter = options.pinAnchorsCenter !== false;
  const memberMap = options.memberMap === true;
  const pins = mapStudyRoomPins(items);
  let center = resolveMapCenter(items, regionLabel, {
    lat: options.lat,
    lng: options.lng,
  }, { usePins: pinAnchorsCenter });

  /** @type {{ destroy: () => void, focusPin: (id: string) => void, getPins: () => typeof pins }|null} */
  let controller = null;

  const showStatus = (message, kind = 'info') => {
    mountEl.innerHTML = `<p class="naver-map-status naver-map-status--${kind}" role="status">${message}</p>`;
  };

  if (!options.naver && !getNaverMapClientId()) {
    showStatus('[설정 필요] VITE_NAVER_MAP_CLIENT_ID · 네이버 지도 API 키를 .env에 추가하세요.', 'config');
    return null;
  }

  try {
    const naver = options.naver || await loadNaverMapsSdk();
    const promptStatus = memberMap ? STUDY_ROOM_MAP_COPY.unplaced : REGION_PROMPT_MAP_STATUS;
    const failStatus = memberMap ? STUDY_ROOM_MAP_COPY.notFound : REGION_GEOCODE_FAIL_STATUS;
    // 빈 문자열은 명시적이다. 단지 주소가 없을 때 홍보 라벨로 바꾸지 않는다.
    const geocodeQuery = options.geocodeQuery != null ? String(options.geocodeQuery).trim() : String(regionLabel || '').trim();
    // 지역 기준 지도(학생): 좌표·핀이 없으면 대치역 기본값 대신 지역 라벨을 지오코딩한다.
    if (options.geocodeRegion && center.source === 'default') {
      if (!geocodeQuery) {
        showStatus(promptStatus, 'info');
        return null;
      }
      const found = await geocodeRegionCenter(naver, geocodeQuery);
      if (!found) {
        showStatus(failStatus, 'error');
        return null;
      }
      center = { ...found, zoom: clampNeighborhoodZoom(options.regionZoom ?? MAP_DEFAULT_ZOOM), source: 'geocode' };
    }
    // 로그인 회원 지도(공부방 홈·찾기·상세)는 대치역 기본 중심으로 열지 않는다.
    if (memberMap && center.source === 'default') {
      showStatus(promptStatus, 'info');
      return null;
    }
    mountEl.innerHTML = '';
    mountEl.classList.add('naver-map-mount', `naver-map-mount--${variant}`);

    const pinHit = { w: 36, h: 48 };
    const makePinIcon = (focused = false) => ({
      content: `<button type="button" class="naver-map-pin${focused ? ' is-focused' : ''}" aria-hidden="true"><img src="/assets/brand/src/udong-pin.png" alt="" /></button>`,
      size: new naver.maps.Size(pinHit.w, pinHit.h),
      anchor: new naver.maps.Point(pinHit.w / 2, pinHit.h),
    });

    const map = new naver.maps.Map(mountEl, {
      center: new naver.maps.LatLng(center.lat, center.lng),
      zoom: center.zoom,
      scrollWheel: false,
      zoomControl: variant !== 'detail',
      zoomControlOptions: { position: naver.maps.Position.TOP_RIGHT },
    });

    /** @type {Map<string, { marker: naver.maps.Marker, pin: typeof pins[number] }>} */
    const markerById = new Map();

    const fitToPins = () => {
      if (pins.length < 2) return;
      const bounds = new naver.maps.LatLngBounds(
        new naver.maps.LatLng(pins[0].lat, pins[0].lng),
        new naver.maps.LatLng(pins[0].lat, pins[0].lng),
      );
      for (const pin of pins) {
        bounds.extend(new naver.maps.LatLng(pin.lat, pin.lng));
      }
      map.fitBounds(bounds, { top: 48, right: 24, bottom: 24, left: 24 });
    };

    for (const pin of pins) {
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(pin.lat, pin.lng),
        map,
        title: pin.name,
        icon: makePinIcon(false),
      });

      naver.maps.Event.addListener(marker, 'click', () => {
        controller?.focusPin(pin.id);
        options.onPinClick?.(pin.id);
      });

      markerById.set(pin.id, { marker, pin });
    }

    if (pinAnchorsCenter && fitBounds && pins.length > 1) fitToPins();
    else if (pinAnchorsCenter && fitBounds && pins.length === 1) {
      map.setCenter(new naver.maps.LatLng(pins[0].lat, pins[0].lng));
      map.setZoom(MAP_DEFAULT_ZOOM);
    } else if (!fitBounds) {
      map.setCenter(new naver.maps.LatLng(center.lat, center.lng));
      map.setZoom(clampNeighborhoodZoom(center.zoom));
    } else if (!pinAnchorsCenter) {
      map.setCenter(new naver.maps.LatLng(center.lat, center.lng));
      map.setZoom(clampNeighborhoodZoom(center.zoom));
    }

    const clearFocus = () => {
      markerById.forEach(({ marker }) => {
        marker.setIcon(makePinIcon(false));
        marker.setZIndex(1);
      });
    };

    controller = {
      destroy() {
        clearFocus();
        markerById.forEach(({ marker }) => marker.setMap(null));
        markerById.clear();
        mountEl.innerHTML = '';
        mountEl.classList.remove('naver-map-mount', `naver-map-mount--${variant}`);
      },
      focusPin(id) {
        const entry = markerById.get(String(id));
        if (!entry) return;
        clearFocus();
        entry.marker.setIcon(makePinIcon(true));
        entry.marker.setZIndex(10);
        map.panTo(new naver.maps.LatLng(entry.pin.lat, entry.pin.lng));
      },
      getPins() {
        return pins;
      },
    };

    return controller;
  } catch (err) {
    const msg = err instanceof Error ? err.message : '지도를 불러올 수 없습니다.';
    showStatus(`${msg} · 리스트는 계속 이용할 수 있습니다.`, 'error');
    console.warn('[naver-map]', err);
    return null;
  }
}

/**
 * @param {HTMLElement} root
 * @param {StudyRoomMapItem[]} items
 * @param {{ regionLabel?: string, lat?: number|null, lng?: number|null, fitBounds?: boolean, onPinClick?: (id: string) => void }} [options]
 */
export async function bindStudyRoomMapSection(root, items, options = {}) {
  const section = root.querySelector('[data-study-room-map]');
  const mount = section?.querySelector('[data-naver-map-mount]');
  if (!(mount instanceof HTMLElement)) return null;

  const prev = /** @type {{ destroy?: () => void }|undefined} */ (mount._mapController);
  prev?.destroy?.();

  const latAttr = section?.getAttribute('data-map-lat');
  const lngAttr = section?.getAttribute('data-map-lng');
  const fitBounds =
    options.fitBounds === false
      ? false
      : options.fitBounds === true
        ? true
        : section?.getAttribute('data-fit-bounds') !== 'false';
  const controller = await mountStudyRoomMap(mount, {
    items,
    regionLabel: options.regionLabel || section?.getAttribute('data-region-label') || '',
    lat: options.lat ?? (latAttr != null ? Number(latAttr) : null),
    lng: options.lng ?? (lngAttr != null ? Number(lngAttr) : null),
    fitBounds,
    variant: section?.getAttribute('data-map-variant') || 'search',
    geocodeRegion: options.geocodeRegion === true || section?.getAttribute('data-geocode-region') === 'true',
    geocodeQuery: options.geocodeQuery !== undefined
      ? options.geocodeQuery
      : section?.hasAttribute?.('data-geocode-query')
        ? section.getAttribute('data-geocode-query')
        : undefined,
    memberMap: options.memberMap === true || section?.getAttribute('data-member-map') === 'true',
    pinAnchorsCenter: options.pinAnchorsCenter === false || section?.getAttribute('data-pin-center') === 'false' ? false : true,
    regionZoom: section?.getAttribute('data-map-zoom') != null ? Number(section.getAttribute('data-map-zoom')) : null,
    naver: options.naver,
    onPinClick: options.onPinClick,
  });

  mount._mapController = controller;
  return controller;
}
