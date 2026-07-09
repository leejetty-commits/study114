/**
 * 네이버 지도 1차 — 공부방 전용 (부록 지도 API 가이드)
 * - study_room 1개당 대표 핀 1개
 * - 리스트와 동일 dataset · 핀/카드 active 동기화
 * - VITE_NAVER_MAP_CLIENT_ID 미설정 시 CSS placeholder 유지
 */

/** @typedef {{ id: string|number, study_room_name?: string, title?: string, latitude?: string|number|null, longitude?: string|number|null, location_label?: string, region_label?: string, profile_status?: string }} StudyRoomMapItem */

/** @typedef {{ lat: number, lng: number, label?: string }} RegionCenter */

/** @type {Array<{ test: RegExp, center: RegionCenter }>} */
const REGION_CENTER_FALLBACKS = [
  { test: /대치/, center: { lat: 37.4946, lng: 127.0626, label: '대치동' } },
  { test: /도곡/, center: { lat: 37.4882, lng: 127.0465, label: '도곡동' } },
  { test: /개포/, center: { lat: 37.4892, lng: 127.0661, label: '개포동' } },
  { test: /센텀/, center: { lat: 35.1695, lng: 129.131, label: '센텀동' } },
  { test: /우동/, center: { lat: 35.1631, lng: 129.1634, label: '우동' } },
  { test: /해운대/, center: { lat: 35.1631, lng: 129.1634, label: '해운대구' } },
  { test: /강남/, center: { lat: 37.4979, lng: 127.0276, label: '강남구' } },
  { test: /서울/, center: { lat: 37.5665, lng: 126.978, label: '서울' } },
  { test: /부산/, center: { lat: 35.1796, lng: 129.0756, label: '부산' } },
];

const DEFAULT_CENTER = { lat: 37.4946, lng: 127.0626, label: '대치동' };
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
export function matchRegionCenter(label) {
  const text = String(label || '').trim();
  if (!text) return null;
  for (const { test, center } of REGION_CENTER_FALLBACKS) {
    if (test.test(text)) return center;
  }
  return null;
}

/**
 * @param {StudyRoomMapItem} item
 * @param {{ allowRegionFallback?: boolean }} [options]
 */
export function resolveStudyRoomPin(item, options = {}) {
  if (item.profile_status && item.profile_status !== 'published') return null;

  const lat = parseCoord(item.latitude);
  const lng = parseCoord(item.longitude);
  if (lat != null && lng != null) {
    return { lat, lng, source: 'coords' };
  }

  if (options.allowRegionFallback) {
    const label = item.location_label || item.region_label || '';
    const center = matchRegionCenter(label);
    if (center) return { ...center, source: 'region_fallback' };
  }

  return null;
}

/**
 * @param {StudyRoomMapItem[]} items
 * @param {{ allowRegionFallback?: boolean }} [options]
 */
export function mapStudyRoomPins(items, options = {}) {
  const list = Array.isArray(items) ? items : [];
  /** @type {Array<{ id: string, name: string, lat: number, lng: number, source: string }>} */
  const pins = [];

  for (const item of list) {
    const pos = resolveStudyRoomPin(item, options);
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
 */
export function resolveMapCenter(items, regionLabel = '') {
  const pins = mapStudyRoomPins(items, { allowRegionFallback: true });
  if (pins.length > 0) {
    const lat = pins.reduce((sum, p) => sum + p.lat, 0) / pins.length;
    const lng = pins.reduce((sum, p) => sum + p.lng, 0) / pins.length;
    return { lat, lng, zoom: pins.length === 1 ? 16 : 14 };
  }

  const matched = matchRegionCenter(regionLabel);
  if (matched) return { lat: matched.lat, lng: matched.lng, zoom: 14 };

  return { lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng, zoom: 13 };
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
      script.src = `${SDK_URL}?ncpKeyId=${encodeURIComponent(clientId)}`;
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
 * @param {HTMLElement} mountEl
 * @param {{
 *   items?: StudyRoomMapItem[],
 *   regionLabel?: string,
 *   allowRegionFallback?: boolean,
 *   variant?: 'hero'|'search'|'detail',
 *   onPinClick?: (id: string) => void,
 * }} [options]
 */
export async function mountStudyRoomMap(mountEl, options = {}) {
  if (!(mountEl instanceof HTMLElement)) return null;

  const items = Array.isArray(options.items) ? options.items : [];
  const regionLabel = options.regionLabel || '';
  const allowRegionFallback = options.allowRegionFallback !== false;
  const variant = options.variant || 'search';
  const pins = mapStudyRoomPins(items, { allowRegionFallback });
  const center = resolveMapCenter(items, regionLabel);

  /** @type {{ destroy: () => void, focusPin: (id: string) => void, getPins: () => typeof pins }|null} */
  let controller = null;

  const showStatus = (message, kind = 'info') => {
    mountEl.innerHTML = `<p class="naver-map-status naver-map-status--${kind}" role="status">${message}</p>`;
  };

  if (!getNaverMapClientId()) {
    showStatus('[설정 필요] VITE_NAVER_MAP_CLIENT_ID · 네이버 지도 API 키를 .env에 추가하세요.', 'config');
    return null;
  }

  if (pins.length === 0) {
    showStatus('표시할 위치 정보가 없습니다 · 목록은 그대로 유지됩니다.', 'empty');
    return null;
  }

  try {
    const naver = await loadNaverMapsSdk();
    mountEl.innerHTML = '';
    mountEl.classList.add('naver-map-mount', `naver-map-mount--${variant}`);

    const makePinIcon = (focused = false) => ({
      content: `<button type="button" class="naver-map-pin${focused ? ' is-focused' : ''}" aria-hidden="true"></button>`,
      size: new naver.maps.Size(22, 22),
      anchor: new naver.maps.Point(11, 11),
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

    if (pins.length > 1) fitToPins();
    else if (pins.length === 1) {
      map.setCenter(new naver.maps.LatLng(pins[0].lat, pins[0].lng));
      map.setZoom(16);
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
 * @param {{ regionLabel?: string, onPinClick?: (id: string) => void }} [options]
 */
export async function bindStudyRoomMapSection(root, items, options = {}) {
  const section = root.querySelector('[data-study-room-map]');
  const mount = section?.querySelector('[data-naver-map-mount]');
  if (!(mount instanceof HTMLElement)) return null;

  const prev = /** @type {{ destroy?: () => void }|undefined} */ (mount._mapController);
  prev?.destroy?.();

  const controller = await mountStudyRoomMap(mount, {
    items,
    regionLabel: options.regionLabel || section?.getAttribute('data-region-label') || '',
    allowRegionFallback: section?.getAttribute('data-allow-fallback') !== 'false',
    variant: section?.getAttribute('data-map-variant') || 'search',
    onPinClick: options.onPinClick,
  });

  mount._mapController = controller;
  return controller;
}
