/**
 * fit 없는 펼친 카드·마이샵은 정사각 basic. basic이 없을 때만 기존 16:9.
 * 실행: npm run verify:photo-nofit-square
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderStudyRoomDetailBody } from '../preview/home-ui/src/detail-decision/studyroom-detail.js';
import { renderTutorDetailBody } from '../preview/home-ui/src/detail-decision/tutor-detail.js';
import { collectShopPhotos } from '../preview/home-ui/src/study-room-reg/shop-formatters.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'cec16f85';
let failed = 0;

function ok(name, cond, detail = '') {
  if (cond) {
    console.log(`PASS  ${name}`);
    return;
  }
  failed += 1;
  console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
}

function photoOf(html) {
  const m = html.match(/<dt>사진<\/dt><dd>([\s\S]*?)<\/dd>/);
  return m ? m[1] : '';
}

function isSquare(html) {
  return photoOf(html).includes('p24-fit-photo--square');
}

function srcOf(html) {
  return photoOf(html).match(/<img[^>]*\ssrc="([^"]*)"/)?.[1] || '';
}

const roomFit = renderStudyRoomDetailBody({
  study_room_name: '가로방',
  image_path_fit: '/room-fit.webp',
  image_path_basic_720: '/room-720.jpg',
  image_path_prime: '/room-prime.jpg',
}, 'parent');
ok('공부방 fit → 16:9, src = fit', !isSquare(roomFit) && srcOf(roomFit) === '/room-fit.webp' && photoOf(roomFit).includes('p24-fit-photo'));

const roomBasic = renderStudyRoomDetailBody({
  study_room_name: '정사각방',
  image_path_basic_720: '/room-720.jpg',
  image_path_prime: '/room-prime.jpg',
}, 'parent');
function roomBasicOk(html) {
  const photo = photoOf(html);
  return photo.includes('p24-fit-photo--square') && srcOf(html) === '/room-720.jpg' && !photo.includes('/room-prime.jpg');
}
ok('공부방 fit 없음 + basic_720 → square, prime 없음', roomBasicOk(roomBasic));

const room360 = renderStudyRoomDetailBody({
  study_room_name: '작은방',
  image_path_basic_360: '/room-360.jpg',
  image_path_prime: '/room-prime.jpg',
}, 'parent');
ok('공부방 basic_360만 → square src = basic_360', isSquare(room360) && srcOf(room360) === '/room-360.jpg');

const roomNone = renderStudyRoomDetailBody({ study_room_name: '빈방' }, 'parent');
ok('공부방 사진 없음 → 로고', photoOf(roomNone).includes('/assets/brand/room-card-default-pick.svg') && !isSquare(roomNone));

const roomLast = renderStudyRoomDetailBody({
  study_room_name: '옛방',
  image_path_prime: '/room-prime.jpg',
  image_path: '/room-basic-path.jpg',
}, 'parent');
ok('공부방 basic 없음 → image_path_prime, 16:9', !isSquare(roomLast) && srcOf(roomLast) === '/room-prime.jpg');

const tutorBasic = renderTutorDetailBody({
  tutor_display_name: '정사각쌤',
  image_path: '/tutor-prime.jpg',
  image_path_basic_720: '/tutor-720.jpg',
}, 'parent');
function tutorBasicOk(html) {
  const photo = photoOf(html);
  return photo.includes('p24-fit-photo--square') && srcOf(html) === '/tutor-720.jpg' && !photo.includes('/tutor-prime.jpg');
}
ok('과외쌤 fit 없음 + basic_720 → square, image_path 안 씀', tutorBasicOk(tutorBasic));

const tutorLast = renderTutorDetailBody({
  tutor_display_name: '옛쌤',
  image_path: '/tutor-photo.jpg',
}, 'parent');
ok('과외쌤 basic 없음 → image_path, 16:9', !isSquare(tutorLast) && srcOf(tutorLast) === '/tutor-photo.jpg');

const tutorNone = renderTutorDetailBody({ tutor_display_name: '빈쌤' }, 'parent');
ok('과외쌤 사진 없음 → 첫 글자', photoOf(tutorNone).includes('p24-fit-photo--empty') && photoOf(tutorNone).includes('>빈<'));

const shopNone = collectShopPhotos({ images: [{ basic_720_path: '/s-720.jpg', prime_1280_path: '/s-prime.jpg', image_path: '/s.jpg' }] });
const shopFit = collectShopPhotos({ images: [{ fit_1280_path: '/s-fit.webp', basic_720_path: '/s-720.jpg', prime_1280_path: '/s-prime.jpg' }] });
ok('마이샵 fit 없음 → basic_720', shopNone[0]?.src === '/s-720.jpg');
ok('마이샵 fit 있음 → fit', shopFit[0]?.src === '/s-fit.webp');

const css = readFileSync(join(ROOT, 'preview/home-ui/src/styles/home-listings.css'), 'utf8').replace(/\r\n/g, '\n');
const rule = css.match(/\.p24-dl \.p24-fit-photo--square \{[^}]+\}/);
const squareHits = [...css.matchAll(/[^\n]*p24-fit-photo--square[^\n]*/g)].map((m) => m[0]);
ok('CSS square는 1:1이고 .p24-dl 안', Boolean(rule) && /aspect-ratio:\s*1\s*\/\s*1/.test(rule[0]) && squareHits.length > 0 && squareHits.every((line) => line.includes('.p24-dl ')));

const shown = spawnSync('git', ['show', `${BASE}:preview/home-ui/src/exposure-render.js`], { cwd: ROOT, encoding: 'utf8' });
const current = readFileSync(join(ROOT, 'preview/home-ui/src/exposure-render.js'), 'utf8').replace(/\r\n/g, '\n');
ok('카드 목록 exposure-render.js = 3a39df06', shown.status === 0 && current === shown.stdout.replace(/\r\n/g, '\n'));

const tamperedRoom = roomBasic.replace('p24-fit-photo--square', 'p24-fit-photo').replace('/room-720.jpg', '/room-prime.jpg');
const tamperedTutor = tutorBasic.replace('p24-fit-photo--square', 'p24-fit-photo').replace('/tutor-720.jpg', '/tutor-prime.jpg');
ok('변조: prime·image_path로 돌리면 공부방·과외쌤 정사각 검사가 잡음', roomBasicOk(roomBasic) && tutorBasicOk(tutorBasic) && !roomBasicOk(tamperedRoom) && !tutorBasicOk(tamperedTutor));

if (failed) {
  console.log(`\nverify-photo-nofit-square FAILED (${failed})`);
  process.exit(1);
}
console.log('\nverify-photo-nofit-square OK');
