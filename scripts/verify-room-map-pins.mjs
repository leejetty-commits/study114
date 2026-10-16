/**
 * 235-4: 핀은 게시된 공부방의 저장 좌표만. 동·단지로 대신 찍지 않는다.
 */
import {
  distanceKm,
  MAP_ZOOM_FLOOR_DONG,
  pinOutsideOffset,
  pinsWithinNeighborhood,
  resolveStudyRoomPin,
  zoomAfterFit,
} from '../preview/shared/naver-map.js';

let failed = 0;
function check(name, ok) {
  if (!ok) {
    failed += 1;
    console.error('FAIL', name);
  }
}

const published = resolveStudyRoomPin({
  id: 13,
  profile_status: 'published',
  latitude: '37.5065000',
  longitude: '127.0633000',
  location_label: '대치동',
});
check('published coords', published && published.source === 'coords' && published.lat === 37.5065);

const draft = resolveStudyRoomPin({
  id: 6,
  profile_status: 'draft',
  latitude: '37.7399316',
  longitude: '127.0624999',
  location_label: '신곡동',
});
check('draft has no pin', draft === null);

const missing = resolveStudyRoomPin({
  id: 12,
  profile_status: 'published',
  latitude: null,
  longitude: null,
  location_label: '대청동',
  region_label: '대청동',
});
check('missing coords has no pin', missing === null);

const labelOnly = resolveStudyRoomPin({
  id: 11,
  profile_status: 'published',
  location_label: '수내동',
});
check('dong label is not a pin', labelOnly === null);

check('fit zoom stays wide', zoomAfterFit(11, 15) === 11);
check('fit zoom does not go past the neighborhood', zoomAfterFit(19, 15) === 15);
check('same zoom stays', zoomAfterFit(15, 15) === 15);

const pad = { top: 52, right: 22, bottom: 8, left: 22 };
check('pin inside the view', pinOutsideOffset({ x: 100, y: 80 }, { width: 400, height: 300 }, pad) === false);
check('pin above the view', pinOutsideOffset({ x: 100, y: 10 }, { width: 400, height: 300 }, pad) === true);
check('pin under the summary card', pinOutsideOffset({ x: 390, y: 80 }, { width: 400, height: 300 }, { ...pad, right: 40 }) === true);

const daechi = { lat: 37.494511, lng: 127.063369 };
const room13 = {
  id: 13,
  study_room_name: '테스트공부방3',
  profile_status: 'published',
  latitude: 37.4977414,
  longitude: 127.0650701,
};
const gimhae = {
  id: 12,
  study_room_name: '계동공부방1',
  profile_status: 'published',
  latitude: 35.1864526,
  longitude: 128.7947013,
};
const neighborhoodZoom = 15;
const pinsA = pinsWithinNeighborhood(
  [room13, gimhae].map((item) => {
    const pos = resolveStudyRoomPin(item);
    return { id: String(item.id), lat: pos.lat, lng: pos.lng };
  }),
  daechi,
);
const zoomA = pinsA.some((pin) => distanceKm(daechi.lat, daechi.lng, pin.lat, pin.lng) > 10)
  ? zoomAfterFit(8, neighborhoodZoom, MAP_ZOOM_FLOOR_DONG)
  : neighborhoodZoom;
check('a gimhae pin is outside 10km', pinsA.length === 1 && pinsA[0].id === '13');
check('a zoom stays at the neighborhood', zoomA === neighborhoodZoom);
console.log('verify-a pins', pinsA.map((pin) => pin.id).join(','), 'zoom', zoomA);

const north9 = daechi.lat + 9 / 111.195;
const near = {
  id: 'near',
  profile_status: 'published',
  latitude: north9,
  longitude: daechi.lng,
};
const pinsB = pinsWithinNeighborhood(
  [room13, near].map((item) => {
    const pos = resolveStudyRoomPin(item);
    return { id: String(item.id), lat: pos.lat, lng: pos.lng };
  }),
  daechi,
);
const kmB = distanceKm(daechi.lat, daechi.lng, north9, daechi.lng);
const fittedWide = 11;
const zoomB = zoomAfterFit(fittedWide, neighborhoodZoom, MAP_ZOOM_FLOOR_DONG);
check('b both pins inside 10km', pinsB.length === 2 && kmB <= 10 && kmB >= 8);
check('b zoom is at least the floor', zoomB >= MAP_ZOOM_FLOOR_DONG && zoomB === MAP_ZOOM_FLOOR_DONG);
console.log('verify-b pins', pinsB.map((pin) => pin.id).join(','), 'km', kmB.toFixed(2), 'zoom', zoomB);

if (failed) {
  console.error('FAIL', failed);
  process.exit(1);
}
console.log('OK room-map-pins');
