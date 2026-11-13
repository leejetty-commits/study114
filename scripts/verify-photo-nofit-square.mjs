/**
 * 368-card-contain — 잘린 1:1(basic)보다 fit/프라임·원본 우선, 칸은 contain+단색.
 * (구 290: fit 없으면 square basic — 폐지)
 * 실행: npm run verify:photo-nofit-square
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderStudyRoomDetailBody } from '../preview/home-ui/src/detail-decision/studyroom-detail.js';
import { renderTutorDetailBody } from '../preview/home-ui/src/detail-decision/tutor-detail.js';
import { collectShopPhotos } from '../preview/home-ui/src/study-room-reg/shop-formatters.js';
import { listingImage } from '../preview/home-ui/src/exposure-render.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
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
ok('공부방 fit → src=fit, square 없음', !isSquare(roomFit) && srcOf(roomFit) === '/room-fit.webp');

const roomBasic = renderStudyRoomDetailBody({
  study_room_name: '정사각방',
  image_path_basic_720: '/room-720.jpg',
  image_path_prime: '/room-prime.jpg',
}, 'parent');
ok('공부방 fit 없음 → prime 우선(1:1 basic 아님)', !isSquare(roomBasic) && srcOf(roomBasic) === '/room-prime.jpg');

const room360 = renderStudyRoomDetailBody({
  study_room_name: '작은방',
  image_path_basic_360: '/room-360.jpg',
  image_path_prime: '/room-prime.jpg',
}, 'parent');
ok('공부방 basic_360+prime → prime', !isSquare(room360) && srcOf(room360) === '/room-prime.jpg');

const roomNone = renderStudyRoomDetailBody({ study_room_name: '빈방' }, 'parent');
ok('공부방 사진 없음 → 로고', photoOf(roomNone).includes('/assets/brand/room-card-default-pick.svg') && !isSquare(roomNone));

const roomLast = renderStudyRoomDetailBody({
  study_room_name: '옛방',
  image_path_prime: '/room-prime.jpg',
  image_path: '/room-basic-path.jpg',
}, 'parent');
ok('공부방 image_path+prime → prime', !isSquare(roomLast) && srcOf(roomLast) === '/room-prime.jpg');

const tutorFit = renderTutorDetailBody({
  tutor_display_name: '핏쌤',
  image_path_fit: '/tutor-fit.webp',
  image_path_basic_720: '/tutor-720.jpg',
  image_path: '/tutor-path.jpg',
}, 'parent');
ok('과외쌤 fit → fit', !isSquare(tutorFit) && srcOf(tutorFit) === '/tutor-fit.webp');

const tutorBasic = renderTutorDetailBody({
  tutor_display_name: '정사각쌤',
  image_path: '/tutor-path.jpg',
  image_path_basic_720: '/tutor-720.jpg',
  image_path_prime: '/tutor-prime.jpg',
}, 'parent');
ok('과외쌤 fit 없음 → prime/path 우선, square 없음', !isSquare(tutorBasic) && srcOf(tutorBasic) === '/tutor-prime.jpg');

const tutorLast = renderTutorDetailBody({
  tutor_display_name: '옛쌤',
  image_path: '/tutor-photo.jpg',
}, 'parent');
ok('과외쌤 path만 → image_path', !isSquare(tutorLast) && srcOf(tutorLast) === '/tutor-photo.jpg');

const tutorNone = renderTutorDetailBody({ tutor_display_name: '빈쌤' }, 'parent');
ok('과외쌤 사진 없음 → 첫 글자', photoOf(tutorNone).includes('p24-fit-photo--empty') && photoOf(tutorNone).includes('>빈<'));

const shopNone = collectShopPhotos({ images: [{ basic_720_path: '/s-720.jpg', prime_1280_path: '/s-prime.jpg', image_path: '/s.jpg' }] });
const shopFit = collectShopPhotos({ images: [{ fit_1280_path: '/s-fit.webp', basic_720_path: '/s-720.jpg', prime_1280_path: '/s-prime.jpg' }] });
ok('마이샵 fit 없음 → image_path(원본) 우선', shopNone[0]?.src === '/s.jpg');
ok('마이샵 fit 있음 → fit', shopFit[0]?.src === '/s-fit.webp');
ok('마이샵 blurSrc 제거', shopFit[0]?.blurSrc === undefined && shopNone[0]?.blurSrc === undefined);

ok(
  'listingImage fit 우선',
  listingImage({ image_path_fit: '/f.webp', image_path_prime: '/p.jpg', image_path_basic_360: '/b.jpg' }, 'list') === '/f.webp',
);
ok(
  'listingImage fit 없으면 prime (basic 360 아님)',
  listingImage({ image_path_prime: '/p.jpg', image_path_basic_360: '/b.jpg' }, 'pick') === '/p.jpg',
);

const css = ['home-listings-headings.css', 'home-listings-cards.css', 'home-listings.css'].map((name) => readFileSync(join(ROOT, 'preview/home-ui/src/styles', name), 'utf8')).join('').replace(/^@import\s+['"]\.\/[^'"]+['"];\r?\n/gm, '').replace(/\r\n/g, '\n');
ok('카드 expo-media contain', /\.expo-media img \{[^}]*object-fit:\s*contain/.test(css));
ok('상세 흐림 ::before 없음', !/\.p24-dl \.p24-fit-photo:not\(\.p24-fit-photo--empty\)::before/.test(css));

const myshopCss = readFileSync(join(ROOT, 'preview/home-ui/src/styles/myshop.css'), 'utf8');
ok('마이샵 shop-photo-blur 제거', !myshopCss.includes('shop-photo-blur'));

if (failed) {
  console.log(`\nverify-photo-nofit-square FAILED (${failed})`);
  process.exit(1);
}
console.log('\nverify-photo-nofit-square OK');
