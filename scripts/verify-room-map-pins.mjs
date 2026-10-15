/**
 * 235-4: 핀은 게시된 공부방의 저장 좌표만. 동·단지로 대신 찍지 않는다.
 */
import { resolveStudyRoomPin } from '../preview/shared/naver-map.js';

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

if (failed) {
  console.error('FAIL', failed);
  process.exit(1);
}
console.log('OK room-map-pins');
