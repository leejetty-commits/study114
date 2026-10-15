/**
 * 235-2: 사업장주소 좌표는 그 주소에서 구한 값만 저장한다.
 * 지오코딩 실패는 빈 좌표(NULL)이고 저장을 막지 않는다.
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { businessCoordsForSave, applyStudyRoomBasicToState } from '../preview/shared/study-room-basic-form.js';
import { geocodeBusinessAddress, geocodeRegionCenter } from '../preview/shared/naver-map.js';
import { applyRoomToState, payloadForStep } from '../preview/study-room-ui/src/form-collect.js';

let failed = 0;

function check(name, ok) {
  if (!ok) {
    failed += 1;
    console.error('FAIL', name);
  }
}

const signupHit = businessCoordsForSave(
  '서울 강남구 삼성로 212',
  '37.5065123',
  '127.0536123',
  '서울 강남구 삼성로 212',
);
check('signup keeps coords tagged to the same address', signupHit.latitude === '37.5065123' && signupHit.longitude === '127.0536123');
console.log('signup_request', JSON.stringify({
  address_text: '서울 강남구 삼성로 212',
  latitude: signupHit.latitude,
  longitude: signupHit.longitude,
}));

const signupMiss = businessCoordsForSave('서울 강남구 삼성로 212', '', '', '');
check('signup geocode miss sends blanks', signupMiss.latitude === '' && signupMiss.longitude === '');
console.log('signup_geocode_fail_request', JSON.stringify({
  address_text: '서울 강남구 삼성로 212',
  latitude: signupMiss.latitude,
  longitude: signupMiss.longitude,
}));

const stale = businessCoordsForSave('부산 해운대구 중동2로 11', '37.1000000', '127.1000000', '경기 성남시 분당구 분당로 50');
check('new address does not keep old coords', stale.latitude === '' && stale.longitude === '');

const pageState = {
  address_text: '경기 성남시 분당구 분당로 50',
  latitude: '37.1000000',
  longitude: '127.1000000',
  geocoded_address: '경기 성남시 분당구 분당로 50',
};
applyStudyRoomBasicToState(pageState, {
  address_text: '부산 해운대구 중동2로 11',
  latitude: '35.1631000',
  longitude: '129.1636000',
  geocoded_address: '부산 해운대구 중동2로 11',
});
const pagePayload = payloadForStep('basic_all', pageState);
check(
  'mypage address change sends the new coords',
  pagePayload.address_text === '부산 해운대구 중동2로 11'
    && pagePayload.latitude === '35.1631000'
    && pagePayload.longitude === '129.1636000',
);
console.log('mypage_address_change_request', JSON.stringify({
  address_text: pagePayload.address_text,
  latitude: pagePayload.latitude,
  longitude: pagePayload.longitude,
}));

const failedState = {
  address_text: '경기 성남시 분당구 분당로 50',
  latitude: '37.1000000',
  longitude: '127.1000000',
  geocoded_address: '경기 성남시 분당구 분당로 50',
};
applyStudyRoomBasicToState(failedState, {
  address_text: '부산 해운대구 중동2로 11',
  latitude: '',
  longitude: '',
  geocoded_address: '',
});
const failedPayload = payloadForStep('basic_all', failedState);
check(
  'mypage geocode miss does not resend old coords',
  failedPayload.latitude === '' && failedPayload.longitude === '' && failedPayload.address_text === '부산 해운대구 중동2로 11',
);
console.log('mypage_geocode_fail_request', JSON.stringify({
  address_text: failedPayload.address_text,
  latitude: failedPayload.latitude,
  longitude: failedPayload.longitude,
}));

const loaded = {};
applyRoomToState(loaded, {
  address_text: '서울 강남구 삼성로 212',
  latitude: '37.5065123',
  longitude: '127.0536123',
});
const unchanged = payloadForStep('basic_all', loaded);
check(
  'unchanged loaded address may keep its own coords',
  unchanged.latitude === '37.5065123' && unchanged.longitude === '127.0536123',
);

const naver = {
  maps: {
    Service: {
      Status: { OK: 'OK' },
      geocode(opts, cb) {
        if (opts.query === '없는주소') {
          cb('ZERO_RESULT', {});
          return;
        }
        cb('OK', { v2: { addresses: [{ y: '35.1631', x: '129.1636' }] } });
      },
    },
  },
};
const hit = await geocodeRegionCenter(naver, '부산 해운대구 중동2로 11');
const miss = await geocodeRegionCenter(naver, '없는주소');
check('geocode hit', hit && hit.lat === 35.1631 && hit.lng === 129.1636);
check('geocode miss is null', miss === null);

let threw = false;
let business = { latitude: 'x' };
try {
  business = await geocodeBusinessAddress('부산 해운대구 중동2로 11');
} catch {
  threw = true;
}
check('geocodeBusinessAddress does not throw', !threw);
check('geocodeBusinessAddress without a browser sdk is null', business === null);

const phpCwd = fileURLToPath(new URL('..', import.meta.url));
const phpArgs = ['scripts/verify-room-address-coords.php'];
let php = spawnSync('php', phpArgs, { cwd: phpCwd, encoding: 'utf8' });
if (php.error && php.error.code === 'ENOENT') {
  php = spawnSync('D:/php8.2/php.exe', phpArgs, { cwd: phpCwd, encoding: 'utf8' });
}
if (php.stdout) process.stdout.write(php.stdout);
if (php.stderr) process.stderr.write(php.stderr);
check('php coordinate store', php.status === 0);

if (failed) {
  console.error(`FAIL ${failed}`);
  process.exit(1);
}
console.log('OK room-address-coords');
